export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'withdraw';
  amount: number;
  reference: string;
  balanceAfter: number;
  createdAt: string;
}

const SYSTEM_ACCOUNT = 'SYSTEM';

const balances = new Map<string, number>();
const ledgerEntries: LedgerEntry[] = [];
const userTransactions = new Map<string, Transaction[]>();

export const ledgerStore = {
  initAccount(accountId: string, initialBalance: number = 0): void {
    if (!balances.has(accountId)) {
      balances.set(accountId, initialBalance);
    }
  },

  getBalance(accountId: string): number {
    return balances.get(accountId) ?? 0;
  },

  creditAccount(
    accountId: string,
    amount: number,
    transactionId: string,
    description: string,
    createdAt: string
  ): LedgerEntry {
    const currentBalance = balances.get(accountId) ?? 0;
    const newBalance = currentBalance + amount;
    balances.set(accountId, newBalance);

    const entry: LedgerEntry = {
      id: `le-${ledgerEntries.length + 1}`,
      transactionId,
      accountId,
      type: 'CREDIT',
      amount,
      balanceAfter: newBalance,
      description,
      createdAt,
    };
    ledgerEntries.push(entry);
    return entry;
  },

  debitAccount(
    accountId: string,
    amount: number,
    transactionId: string,
    description: string,
    createdAt: string
  ): LedgerEntry {
    const currentBalance = balances.get(accountId) ?? 0;
    const newBalance = currentBalance - amount;
    balances.set(accountId, newBalance);

    const entry: LedgerEntry = {
      id: `le-${ledgerEntries.length + 1}`,
      transactionId,
      accountId,
      type: 'DEBIT',
      amount,
      balanceAfter: newBalance,
      description,
      createdAt,
    };
    ledgerEntries.push(entry);
    return entry;
  },

  recordDeposit(
    userId: string,
    amount: number,
    transactionId: string,
    reference: string,
    createdAt: string
  ): Transaction {
    this.debitAccount(SYSTEM_ACCOUNT, amount, transactionId, `Deposit to ${userId}`, createdAt);
    this.creditAccount(userId, amount, transactionId, `Deposit from SYSTEM`, createdAt);

    const tx: Transaction = {
      id: transactionId,
      userId,
      type: 'credit',
      amount,
      reference,
      balanceAfter: this.getBalance(userId),
      createdAt,
    };

    const txList = userTransactions.get(userId) ?? [];
    txList.unshift(tx);
    userTransactions.set(userId, txList);

    return tx;
  },

  recordWithdrawal(
    userId: string,
    amount: number,
    transactionId: string,
    reference: string,
    createdAt: string
  ): Transaction {
    this.debitAccount(userId, amount, transactionId, `Withdrawal by ${userId}`, createdAt);
    this.creditAccount(SYSTEM_ACCOUNT, amount, transactionId, `Withdrawal from ${userId}`, createdAt);

    const tx: Transaction = {
      id: transactionId,
      userId,
      type: 'withdraw',
      amount,
      reference,
      balanceAfter: this.getBalance(userId),
      createdAt,
    };

    const txList = userTransactions.get(userId) ?? [];
    txList.unshift(tx);
    userTransactions.set(userId, txList);

    return tx;
  },

  getUserTransactions(userId: string): Transaction[] {
    return userTransactions.get(userId) ?? [];
  },

  getAllLedgerEntries(): LedgerEntry[] {
    return [...ledgerEntries];
  },

  verifyLedgerIntegrity(): boolean {
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of ledgerEntries) {
      if (entry.type === 'DEBIT') {
        totalDebits += entry.amount;
      } else {
        totalCredits += entry.amount;
      }
    }

    return totalDebits === totalCredits;
  },

  reset(): void {
    balances.clear();
    ledgerEntries.length = 0;
    userTransactions.clear();
    balances.set(SYSTEM_ACCOUNT, 0);
  },
};

// Initialize SYSTEM account
balances.set(SYSTEM_ACCOUNT, 0);
