import { withLock, resetLocks } from '../../src/store/lockManager';

describe('Lock Manager', () => {
  beforeEach(() => {
    resetLocks();
  });

  it('should execute function and return result', async () => {
    const result = await withLock('user-1', async () => 42);
    expect(result).toBe(42);
  });

  it('should serialize operations for the same user', async () => {
    const order: number[] = [];

    const p1 = withLock('user-1', async () => {
      await delay(50);
      order.push(1);
    });

    const p2 = withLock('user-1', async () => {
      order.push(2);
    });

    await Promise.all([p1, p2]);

    expect(order).toEqual([1, 2]); // Sequential: 1 finishes before 2 starts
  });

  it('should allow concurrent operations for different users', async () => {
    const order: string[] = [];

    const p1 = withLock('user-1', async () => {
      await delay(50);
      order.push('user-1');
    });

    const p2 = withLock('user-2', async () => {
      order.push('user-2');
    });

    await Promise.all([p1, p2]);

    // user-2 should complete before user-1 (no contention)
    expect(order[0]).toBe('user-2');
    expect(order[1]).toBe('user-1');
  });

  it('should release lock even if function throws', async () => {
    await expect(
      withLock('user-1', async () => {
        throw new Error('test error');
      })
    ).rejects.toThrow('test error');

    // Should still be able to acquire lock
    const result = await withLock('user-1', async () => 'recovered');
    expect(result).toBe('recovered');
  });

  it('should handle multiple sequential operations correctly', async () => {
    let counter = 0;

    const operations = Array.from({ length: 10 }, (_, i) =>
      withLock('user-1', async () => {
        const current = counter;
        await delay(1);
        counter = current + 1;
      })
    );

    await Promise.all(operations);

    expect(counter).toBe(10); // Without lock, this would be less than 10
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
