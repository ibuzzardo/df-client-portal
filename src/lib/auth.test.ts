import { beforeEach, describe, expect, it, vi } from 'vitest';

const compareMock = vi.fn();
const getServerSessionMock = vi.fn();
const prismaAdapterMock = vi.fn(() => 'adapter');
const findUniqueMock = vi.fn();

vi.mock('bcryptjs', () => ({
  compare: compareMock,
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: prismaAdapterMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: (config: unknown) => ({ id: 'credentials', type: 'credentials', ...config }),
}));

describe('authOptions', () => {
  beforeEach(() => {
    vi.resetModules();
    compareMock.mockReset();
    getServerSessionMock.mockReset();
    prismaAdapterMock.mockClear();
    findUniqueMock.mockReset();
  });

  it('configures auth options with adapter, database sessions, custom sign-in page, and secret', async () => {
    vi.stubEnv('NEXTAUTH_SECRET', 'super-secret');
    const { authOptions } = await import('@/lib/auth');

    expect(prismaAdapterMock).toHaveBeenCalledTimes(1);
    expect(authOptions.adapter).toBe('adapter');
    expect(authOptions.session?.strategy).toBe('database');
    expect(authOptions.pages?.signIn).toBe('/login');
    expect(authOptions.secret).toBe('super-secret');
    expect(authOptions.providers).toHaveLength(1);
  });

  it('authorizes valid credentials and returns a safe user object', async () => {
    const { authOptions } = await import('@/lib/auth');
    const provider = authOptions.providers?.[0] as { authorize: (credentials: unknown) => Promise<unknown> };

    findUniqueMock.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password',
    });
    compareMock.mockResolvedValue(true);

    await expect(
      provider.authorize({ email: 'user@example.com', password: 'password123' }),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
    });

    expect(findUniqueMock).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
    expect(compareMock).toHaveBeenCalledWith('password123', 'hashed-password');
  });

  it('returns null when credentials fail schema validation', async () => {
    const { authOptions } = await import('@/lib/auth');
    const provider = authOptions.providers?.[0] as { authorize: (credentials: unknown) => Promise<unknown> };

    await expect(provider.authorize({ email: 'bad-email', password: 'short' })).resolves.toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(compareMock).not.toHaveBeenCalled();
  });

  it('returns null when user is not found', async () => {
    const { authOptions } = await import('@/lib/auth');
    const provider = authOptions.providers?.[0] as { authorize: (credentials: unknown) => Promise<unknown> };

    findUniqueMock.mockResolvedValue(null);

    await expect(
      provider.authorize({ email: 'user@example.com', password: 'password123' }),
    ).resolves.toBeNull();
    expect(compareMock).not.toHaveBeenCalled();
  });

  it('returns null when user has no password hash', async () => {
    const { authOptions } = await import('@/lib/auth');
    const provider = authOptions.providers?.[0] as { authorize: (credentials: unknown) => Promise<unknown> };

    findUniqueMock.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      passwordHash: null,
    });

    await expect(
      provider.authorize({ email: 'user@example.com', password: 'password123' }),
    ).resolves.toBeNull();
    expect(compareMock).not.toHaveBeenCalled();
  });

  it('returns null when password comparison fails', async () => {
    const { authOptions } = await import('@/lib/auth');
    const provider = authOptions.providers?.[0] as { authorize: (credentials: unknown) => Promise<unknown> };

    findUniqueMock.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      passwordHash: 'hashed-password',
    });
    compareMock.mockResolvedValue(false);

    await expect(
      provider.authorize({ email: 'user@example.com', password: 'password123' }),
    ).resolves.toBeNull();
  });

  it('returns null when database lookup throws', async () => {
    const { authOptions } = await import('@/lib/auth');
    const provider = authOptions.providers?.[0] as { authorize: (credentials: unknown) => Promise<unknown> };

    findUniqueMock.mockRejectedValue(new Error('db failure'));

    await expect(
      provider.authorize({ email: 'user@example.com', password: 'password123' }),
    ).resolves.toBeNull();
  });

  it('adds the user id to the session when session.user exists', async () => {
    const { authOptions } = await import('@/lib/auth');
    const sessionCallback = authOptions.callbacks?.session;

    const session = { user: { name: 'User', email: 'user@example.com' } };
    const user = { id: 'user-1' };

    const result = await sessionCallback?.({ session, user } as never);

    expect(result).toEqual({
      user: { name: 'User', email: 'user@example.com', id: 'user-1' },
    });
  });

  it('returns the session unchanged when session.user is missing', async () => {
    const { authOptions } = await import('@/lib/auth');
    const sessionCallback = authOptions.callbacks?.session;

    const session = {};
    const user = { id: 'user-1' };

    await expect(sessionCallback?.({ session, user } as never)).resolves.toBe(session);
  });
});

describe('getAuthSession', () => {
  beforeEach(() => {
    vi.resetModules();
    getServerSessionMock.mockReset();
  });

  it('returns the server session when retrieval succeeds', async () => {
    const fakeSession = { user: { id: '1' } };
    getServerSessionMock.mockResolvedValue(fakeSession);

    const { getAuthSession, authOptions } = await import('@/lib/auth');

    await expect(getAuthSession()).resolves.toBe(fakeSession);
    expect(getServerSessionMock).toHaveBeenCalledWith(authOptions);
  });

  it('returns null when getServerSession throws', async () => {
    getServerSessionMock.mockRejectedValue(new Error('session failure'));

    const { getAuthSession } = await import('@/lib/auth');

    await expect(getAuthSession()).resolves.toBeNull();
  });
});
