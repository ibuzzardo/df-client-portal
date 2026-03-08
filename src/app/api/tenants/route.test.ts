import { describe, expect, it, vi, beforeEach } from 'vitest';

const getAuthSessionMock = vi.fn();
const findManyMock = vi.fn();
const createMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    tenant: {
      findMany: findManyMock,
      create: createMock,
    },
  },
}));

describe('/api/tenants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for GET when unauthenticated', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/api/tenants/route');

    const response = await mod.GET();

    expect(response.status).toBe(401);
  });

  it('returns tenants for admin GET', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    findManyMock.mockResolvedValue([{ id: 'tenant-1', name: 'Acme' }]);
    const mod = await import('@/app/api/tenants/route');

    const response = await mod.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tenants).toEqual([{ id: 'tenant-1', name: 'Acme' }]);
  });

  it('returns 401 for POST when unauthenticated', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/api/tenants/route');

    const response = await mod.POST(new Request('http://localhost/api/tenants', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme', slug: 'acme' }),
      headers: { 'Content-Type': 'application/json' },
    }));

    expect(response.status).toBe(401);
  });

  it('returns 403 for POST when user is client', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'CLIENT' } });
    const mod = await import('@/app/api/tenants/route');

    const response = await mod.POST(new Request('http://localhost/api/tenants', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme', slug: 'acme' }),
      headers: { 'Content-Type': 'application/json' },
    }));

    expect(response.status).toBe(403);
  });

  it('creates a tenant for admin POST', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    createMock.mockResolvedValue({ id: 'tenant-1', name: 'Acme', slug: 'acme' });
    const mod = await import('@/app/api/tenants/route');

    const response = await mod.POST(new Request('http://localhost/api/tenants', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme', slug: 'acme' }),
      headers: { 'Content-Type': 'application/json' },
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.tenant).toEqual({ id: 'tenant-1', name: 'Acme', slug: 'acme' });
  });
});
