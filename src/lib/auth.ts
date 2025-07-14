import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt, { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function getJwtSecretKey() {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return JWT_SECRET;
}

export async function authenticated(request: NextRequest, requireAdmin = false) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const verified = verify(token, getJwtSecretKey());
    const payload = typeof verified === 'string' ? JSON.parse(verified) : verified;

    // If admin access is required, check if the user is an admin
    if (requireAdmin && payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    return payload;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}

// Helper function to generate a token for a user
export function generateToken(user: any) {
  return new Promise((resolve, reject) => {
    try {
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days expiration
      };

      const token = jwt.sign(payload, getJwtSecretKey());
      resolve(token);
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'token',
    value: token,
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
}
