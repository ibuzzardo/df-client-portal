import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { createErrorResponse, normalizeError } from '@/lib/errors';

export async function GET(): Promise<NextResponse> {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      services: {
        database: 'connected',
        auth: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
      },
    });
  } catch (error) {
    return createErrorResponse(normalizeError(error), 500);
  }
}
