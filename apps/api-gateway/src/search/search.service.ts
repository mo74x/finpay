/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

export interface TransactionDocument {
  transactionRef: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  status: string;
  createdAt: string;
  correlationId?: string;
}

const TRANSACTIONS_INDEX = 'transactions';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  /**
   * Index a completed transaction document into Elasticsearch.
   * Call this after a successful transfer in the ledger.
   */
  async indexTransaction(doc: TransactionDocument): Promise<void> {
    await this.elasticsearchService.index({
      index: TRANSACTIONS_INDEX,
      id: doc.transactionRef,
      document: {
        ...doc,
        '@timestamp': doc.createdAt,
      },
    });
    this.logger.log(`[SEARCH] Indexed transaction ${doc.transactionRef}`);
  }

  /**
   * Full-text search across transaction refs, wallet IDs, and statuses.
   * Supports optional filters for amount range and date range.
   */
  async searchTransactions(params: {
    query: string;
    fromWalletId?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
    from?: number;
    size?: number;
  }): Promise<{ total: number; hits: TransactionDocument[] }> {
    const { query, fromWalletId, status, minAmount, maxAmount, from = 0, size = 10 } = params;

    const must: object[] = [
      {
        multi_match: {
          query,
          fields: ['transactionRef', 'fromWalletId', 'toWalletId', 'status'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      },
    ];

    const filter: object[] = [];

    if (fromWalletId) {
      filter.push({ term: { fromWalletId } });
    }

    if (status) {
      filter.push({ term: { status } });
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.push({
        range: {
          amount: {
            ...(minAmount !== undefined && { gte: minAmount }),
            ...(maxAmount !== undefined && { lte: maxAmount }),
          },
        },
      });
    }

    const response = await this.elasticsearchService.search<TransactionDocument>({
      index: TRANSACTIONS_INDEX,
      from,
      size,
      query: {
        bool: { must, filter },
      },
      sort: [{ createdAt: { order: 'desc' } }],
    });

    const hits = response.hits.hits.map((h) => h._source as TransactionDocument);
    const total =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : response.hits.total?.value ?? 0;

    return { total, hits };
  }

  /**
   * Look up a single transaction by its reference ID.
   */
  async getTransactionByRef(
    transactionRef: string,
  ): Promise<TransactionDocument | null> {
    try {
      const response = await this.elasticsearchService.get<TransactionDocument>({
        index: TRANSACTIONS_INDEX,
        id: transactionRef,
      });
      return response._source ?? null;
    } catch {
      return null;
    }
  }
}
