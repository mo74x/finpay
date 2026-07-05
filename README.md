# FinPay — Production-Ready Fintech Payment Platform

A **NestJS microservices monorepo** implementing a production-grade backend for a fintech payment platform. Built to demonstrate enterprise-level backend engineering patterns including double-entry accounting, distributed tracing, async job queues, and full-text search.

> **GitHub**: [github.com/mo74x/finpay](https://github.com/mo74x/finpay)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (HTTP)                         │
└────────────────────────────┬────────────────────────────────┘
                             │ REST
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway  :3000                         │
│                                                              │
│  • JWT Authentication (register / login)                     │
│  • Idempotency (Redis-backed, 24h TTL)                       │
│  • Distributed Tracing (x-correlation-id)                    │
│  • Input Validation (class-validator DTOs)                   │
│  • Elasticsearch Search Module                               │
│  • Structured Logging (pino)                                 │
│  • Swagger Docs  →  /api/docs                                │
└───────────────┬──────────────────────────────────┬──────────┘
                │ TCP (NestJS Microservices)         │ HTTP
                ▼                                   ▼
┌───────────────────────────┐         ┌─────────────────────┐
│   Core Ledger  :8877      │         │   Elasticsearch     │
│                           │         │   :9200             │
│  • Double-entry ledger    │         └─────────────────────┘
│  • ACID transactions      │
│  • Row-level locking      │
│  • Ledger imbalance check │
│  • Wallet ownership verify│
└───────────┬───────────────┘
            │ PostgreSQL
            ▼
┌────────────────────────────┐
│   PostgreSQL  :5432        │
│   (Users, Wallets,         │
│    LedgerEntries)          │
└────────────────────────────┘

            │ Bull Queue (Redis)
            ▼
┌───────────────────────────────────────┐
│   Worker Notifications                │
│                                       │
│  • PDF Invoice generation (simulated) │
│  • Email dispatch (simulated)         │
│  • Auto-retry: 3 attempts, 5s backoff │
└───────────────────────────────────────┘
            │
            ▼
┌────────────────────┐
│   Redis  :6379     │
│  (Job Queue +      │
│   Idempotency)     │
└────────────────────┘
```

---

## Key Engineering Decisions

| Concern | Solution | Why |
|---|---|---|
| Financial correctness | ACID transactions + `FOR UPDATE` row locking | Prevents race conditions on concurrent debits |
| Double-entry accounting | Paired debit/credit `LedgerEntry` records | Immutable audit trail, imbalance detection |
| Duplicate requests | Redis-backed idempotency (24h TTL) | Safe for network retries; works across restarts |
| Performance | Async invoice queue (Bull/Redis) | Transfer response in ~40ms; heavy work in background |
| Observability | UUID correlation IDs across TCP boundaries | Full end-to-end request tracing |
| Security | bcrypt (12 rounds) + JWT (15min expiry) | Industry-standard auth with timing-attack resistance |
| Search | Elasticsearch full-text + fuzzy matching | Scalable transaction history queries |

---

## Microservices

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 3000 | HTTP entry point, auth, validation, search |
| `core-ledger` | 8877 (TCP) | Ledger writes, wallet management |
| `worker-notifications` | — | Async invoice + email queue consumer |

---

## Quick Start (Docker)

**Prerequisites**: Docker and Docker Compose installed.

```bash
# Clone the repository
git clone https://github.com/mo74x/finpay.git
cd finpay

# Start all services (PostgreSQL, Redis, Elasticsearch + all 3 NestJS apps)
docker compose up --build

# Run Prisma migrations (first time only — in a separate terminal)
docker compose exec core-ledger npx prisma migrate deploy
```

The API will be available at **http://localhost:3000**  
Swagger docs at **http://localhost:3000/api/docs**

---

## Quick Start (Local Development)

**Prerequisites**: Node.js 22+, PostgreSQL, Redis, Elasticsearch running locally.

```bash
npm install

# Copy and configure environment variables
cp .env.example .env   # edit DATABASE_URL, JWT_SECRET, etc.

# Run Prisma migrations
npx prisma migrate dev

# Start all services in parallel (separate terminals)
npm run start:dev api-gateway
npm run start:dev core-ledger
npm run start:dev worker-notifications
```

---

## API Reference

### Authentication

```
POST /v1/auth/register   →  { accessToken, userId }
POST /v1/auth/login      →  { accessToken, userId }
```

### Payments

All payment endpoints require:
- `Authorization: Bearer <token>`
- `x-idempotency-key: <uuid>` (prevents duplicate transfers)

```
POST /v1/payments/transfer
Body: { fromWalletId, toWalletId, amount }   ← amount in cents
```

### Search (JWT required)

```
GET /v1/search/transactions?query=TRX-123&status=SUCCESS&minAmount=100&from=0&size=10
GET /v1/search/transactions/:ref
```

**Interactive Swagger UI**: `http://localhost:3000/api/docs`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | `super-secure-fintech-secret-key` | JWT signing secret — **change in production** |
| `REDIS_HOST` | `localhost` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `ELASTICSEARCH_NODE` | `http://localhost:9200` | Elasticsearch URL |
| `PORT` | `3000` | API gateway HTTP port |
| `NODE_ENV` | — | Set to `production` to disable Swagger |

---

## Technology Stack

- **Runtime**: Node.js 22 + TypeScript
- **Framework**: NestJS 11 (microservices monorepo)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache / Queue**: Redis 7 + Bull
- **Search**: Elasticsearch 8 + `@nestjs/elasticsearch`
- **Auth**: Passport.js + JWT + bcrypt
- **Logging**: pino + nestjs-pino (structured JSON)
- **Docs**: Swagger / OpenAPI 3
- **Containerisation**: Docker + Docker Compose

---

## CV Highlights

- Built a **NestJS microservices monorepo** for a fintech payment platform with double-entry ledger accounting and ACID-compliant PostgreSQL transactions with optimistic row-level locking
- Implemented **async job processing** via Bull/Redis for invoice generation and email notifications, decoupling heavy I/O from the critical payment path (response time ~40ms vs ~2.5s synchronously)
- Designed a **Redis-backed idempotency layer** (24-hour TTL) to prevent duplicate financial transactions across retries, restarts, and horizontal scaling
- Integrated **Elasticsearch** for full-text transaction search with fuzzy matching and composite `bool/filter` queries
- Built a **distributed tracing system** using UUID correlation IDs propagated across TCP microservice boundaries for end-to-end request observability
- Secured all endpoints with **JWT authentication** and constant-time bcrypt password comparison to prevent timing attacks
