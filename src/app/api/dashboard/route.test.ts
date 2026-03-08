import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthSessionMock = vi.fn();
const getDashboardDataMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/lib/dashboard-data', () => ({
  getDashboardData: getDashboardDataMock,
}));

describe('GET /api/dashboard', () => {
  beforeEach(() => {
    getAuthSessionMock.mockReset();
    getDashboardDataMock.mockReset();
  });

  it('returns dashboard data for authenticated users', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    getDashboardDataMock.mockResolvedValue({
      summary: {
        totalClients: 2,
        activeProjects: 1,
        outstandingInvoices: 1,
        totalRevenueCents: 1000,
      },
      recentRecords: [{ id: '1', type: 'client', title: 'Acme', subtitle: 'a', status: 'ACTIVE', createdAt: '2024-01-01' }],
    });

    const mod = await import('@/app/api/dashboard/route');
    const response = await mod.GET(new Request('http://localhost:3000/api/dashboard'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.summary.totalClients).toBe(2);
  });

  it('returns 401 for unauthenticated users', async () => {
    getAuthSessionMock.mockResolvedValue(null);

    const mod = await import('@/app/api/dashboard/route');
    const response = await mod.GET(new Request('http://localhost:3000/api/dashboard'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for invalid query params', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { id: 'user-1' } });

    const mod = await import('@/app/api/dashboard/route');
    const response = await mod.GET(new Request('http://localhost:3000/api/dashboard?limit=0'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain('limit must be at least 1');
  });

  it('returns 500 when dashboard loading fails', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    getDashboardDataMock.mockRejectedValue(new Error('boom'));

    const mod = await import('@/app/api/dashboard/route');
    const response = await mod.GET(new Request('http://localhost:3000/api/dashboard'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
