import jwt from 'jsonwebtoken';
import { config } from '../config';

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret as string, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): { sub: string } {
  return jwt.verify(token, config.jwtSecret as string) as { sub: string };
}
