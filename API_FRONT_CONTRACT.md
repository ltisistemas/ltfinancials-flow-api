# LT Financials API - Contrato para Frontend

## Base URL

- Local: `http://localhost:3001`
- Producao (Vercel): `https://ltfinancials-flow-api.vercel.app`
- Swagger: `http://localhost:3001/docs`
- Swagger (Vercel): `https://ltfinancials-flow-api.vercel.app/docs`

## Ambiente Vercel

- API publicada: `https://ltfinancials-flow-api.vercel.app/`
- Frontend autorizado no CORS: `https://ltfinancials-flow.vercel.app`

## Autenticacao

Cadastro e login sao publicos:

- `POST /auth/register`
- `POST /auth/login`

Rotas privadas exigem header:

```http
Authorization: Bearer <JWT_DA_API>
```

## Formato padrao de erro

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "UnauthorizedException",
  "timestamp": "2026-05-07T13:00:00.000Z",
  "path": "/users/me"
}
```

---

## 1) Health

### GET /health
Publica.

#### Payload
Sem body.

#### Response 200
```json
{
  "status": "ok",
  "timestamp": "2026-05-07T12:00:00.000Z"
}
```

---

## 2) Auth

### POST /auth/register
Publica.

#### Payload
```json
{
  "name": "Luiz Felipe",
  "email": "luiz@example.com",
  "password": "Senha@123"
}
```

#### Response 201
```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "7d9152b3-7a49-4b28-9f42-1be3574b9ec2",
    "email": "luiz@example.com",
    "name": "Luiz Felipe"
  }
}
```

### POST /auth/login
Publica.

#### Payload
```json
{
  "email": "luiz@example.com",
  "password": "Senha@123"
}
```

#### Response 200
```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "7d9152b3-7a49-4b28-9f42-1be3574b9ec2",
    "email": "luiz@example.com",
    "name": "Luiz Felipe"
  }
}
```

---

## 3) Users

### GET /users/me
Privada.

#### Payload
Sem body.

#### Response 200
```json
{
  "id": "7d9152b3-7a49-4b28-9f42-1be3574b9ec2",
  "email": "luiz@example.com",
  "name": "Luiz Felipe",
  "saldo_atual": 1250.5,
  "salario_mensal": 8500,
  "createdAt": "2026-05-07T10:00:00.000Z",
  "updatedAt": "2026-05-07T10:00:00.000Z"
}
```

### PATCH /users/me
Privada.

#### Payload (todos os campos opcionais)
```json
{
  "name": "Luiz atualizado",
  "salario_mensal": 9000
}
```

#### Response 200
```json
{
  "id": "7d9152b3-7a49-4b28-9f42-1be3574b9ec2",
  "email": "luiz@example.com",
  "name": "Luiz atualizado",
  "saldo_atual": 1250.5,
  "salario_mensal": 9000,
  "createdAt": "2026-05-07T10:00:00.000Z",
  "updatedAt": "2026-05-07T11:00:00.000Z"
}
```

---

## 4) Transactions

Enums usados:

- `tipo`: `"entrada" | "saida"`
- `status`: `"pendente" | "pago" | "historico"`

### GET /transactions
Privada.

#### Query params (opcionais)

- `tipo`
- `status`
- `categoria`
- `de` (ISO datetime)
- `ate` (ISO datetime)
- `page` (default 1)
- `limit` (default 20, max 100)

Exemplo:

```http
GET /transactions?tipo=saida&status=pendente&page=1&limit=20
```

#### Payload
Sem body.

#### Response 200
```json
{
  "data": [
    {
      "id": "3275ef8f-2efa-4553-a0d8-0c363e67b364",
      "userId": "7d9152b3-7a49-4b28-9f42-1be3574b9ec2",
      "descricao": "Conta de energia",
      "valorOriginal": 220.9,
      "valorFinal": 220.9,
      "dataVencimento": "2026-05-10T00:00:00.000Z",
      "categoria": "moradia",
      "tipo": "saida",
      "status": "pendente",
      "saldoMutation": -220.9,
      "createdAt": "2026-05-07T10:00:00.000Z",
      "updatedAt": "2026-05-07T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /transactions
Privada.

#### Payload
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

#### Response 201
```json
{
  "id": "3275ef8f-2efa-4553-a0d8-0c363e67b364",
  "userId": "7d9152b3-7a49-4b28-9f42-1be3574b9ec2",
  "descricao": "Conta de energia",
  "valorOriginal": 220.9,
  "valorFinal": 220.9,
  "dataVencimento": "2026-05-10T00:00:00.000Z",
  "categoria": "moradia",
  "tipo": "saida",
  "status": "pendente",
  "saldoMutation": -220.9,
  "createdAt": "2026-05-07T10:00:00.000Z",
  "updatedAt": "2026-05-07T10:00:00.000Z"
}
```

### PATCH /transactions/:id
Privada.

#### Payload (todos opcionais)
```json
{
  "descricao": "Conta de energia - maio",
  "valorFinal": 210.9,
  "status": "pago",
  "saldoMutation": -210.9
}
```

#### Response 200
```json
{
  "id": "3275ef8f-2efa-4553-a0d8-0c363e67b364",
  "userId": "7d9152b3-7a49-4b28-9f42-1be3574b9ec2",
  "descricao": "Conta de energia - maio",
  "valorOriginal": 220.9,
  "valorFinal": 210.9,
  "dataVencimento": "2026-05-10T00:00:00.000Z",
  "categoria": "moradia",
  "tipo": "saida",
  "status": "pago",
  "saldoMutation": -210.9,
  "createdAt": "2026-05-07T10:00:00.000Z",
  "updatedAt": "2026-05-07T11:00:00.000Z"
}
```

### DELETE /transactions/:id
Privada.

#### Payload
Sem body.

#### Response 204
Sem body.

### GET /transactions/stats/resumo
Privada.

#### Payload
Sem body.

#### Response 200
```json
{
  "totalEntradasPagas": 10000,
  "totalSaidas": 4200.35,
  "saldoAtual": 5799.65
}
```

---

## 5) AI

### POST /ai/process-financial-input
Privada.

#### Payload
```json
{
  "input": "Paguei R$ 120 da internet dia 12 e recebi R$ 500 de um freela dia 15"
}
```

#### Response 200
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
    },
    {
      "descricao": "Freela de design",
      "valorOriginal": 500,
      "valorFinal": 500,
      "dataVencimento": "2026-05-15T00:00:00.000Z",
      "categoria": "renda_extra",
      "tipo": "entrada",
      "status": "pago",
      "saldoMutation": 500
    }
  ]
}
```

---

## Observacoes para o front

- Sempre enviar JWT recebido em `/auth/register` ou `/auth/login` nas rotas privadas.
- Campos monetarios chegam como `number` no JSON.
- Datas sao ISO string UTC.
- Para `PATCH`, envie apenas os campos alterados.
- Em producao, consumir a API pela URL da Vercel indicada acima.
