const locks = new Map<string, Promise<void>>();

export async function withLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prevLock = locks.get(userId) ?? Promise.resolve();

  let releaseLock!: () => void;
  const newLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  locks.set(userId, newLock);

  await prevLock;

  try {
    return await fn();
  } finally {
    releaseLock();
  }
}

export function resetLocks(): void {
  locks.clear();
}
