import { Transaction, User } from '@prisma/client';

type DecimalLike = {
  toString(): string;
};

function decimalToNumber(
  value: DecimalLike | number | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value.toString());
}

export function serializeUser(user: User) {
  const { password_hash, ...safeUser } = user;
  void password_hash;

  return {
    ...safeUser,
    saldo_atual: decimalToNumber(safeUser.saldo_atual),
    salario_mensal: decimalToNumber(safeUser.salario_mensal),
  };
}

export function serializeTransaction(transaction: Transaction) {
  return {
    ...transaction,
    valorOriginal: decimalToNumber(transaction.valorOriginal),
    valorFinal: decimalToNumber(transaction.valorFinal),
    saldoMutation: decimalToNumber(transaction.saldoMutation),
  };
}

export function serializeDecimalValue(
  value: DecimalLike | number | null | undefined,
): number {
  return decimalToNumber(value);
}
