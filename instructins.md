# Prompt para gerar API NestJS (com Supabase + Prisma + Gemini)

Você é um arquiteto e desenvolvedor sênior de backend.
Crie uma API completa em NestJS para um app financeiro pessoal, com autenticação via Supabase JWT, banco Supabase Postgres via Prisma e processamento de texto financeiro com Gemini.

## 1. Contexto do produto
O app precisa:
- Autenticar usuários com Supabase Auth (token JWT vindo do frontend).
- Salvar e listar transações financeiras por usuário.
- Processar texto em linguagem natural para gerar transações estruturadas.
- Atualizar saldo atual do usuário quando transações forem criadas.

## 2. Stack obrigatória
- Node.js + NestJS (TypeScript).
- Prisma ORM.
- PostgreSQL (Supabase).
- Validação com class-validator + class-transformer.
- Swagger (OpenAPI).
- Configuração por variáveis de ambiente com @nestjs/config.
- Estrutura modular e limpa (Clean-ish architecture por módulos).

## 3. Requisitos de autenticação
- A API deve aceitar Bearer token JWT emitido pelo Supabase.
- Validar JWT usando segredo de JWT do Supabase (server-side).
- Criar um AuthGuard global ou por rota para proteger endpoints privados.
- Injetar usuário autenticado no request (id, email, role quando disponível).
- Não implementar login/senha na API; autenticação já é feita pelo Supabase no frontend.

## 4. Modelo de dados (Prisma)
Crie modelos compatíveis com esse domínio:

- User
  - id: string (UUID)
  - email: string (unique)
  - name: string
  - saldo_atual: decimal
  - salario_mensal: decimal
  - createdAt
  - updatedAt

- Transaction
  - id: string (UUID)
  - userId: string (FK -> User.id)
  - descricao: string
  - valorOriginal: decimal
  - valorFinal: decimal
  - dataVencimento: DateTime
  - categoria: string
  - tipo: enum ("entrada" | "saida")
  - status: enum ("pendente" | "pago" | "historico")
  - saldoMutation: decimal
  - createdAt
  - updatedAt

Regras:
- Relacionamento User 1:N Transaction.
- Índices úteis para userId, dataVencimento, status e tipo.
- Soft delete não é necessário nesta primeira versão.

## 5. Módulos da API
Crie os módulos abaixo:

- health
  - GET /health (público)

- auth
  - estratégia JWT Supabase
  - decorators para CurrentUser

- users
  - GET /users/me (retorna perfil do usuário autenticado)
  - PATCH /users/me (atualiza name e salario_mensal)

- transactions
  - GET /transactions
    - filtros opcionais: tipo, status, categoria, de, ate, page, limit
  - POST /transactions
  - PATCH /transactions/:id
  - DELETE /transactions/:id
  - GET /transactions/stats/resumo
    - totalEntradasPagas
    - totalSaidas
    - saldoAtual

- ai
  - POST /ai/process-financial-input
  - body: { input: string }
  - chama Gemini server-side e retorna:
    - transactions: array de transações estruturadas no formato esperado

## 6. Regras de negócio
- Cada usuário só acessa e altera seus próprios dados.
- Ao criar transações:
  - se saldoMutation != 0, atualizar saldo_atual do usuário.
- Validar tipos e status com enums.
- valorOriginal e valorFinal devem ser >= 0.
- dataVencimento deve ser data válida ISO.
- Em update, impedir alteração de userId.

## 7. Integração Gemini
- Implementar serviço AI server-side.
- Nunca expor GEMINI_API_KEY no cliente.
- Endpoint /ai/process-financial-input deve:
  - validar input não vazio
  - chamar Gemini com prompt estruturado para retornar JSON estrito
  - validar o JSON de resposta antes de retornar
- Tratar falhas da IA com erro HTTP adequado (502/500).

## 8. Variáveis de ambiente
Use placeholders (não colocar segredos reais). Exemplo:

- PORT=3001
- NODE_ENV=development
- DATABASE_URL=
- DIRECT_URL=
- SUPABASE_URL=
- SUPABASE_JWT_SECRET=
- SUPABASE_SERVICE_ROLE_KEY=
- GEMINI_API_KEY=
- CORS_ORIGIN=http://localhost:3000

## 9. Qualidade e segurança
- DTOs para todos os inputs.
- Pipes de validação globais.
- Tratamento global de exceções com formato consistente:
  - statusCode
  - message
  - error
  - timestamp
  - path
- CORS configurável por env.
- Logs com contexto.
- Sem hardcode de secrets.
- Arquitetura preparada para produção.

## 10. Swagger
- Documentar todos os endpoints com exemplos.
- Incluir autenticação Bearer no Swagger.
- Exemplos reais para criação de transação e processamento de input IA.

## 11. Testes
Crie:
- testes unitários para serviços principais (transactions e ai).
- testes e2e mínimos para:
  - health
  - rota protegida sem token (401)
  - create/list transaction com token mock válido.

## 12. Entregáveis esperados
Quero que você gere:
- estrutura completa de pastas e arquivos do projeto NestJS.
- código completo dos arquivos principais (não só trechos).
- prisma/schema.prisma + migration inicial.
- arquivo .env.example completo.
- README com:
  - como rodar local
  - como gerar migration
  - como testar
  - como consumir endpoints principais.

## 13. Critérios de aceite
A solução será aceita se:
- subir com `npm run start:dev`.
- `GET /health` responder 200.
- rotas protegidas exigirem JWT.
- CRUD de transações funcionar por usuário.
- rota de IA responder JSON estruturado.
- documentação Swagger abrir e funcionar.
- sem erros TypeScript e com lint básico.

Gere tudo com foco em clareza, organização e prontidão para produção.
