import { signToken, verifyToken } from '../../src/utils/jwt';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';

describe('JWT Utils', () => {
  const userId = 'test-user-123';

  it('should sign and verify a token successfully', () => {
    const token = signToken(userId);
    const payload = verifyToken(token);

    expect(payload.sub).toBe(userId);
  });

  it('should throw on invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow();
  });

  it('should throw on tampered token', () => {
    const token = signToken(userId);
    const tampered = token.slice(0, -5) + 'XXXXX';

    expect(() => verifyToken(tampered)).toThrow();
  });

  it('should throw on expired token', () => {
    const token = jwt.sign({ sub: userId }, config.jwtSecret as string, {
      expiresIn: '0s',
    } as jwt.SignOptions);

    // Small delay to ensure expiration
    expect(() => verifyToken(token)).toThrow();
  });

  it('should include sub claim in payload', () => {
    const token = signToken(userId);
    const decoded = jwt.decode(token) as jwt.JwtPayload;

    expect(decoded).toHaveProperty('sub', userId);
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');
  });
});
