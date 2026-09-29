import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { UserRole } from '@/types';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'societypulse-jwt-secret-key-32chars-min';
const COOKIE_NAME = 'society_token';

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getSessionFromRequest(req: NextRequest): TokenPayload | null {
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    const verified = verifyToken(cookieToken);
    if (verified) return verified;
  }

  // Also support Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.substring(7);
    return verifyToken(headerToken);
  }

  return null;
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Enforce role-based access inside Route Handlers
 */
export function requireRole(
  req: NextRequest,
  allowedRoles: UserRole[]
): { authorized: boolean; session?: TokenPayload; response?: NextResponse } {
  const session = getSessionFromRequest(req);
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: authentication session required' },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Forbidden: role '${session.role}' lacks sufficient privileges for this action` },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}

/**
 * Mask resident phone numbers for demo or public viewers
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone || !phone.trim()) return '';
  const clean = phone.trim();
  if (clean.length <= 4) return '••••';
  return clean.slice(0, 3) + ' ••••• ' + clean.slice(-2);
}

