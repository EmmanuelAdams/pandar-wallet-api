import { v4 as uuidv4 } from 'uuid';
import { userStore, ledgerStore } from '../../store';
import { signToken } from '../../utils/jwt';
import { config } from '../../config';
import { AppError } from '../../errors/AppError';
import { UserResponseDto } from '../../dtos/user.dto';

export function createUser(email: string): UserResponseDto {
  if (userStore.emailExists(email)) {
    throw new AppError(409, 'EMAIL_EXISTS', 'A user with this email already exists');
  }

  const userId = uuidv4();
  const now = new Date().toISOString();

  userStore.create({ id: userId, email, createdAt: now });

  // Initialize wallet account with 0, then record the initial deposit
  ledgerStore.initAccount(userId, 0);

  const transactionId = uuidv4();
  ledgerStore.recordDeposit(
    userId,
    config.initialBalance,
    transactionId,
    `initial_${transactionId.slice(0, 8)}`,
    now
  );

  const token = signToken(userId);

  return {
    id: userId,
    email,
    balance: ledgerStore.getBalance(userId),
    token,
    createdAt: now,
  };
}
