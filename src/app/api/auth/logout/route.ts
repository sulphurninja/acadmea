import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Clear the auth token cookie
  const cookieStore = cookies();
  (await cookieStore).delete('token');

  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}
