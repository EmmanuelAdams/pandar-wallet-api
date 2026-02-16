import { ledgerStore } from '../../store';
import { paginate } from '../../utils/pagination';
import { TransactionResponseDto, PaginatedTransactionsDto } from '../../dtos/transaction.dto';

export function getTransactions(
  userId: string,
  page: number,
  limit: number
): PaginatedTransactionsDto {
  const allTransactions = ledgerStore.getUserTransactions(userId);

  const mapped: TransactionResponseDto[] = allTransactions.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    reference: tx.reference,
    createdAt: tx.createdAt,
  }));

  const result = paginate(mapped, page, limit);

  return {
    transactions: result.data,
    pagination: result.pagination,
  };
}
