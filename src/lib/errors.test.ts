import { describe, expect, it } from 'vitest';

import { createErrorResponse, normalizeError } from '@/lib/errors';

describe('normalizeError', () => {
  it('returns the message for Error instances', () => {
    expect(normalizeError(new Error('boom'))).toBe('boom');
  });

  it('returns a fallback message for non-Error values', () => {
    expect(normalizeError('boom')).toBe('An unexpected error occurred');
    expect(normalizeError(null)).toBe('An unexpected error occurred');
    expect(normalizeError({ message: 'boom' })).toBe('An unexpected error occurred');
  });
});

describe('createErrorResponse', () => {
  it('creates a JSON response with message and status', async () => {
    const response = createErrorResponse('failed', 500);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        message: 'failed',
        details: undefined,
      },
    });
  });

  it('includes details when provided', async () => {
    const response = createErrorResponse('failed', 400, ['a', 'b']);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        message: 'failed',
        details: ['a', 'b'],
      },
    });
  });
});
