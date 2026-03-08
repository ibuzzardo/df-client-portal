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

    await expect(provider.authorize({ email: 'user@example.com', password: 'password123' })).resolves.toBeNull();
  });

  it('returns null when password hash is missing', async () => {
    const { authOptions } = await import('@/lib/auth');
    const provider = authOptions.providers?.[0] as { authorize: (credentials: unknown) => Promise<unknown> };

    findUniqueMock.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      passwordHash: null,
    });

    await expect(provider.authorize({ email: 'user@example.com', password: 'password123' })).resolves.toBeNull();
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

    await expect(provider.authorize({ email: 'user@example.com', password: 'password123' })).resolves.toBeNull();
  });

  it('returns null when authorize throws', async () => {
    const { authOptions } = await import('@/lib/auth');
    const provider = authOptions.providers?.[0] as { authorize: (credentials: unknown) => Promise<unknown> };

    findUniqueMock.mockRejectedValue(new Error('db error'));

    await expect(provider.authorize({ email: 'user@example.com', password: 'password123' })).resolves.toBeNull();
  });

  it('adds the user id to the session when available', async () => {
    const { authOptions } = await import('@/lib/auth');

    const result = await authOptions.callbacks?.session?.({
      session: { user: { email: 'user@example.com', name: 'Test User' } },
      user: { id: 'user-1' },
    } as never);

    expect(result).toEqual({
      user: {
        email: 'user@example.com',
        name: 'Test User',
        id: 'user-1',
      },
    });
  });

  it('returns the session unchanged when callback throws', async () => {
    const { authOptions } = await import('@/lib/auth');

    const result = await authOptions.callbacks?.session?.({
      get session() {
        throw new Error('session error');
      },
      user: { id: 'user-1' },
    } as never);

    expect(result).toBeUndefined();
  });

  it('returns the server session when available', async () => {
    const session = { user: { email: 'user@example.com' } };
    getServerSessionMock.mockResolvedValue(session);

    const { getAuthSession } = await import('@/lib/auth');

    await expect(getAuthSession()).resolves.toBe(session);
    expect(getServerSessionMock).toHaveBeenCalledWith(expect.any(Object));
  });

  it('returns null when getServerSession throws', async () => {
    getServerSessionMock.mockRejectedValue(new Error('auth error'));

    const { getAuthSession } = await import('@/lib/auth');

    await expect(getAuthSession()).resolves.toBeNull();
  });
});
