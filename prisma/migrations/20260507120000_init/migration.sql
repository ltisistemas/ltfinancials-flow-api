-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('entrada', 'saida');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pendente', 'pago', 'historico');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "saldo_atual" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "salario_mensal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorOriginal" DECIMAL(14,2) NOT NULL,
    "valorFinal" DECIMAL(14,2) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipo" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "saldoMutation" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_dataVencimento_idx" ON "transactions"("dataVencimento");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_tipo_idx" ON "transactions"("tipo");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
