export interface AddBalanceDto {
  amount: number;
}

export interface WithdrawDto {
  amount: number;
}

export interface BalanceResponseDto {
  balance: number;
}

export interface WalletOperationResponseDto {
  id: string;
  type: 'credit' | 'withdraw';
  amount: number;
  reference: string;
  balanceAfter: number;
  createdAt: string;
}
