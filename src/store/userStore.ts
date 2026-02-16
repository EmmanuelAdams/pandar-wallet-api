export interface User {
  id: string;
  email: string;
  createdAt: string;
}

const users = new Map<string, User>();
const emailIndex = new Map<string, string>(); // email -> userId

export const userStore = {
  create(user: User): void {
    users.set(user.id, user);
    emailIndex.set(user.email, user.id);
  },

  getById(id: string): User | undefined {
    return users.get(id);
  },

  getByEmail(email: string): User | undefined {
    const userId = emailIndex.get(email);
    if (!userId) return undefined;
    return users.get(userId);
  },

  emailExists(email: string): boolean {
    return emailIndex.has(email);
  },

  has(id: string): boolean {
    return users.has(id);
  },

  reset(): void {
    users.clear();
    emailIndex.clear();
  },
};
