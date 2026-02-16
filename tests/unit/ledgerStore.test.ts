import { ledgerStore } from '../../src/store/ledgerStore';

describe('Ledger Store', () => {
  beforeEach(() => {
    ledgerStore.reset();
  });

  it('should initialize an account with 0 balance', () => {
    ledgerStore.initAccount('user-1');
    expect(ledgerStore.getBalance('user-1')).toBe(0);
  });

  it('should credit an account correctly', () => {
    ledgerStore.initAccount('user-1');
    ledgerStore.creditAccount('user-1', 5000, 'tx-1', 'test credit', new Date().toISOString());

    expect(ledgerStore.getBalance('user-1')).toBe(5000);
  });

  it('should debit an account correctly', () => {
    ledgerStore.initAccount('user-1');
    ledgerStore.creditAccount('user-1', 10000, 'tx-1', 'initial', new Date().toISOString());
    ledgerStore.debitAccount('user-1', 3000, 'tx-2', 'test debit', new Date().toISOString());

    expect(ledgerStore.getBalance('user-1')).toBe(7000);
  });

  it('should record deposit with balanced ledger entries', () => {
    ledgerStore.initAccount('user-1');
    ledgerStore.recordDeposit('user-1', 5000, 'tx-1', 'ref-1', new Date().toISOString());

    expect(ledgerStore.getBalance('user-1')).toBe(5000);
    expect(ledgerStore.verifyLedgerIntegrity()).toBe(true);
  });

  it('should record withdrawal with balanced ledger entries', () => {
    ledgerStore.initAccount('user-1');
    ledgerStore.recordDeposit('user-1', 10000, 'tx-1', 'ref-1', new Date().toISOString());
    ledgerStore.recordWithdrawal('user-1', 3000, 'tx-2', 'ref-2', new Date().toISOString());

    expect(ledgerStore.getBalance('user-1')).toBe(7000);
    expect(ledgerStore.verifyLedgerIntegrity()).toBe(true);
  });

  it('should always maintain balanced ledger after multiple operations', () => {
    ledgerStore.initAccount('user-1');
    ledgerStore.initAccount('user-2');

    ledgerStore.recordDeposit('user-1', 10000, 'tx-1', 'ref-1', new Date().toISOString());
    ledgerStore.recordDeposit('user-2', 5000, 'tx-2', 'ref-2', new Date().toISOString());
    ledgerStore.recordWithdrawal('user-1', 2000, 'tx-3', 'ref-3', new Date().toISOString());
    ledgerStore.recordDeposit('user-1', 1000, 'tx-4', 'ref-4', new Date().toISOString());
    ledgerStore.recordWithdrawal('user-2', 5000, 'tx-5', 'ref-5', new Date().toISOString());

    expect(ledgerStore.verifyLedgerIntegrity()).toBe(true);
    expect(ledgerStore.getBalance('user-1')).toBe(9000);
    expect(ledgerStore.getBalance('user-2')).toBe(0);
  });

  it('should store running balance on each ledger entry', () => {
    ledgerStore.initAccount('user-1');
    const entry = ledgerStore.creditAccount('user-1', 5000, 'tx-1', 'test', new Date().toISOString());

    expect(entry.balanceAfter).toBe(5000);
    expect(entry.type).toBe('CREDIT');
    expect(entry.amount).toBe(5000);
  });

  it('should create two ledger entries per deposit', () => {
    ledgerStore.initAccount('user-1');
    ledgerStore.recordDeposit('user-1', 5000, 'tx-1', 'ref-1', new Date().toISOString());

    const entries = ledgerStore.getAllLedgerEntries();
    const txEntries = entries.filter((e) => e.transactionId === 'tx-1');

    expect(txEntries).toHaveLength(2);
    expect(txEntries.find((e) => e.type === 'DEBIT')).toBeDefined();
    expect(txEntries.find((e) => e.type === 'CREDIT')).toBeDefined();
  });

  it('should track user transactions in order (most recent first)', () => {
    ledgerStore.initAccount('user-1');
    ledgerStore.recordDeposit('user-1', 5000, 'tx-1', 'ref-1', '2026-01-01T00:00:00.000Z');
    ledgerStore.recordDeposit('user-1', 3000, 'tx-2', 'ref-2', '2026-01-02T00:00:00.000Z');

    const transactions = ledgerStore.getUserTransactions('user-1');

    expect(transactions).toHaveLength(2);
    expect(transactions[0].id).toBe('tx-2'); // Most recent first
    expect(transactions[1].id).toBe('tx-1');
  });

  it('should use correct transaction types', () => {
    ledgerStore.initAccount('user-1');
    ledgerStore.recordDeposit('user-1', 10000, 'tx-1', 'ref-1', new Date().toISOString());
    ledgerStore.recordWithdrawal('user-1', 2000, 'tx-2', 'ref-2', new Date().toISOString());

    const transactions = ledgerStore.getUserTransactions('user-1');

    expect(transactions[0].type).toBe('withdraw');
    expect(transactions[1].type).toBe('credit');
  });

  it('should return empty array for unknown user transactions', () => {
    expect(ledgerStore.getUserTransactions('non-existent')).toEqual([]);
  });

  it('should return 0 balance for unknown account', () => {
    expect(ledgerStore.getBalance('non-existent')).toBe(0);
  });
});
