# Payment API

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
  <img src="https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" alt="Railway"/>
  <img src="https://img.shields.io/badge/CI-passing-brightgreen?style=for-the-badge&logo=github-actions&logoColor=white" alt="CI"/>
</p>

API de pagamentos construída com **NestJS** e integrada ao **Mercado Pago**, com suporte a PIX, cartão de crédito, boleto bancário e assinaturas recorrentes. Utiliza **BullMQ** para processamento assíncrono com retry automático e **Prisma** como ORM sobre PostgreSQL.

---

## Funcionalidades

- **PIX** — geração de QR Code e copia-e-cola com expiração configurável
- **Cartão de crédito** — pagamento com tokenização via Mercado Pago (parcelamento suportado)
- **Boleto bancário** — emissão com data de vencimento configurável
- **Assinaturas recorrentes** — planos e cobranças automáticas via PreApproval
- **Webhooks** — recebimento e validação de notificações do Mercado Pago com HMAC-SHA256
- **Filas BullMQ** — processamento assíncrono com retry exponencial (até 3–5 tentativas)
- **Bull Board** — dashboard visual para monitoramento das filas em tempo real
- **Idempotência** — deduplicação de eventos de webhook por `x-request-id`
- **Paginação** — listagem de pagamentos com filtros por status e tipo

---

## Endpoints

### Pagamentos

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/payments/pix` | Cria pagamento PIX |
| `POST` | `/api/payments/credit-card` | Cria pagamento com cartão de crédito |
| `POST` | `/api/payments/boleto` | Emite boleto bancário |
| `POST` | `/api/payments/subscription` | Cria assinatura recorrente |
| `GET` | `/api/payments` | Lista pagamentos com paginação (`?page=1&limit=20&status=APPROVED&type=PIX`) |
| `GET` | `/api/payments/:id` | Detalhe de um pagamento |
| `PATCH` | `/api/payments/:id/cancel` | Cancela um pagamento |

### Webhooks

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/webhooks/mercadopago` | Recebe notificações do Mercado Pago |

### Dashboard

| Rota | Descrição |
|------|-----------|
| `/queues` | Bull Board — monitoramento de filas (Basic Auth) |

---
## 🏗️ Arquitetura

```
┌─────────┐     REST      ┌─────────────┐     enqueue     ┌───────────────┐
│ Cliente │ ───────────► │  REST API   │ ──────────────► │  BullMQ Queue │
└─────────┘              │  (NestJS)   │                  │payment-process│
                         └──────┬──────┘                  └───────┬───────┘
                                │                                  │
                                ▼                                  ▼
                         ┌─────────────┐                  ┌───────────────┐
                         │  Payments   │                  │   Payment     │
                         │  Service    │                  │   Processor   │
                         └─────────────┘                  └───────┬───────┘
                                                                   │
                                                                   ▼
                                                          ┌────────────────┐
                                                          │  Mercado Pago  │
                                                          │      API       │
                                                          └───────┬────────┘
                                                                  │ webhook
                                                                  ▼
                         ┌─────────────┐     enqueue     ┌───────────────┐
                         │  Database   │ ◄────────────── │   Webhook     │
                         │ (PostgreSQL)│                  │   Processor   │
                         └─────────────┘                  └───────┬───────┘
                                                                   │
                                                          ┌────────┴────────┐
                                                          │  BullMQ Queue   │
                                                          │webhook-processing│
                                                          └─────────────────┘
```

---

## 🏥 Health Check

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Retorna status do banco de dados, Redis e filas |

**Produção:** `https://payment-api-production-8dbf.up.railway.app/api/health`

**Exemplo de resposta:**

```json
{
  "status": "ok",
  "database": { "status": "ok" },
  "redis": { "status": "ok" },
  "queues": {
    "payment-processing": { "waiting": 0, "active": 1, "completed": 42, "failed": 0 },
    "webhook-processing": { "waiting": 0, "active": 0, "completed": 17, "failed": 1 }
  }
}
```

O campo `status` retorna `"error"` se o banco ou o Redis estiverem indisponíveis. As estatísticas de fila são exibidas independentemente.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | NestJS 10 + TypeScript |
| ORM | Prisma 5 |
| Banco de dados | PostgreSQL 16 |
| Filas | BullMQ 5 + Redis 7 |
| Pagamentos | Mercado Pago SDK v2 |
| Dashboard de filas | Bull Board (@bull-board/nestjs) |
| Deploy | Railway |

---

## Configuração local

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

### Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/0ManualDoDev0/payment-api.git
cd payment-api

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Preencha MP_ACCESS_TOKEN e MP_PUBLIC_KEY com suas credenciais do Mercado Pago
```

### Subir banco e Redis

```bash
docker compose up -d
```

### Rodar migrations

```bash
npm run db:migrate
```

### Iniciar em desenvolvimento

```bash
npm run start:dev
```

A API ficará disponível em `http://localhost:3000/api`.  
O dashboard de filas estará em `http://localhost:3000/queues` (usuário: `admin`, senha: `admin`).

### Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta da aplicação | `3000` |
| `DATABASE_URL` | Connection string PostgreSQL | — |
| `REDIS_URL` | Connection string Redis (prioridade sobre host/port) | — |
| `REDIS_HOST` | Host do Redis | `localhost` |
| `REDIS_PORT` | Porta do Redis | `6379` |
| `REDIS_PASSWORD` | Senha do Redis | — |
| `MP_ACCESS_TOKEN` | Token de acesso Mercado Pago | — |
| `MP_PUBLIC_KEY` | Chave pública Mercado Pago | — |
| `MP_WEBHOOK_SECRET` | Segredo HMAC para validação de webhooks | — |
| `BULL_BOARD_USER` | Usuário do dashboard | `admin` |
| `BULL_BOARD_PASS` | Senha do dashboard | `admin` |

---

## Produção

A API está disponível em:

```
https://payment-api-production-8dbf.up.railway.app
```

Deploy contínuo via Railway — cada push para `main` dispara um novo deploy automaticamente.

---

## Segurança

- **Validação de webhooks** — todas as notificações do Mercado Pago são verificadas via HMAC-SHA256 usando o header `x-signature` e `x-request-id`
- **Deduplicação** — eventos duplicados são detectados e ignorados antes do processamento
- **Validação de entrada** — todos os endpoints utilizam `class-validator` com `whitelist: true`, rejeitando campos não declarados nos DTOs
- **Basic Auth no dashboard** — o Bull Board é protegido por autenticação HTTP Basic configurável via variáveis de ambiente
- **Rate limiting** — recomendado adicionar `@nestjs/throttler` antes de expor em produção
- **JWT** — recomendado proteger os endpoints de pagamento com guards JWT para ambientes multi-tenant

---

## Licença

Distribuído sob a licença **MIT**. Consulte o arquivo `LICENSE` para mais informações.
