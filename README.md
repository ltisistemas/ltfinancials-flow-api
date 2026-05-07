# LT Financials Flow API

API NestJS para gestão financeira pessoal com autenticação via Supabase JWT, persistência em PostgreSQL com Prisma e processamento de linguagem natural com Gemini.

## Stack

- NestJS 11
- Prisma ORM + PostgreSQL (Supabase)
- Supabase Auth JWT
- Gemini via `@google/genai`
- Swagger / OpenAPI
- Jest para testes unitários e e2e

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores reais:

```bash
PORT=3001
NODE_ENV=development
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_JWT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
CORS_ORIGIN=http://localhost:3000
```

## Como rodar localmente

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Aplicação:

- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`
- Health check: `GET /health`

## Prisma e migrations

Gerar o client Prisma:

```bash
npm run prisma:generate
```

Criar uma nova migration local:

```bash
npm run prisma:migrate -- --name nome_da_migration
```

Aplicar migrations em ambiente de deploy:

```bash
npm run prisma:deploy
```

## Testes

Testes unitários:

```bash
npm test
```

Testes e2e:

```bash
npm run test:e2e
```

Build TypeScript:

```bash
npm run build
```

## Endpoints principais

### Health

- `GET /health` público

### Usuário autenticado

- `GET /users/me`
- `PATCH /users/me`

Exemplo `PATCH /users/me`:

```json
{
  "name": "Luiz Felipe",
  "salario_mensal": 8500
}
```

### Transações

- `GET /transactions?tipo=saida&status=pendente&page=1&limit=20`
- `POST /transactions`
- `PATCH /transactions/:id`
- `DELETE /transactions/:id`
- `GET /transactions/stats/resumo`

Exemplo `POST /transactions`:

```json
{
  "descricao": "Conta de energia",
  "valorOriginal": 220.9,
  "valorFinal": 220.9,
  "dataVencimento": "2026-05-10T00:00:00.000Z",
  "categoria": "moradia",
  "tipo": "saida",
  "status": "pendente",
  "saldoMutation": -220.9
}
```

### IA

- `POST /ai/process-financial-input`

Exemplo de payload:

```json
{
  "input": "Paguei R$ 120 de internet dia 12 e recebi R$ 500 de um freela dia 15"
}
```

Resposta esperada:

```json
{
  "transactions": [
    {
      "descricao": "Internet residencial",
      "valorOriginal": 120,
      "valorFinal": 120,
      "dataVencimento": "2026-05-12T00:00:00.000Z",
      "categoria": "servicos",
      "tipo": "saida",
      "status": "pendente",
      "saldoMutation": -120
    }
  ]
}
```

## Segurança e arquitetura

- Rotas privadas protegidas por JWT do Supabase.
- Filtro global de exceções com payload consistente.
- DTOs com validação global e remoção de campos não permitidos.
- Prisma centralizado em módulo global.
- Atualização de saldo do usuário sincronizada com mutações de transações.
