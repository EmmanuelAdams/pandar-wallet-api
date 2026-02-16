export interface CachedResponse {
  statusCode: number;
  body: object;
  createdAt: number;
}

const cache = new Map<string, CachedResponse>();

export const idempotencyStore = {
  buildKey(userId: string, path: string, idempotencyKey: string): string {
    return `${userId}:${path}:${idempotencyKey}`;
  },

  get(compositeKey: string): CachedResponse | undefined {
    return cache.get(compositeKey);
  },

  set(compositeKey: string, response: CachedResponse): void {
    cache.set(compositeKey, response);
  },

  has(compositeKey: string): boolean {
    return cache.has(compositeKey);
  },

  reset(): void {
    cache.clear();
  },
};
