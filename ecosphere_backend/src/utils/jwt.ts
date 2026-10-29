import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/index.js';
import { env } from '../config/env.js';

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  return decoded;
}

export function generatePasswordResetToken(userId: string): string {
  const jti = Math.random().toString(36).substring(2) + Date.now().toString(36);
  return jwt.sign(
    { userId, purpose: 'password_reset', jti },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

export function verifyPasswordResetToken(token: string): { userId: string; jti: string } {
  const decoded = jwt.verify(token, env.JWT_SECRET) as any;
  if (!decoded || decoded.purpose !== 'password_reset' || !decoded.userId || !decoded.jti) {
    const err = new Error('Invalid reset token.');
    (err as any).code = 'INVALID_RESET_TOKEN';
    throw err;
  }
  return { userId: String(decoded.userId), jti: String(decoded.jti) };
}
