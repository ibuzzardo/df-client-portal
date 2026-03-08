import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryRawMock = vi.fn();
const normalizeErrorMock = vi.fn((error: unknown) => `normalized:${String((error as Error)?.message ?? error)}`);
const createErrorResponseMock = vi.fn((message: string, status: number) =>
  Response.json({ error: { message } }, { status }),
);

vi.mock('@/lib/db', () => ({
  db: {
    $queryRaw: queryRawMock,
  },
}));

vi.mock('@/lib/errors', () => ({
  normalizeError: normalizeErrorMock,
  createErrorResponse: createErrorResponseMock,
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.resetModules();
    queryRawMock.mockReset();
    normalizeErrorMock.mockClear();
    createErrorResponseMock.mockClear();
  });

  it('returns healthy status when database query succeeds and auth is configured', async () => {
    vi.stubEnv('NEXTAUTH_SECRET', 'secret');
    queryRawMock.mockResolvedValue([{ '?column?': 1 }]);

    const { GET } = await import('@/app/api/health/route');
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'healthy',
      services: {
        database: 'connected',
        auth: 'configured',
      },
    });
  });

  it('returns healthy status with missing auth when NEXTAUTH_SECRET is absent', async () => {
    vi.stubEnv('NEXTAUTH_SECRET', '');
    queryRawMock.mockResolvedValue([{ '?column?': 1 }]);

    const { GET } = await import('@/app/api/health/route');
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'healthy',
      services: {
        database: 'connected',
        auth: 'missing',
      },
    });
  });

  it('returns a normalized error response when the database query fails', async () => {
    const error = new Error('db down');
    queryRawMock.mockRejectedValue(error);

    const { GET } = await import('@/app/api/health/route');
    const response = await GET();

    expect(normalizeErrorMock).toHaveBeenCalledWith(error);
    expect(createErrorResponseMock).toHaveBeenCalledWith('normalized:db down', 500);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        message: 'normalized:db down',
      },
    });
  });
});
