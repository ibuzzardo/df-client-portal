import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthSessionMock = vi.fn();
const membershipFindManyMock = vi.fn();
const membershipCreateMock = vi.fn();
const userFindUniqueMock = vi.fn();
const invitationCreateMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    membership: {
      findMany: membershipFindManyMock,
      create: membershipCreateMock,
    },
    user: {
      findUnique: userFindUniqueMock,
    },
    invitation: {
      create: invitationCreateMock,
    },
  },
}));

describe('/api/tenants/[id]/members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/api/tenants/[id]/members/route');

    const response = await mod.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'tenant-1' }),
    });

    expect(response.status).toBe(401);
  });

  it('returns memberships for admin GET', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    membershipFindManyMock.mockResolvedValue([{ id: 'membership-1' }]);
    const mod = await import('@/app/api/tenants/[id]/members/route');

    const response = await mod.GET(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'tenant-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.memberships).toEqual([{ id: 'membership-1' }]);
  });

  it('creates membership when user exists', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    userFindUniqueMock.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
    membershipCreateMock.mockResolvedValue({ id: 'membership-1', user: { id: 'user-1' } });
    const mod = await import('@/app/api/tenants/[id]/members/route');

    const response = await mod.POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', role: 'CLIENT' }),
      headers: { 'Content-Type': 'application/json' },
    }), {
      params: Promise.resolve({ id: 'tenant-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.invited).toBe(false);
    expect(body.membership).toEqual({ id: 'membership-1', user: { id: 'user-1' } });
  });

  it('creates invitation when user does not exist', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    userFindUniqueMock.mockResolvedValue(null);
    invitationCreateMock.mockResolvedValue({ id: 'invite-1', email: 'new@example.com' });
    const mod = await import('@/app/api/tenants/[id]/members/route');

    const response = await mod.POST(new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com', role: 'ADMIN' }),
      headers: { 'Content-Type': 'application/json' },
    }), {
      params: Promise.resolve({ id: 'tenant-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.invited).toBe(true);
    expect(body.invitation).toEqual({ id: 'invite-1', email: 'new@example.com' });
  });
});
