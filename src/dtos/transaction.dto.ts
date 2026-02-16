export interface TransactionResponseDto {
  id: string;
  type: 'credit' | 'withdraw';
  amount: number;
  reference: string;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedTransactionsDto {
  transactions: TransactionResponseDto[];
  pagination: PaginationMeta;
}
