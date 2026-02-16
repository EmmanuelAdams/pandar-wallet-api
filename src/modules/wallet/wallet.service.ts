import { v4 as uuidv4 } from 'uuid';
import { ledgerStore } from '../../store';
import { AppError } from '../../errors/AppError';
import { WalletOperationResponseDto } from '../../dtos/wallet.dto';

export function getBalance(userId: string): number {
  return ledgerStore.getBalance(userId);
}

export function deposit(userId: string, amount: number): WalletOperationResponseDto {
  const transactionId = uuidv4();
  const now = new Date().toISOString();
  const reference = `dep_${transactionId.slice(0, 8)}`;

  const transaction = ledgerStore.recordDeposit(userId, amount, transactionId, reference, now);

  return {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    reference: transaction.reference,
    balanceAfter: transaction.balanceAfter,
    createdAt: transaction.createdAt,
  };
}

export function withdraw(userId: string, amount: number): WalletOperationResponseDto {
  const currentBalance = ledgerStore.getBalance(userId);

  if (currentBalance < amount) {
    throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance for this withdrawal');
  }

  const transactionId = uuidv4();
  const now = new Date().toISOString();
  const reference = `wth_${transactionId.slice(0, 8)}`;

  const transaction = ledgerStore.recordWithdrawal(userId, amount, transactionId, reference, now);

  return {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    reference: transaction.reference,
    balanceAfter: transaction.balanceAfter,
    createdAt: transaction.createdAt,
  };
}
