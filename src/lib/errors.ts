import { NextResponse } from 'next/server';

export interface ApiErrorBody {
  error: {
    message: string;
    details?: string[];
  };
}

export function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function createErrorResponse(
  message: string,
  status: number,
  details?: string[],
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error: {
        message,
        details,
      },
    },
    { status },
  );
}
