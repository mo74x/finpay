/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService, TransactionDocument } from './search.service';

@Controller('v1/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * GET /v1/search/transactions?query=TRX-123&status=SUCCESS&minAmount=100&size=10&from=0
   *
   * Full-text search across transactions with optional filters.
   */
  @Get('transactions')
  async searchTransactions(
    @Query('query') query: string,
    @Query('fromWalletId') fromWalletId?: string,
    @Query('status') status?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('from') from?: string,
    @Query('size') size?: string,
  ): Promise<{ total: number; hits: TransactionDocument[] }> {
    return this.searchService.searchTransactions({
      query: query ?? '',
      fromWalletId,
      status,
      minAmount: minAmount ? parseInt(minAmount, 10) : undefined,
      maxAmount: maxAmount ? parseInt(maxAmount, 10) : undefined,
      from: from ? parseInt(from, 10) : 0,
      size: size ? parseInt(size, 10) : 10,
    });
  }

  /**
   * GET /v1/search/transactions/:ref
   *
   * Point-lookup for a single transaction by its reference ID.
   */
  @Get('transactions/:ref')
  async getTransaction(
    @Param('ref') ref: string,
  ): Promise<TransactionDocument> {
    const doc = await this.searchService.getTransactionByRef(ref);
    if (!doc) {
      throw new NotFoundException(`Transaction ${ref} not found in search index`);
    }
    return doc;
  }
}
