import { describe, expect, it, vi } from 'vitest';

const jsonMock = vi.fn((body: unknown, init?: ResponseInit) => ({ body, init }));

vi.mock('next/server', () => ({
  NextResponse: {
    json: jsonMock,
  },
}));

describe('GET /api/health', () => {
  it('returns a healthy response with status 200', async () => {
    const { GET } = await import('@/app/api/health/route');

    const response = await GET();

    expect(jsonMock).toHaveBeenCalledTimes(1);
    expect(response).toMatchObject({
      body: {
        status: 'ok',
        timestamp: expect.any(String),
      },
      init: { status: 200 },
    });
  });
});
