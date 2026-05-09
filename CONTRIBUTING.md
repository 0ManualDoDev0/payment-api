# Contribuindo com a Payment API

Obrigado pelo interesse em contribuir! 💳

## Como contribuir

1. Faça um fork do repositório
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Faça suas alterações e commit: `git commit -m "feat: minha feature"`
4. Envie para o fork: `git push origin feat/minha-feature`
5. Abra um Pull Request

## Padrão de commits

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

| Prefixo | Uso |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Documentação |
| `security:` | Melhorias de segurança |
| `ci:` | Pipeline e automações |
| `refactor:` | Refatoração sem nova funcionalidade |

## Rodando localmente

```bash
cd payment-api
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate dev
npm run start:dev
```

## Dúvidas

Abra uma issue ou entre em contato: pedro.rafael090301@gmail.com
