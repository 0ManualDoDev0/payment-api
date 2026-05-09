# Changelog

Todas as mudanças relevantes do projeto são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.0.0] - 2026-05-07

### Adicionado

- Integração completa com Mercado Pago (PIX, cartão, boleto, assinaturas)
- Processamento assíncrono com BullMQ e retry exponencial
- Webhooks com validação HMAC-SHA256
- Deduplicação de eventos via x-request-id
- Health check com status de banco, Redis e filas
- Deploy automatizado na Railway
- CI/CD com GitHub Actions
- Documentação completa no README
- Política de segurança (SECURITY.md)
