# Security Policy

## Versões Suportadas

| Versão | Suportada |
|--------|-----------|
| latest | ✅ |

## Reportando Vulnerabilidades

Se você encontrou uma vulnerabilidade de segurança, **não abra uma issue pública**.

Entre em contato diretamente por: pedro.rafael090301@gmail.com

Você receberá uma resposta em até 48 horas.

## Medidas de Segurança Implementadas

- **Helmet** — headers HTTP seguros
- **Rate Limiting** — proteção contra abuso via ThrottlerGuard
- **HMAC-SHA256** — validação de assinatura dos webhooks do Mercado Pago
- **Basic Auth** — proteção do dashboard de filas
- **ValidationPipe** — validação e sanitização de todos os inputs
- **CORS** — controle de origens permitidas
- **Idempotência** — deduplicação de webhooks via x-request-id
