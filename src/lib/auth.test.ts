import { beforeEach, describe, expect, it, vi } from 'vitest';

const compareMock = vi.fn();
const safeParseMock = vi.fn();
const findUniqueMock = vi.fn();
const findFirstMock = vi.fn();
const getServerSessionMock = vi.fn();
const prismaAdapterMock = vi.fn(() => ({ name: 'adapter' }));
const credentialsProviderMock = vi.fn((config) => ({ id: 'credentials', type: 'credentials', ...config }));

vi.mock('bcryptjs', () => ({
  compare: compareMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: findUniqueMock,
    },
    membership: {
      findFirst: findFirstMock,
    },
  },
}));

vi.mock('@/lib/validators/auth', () => ({
  loginSchema: {
    safeParse: safeParseMock,
  },
}));

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: prismaAdapterMock,
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: credentialsProviderMock,
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

describe('src/lib/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds authOptions with expected top-level configuration', async () => {
    const { authOptions } = await import('./auth');

    expect(prismaAdapterMock).toHaveBeenCalledTimes(1);
    expect(authOptions.session).toEqual({ strategy: 'jwt' });
    expect(authOptions.pages).toEqual({ signIn: '/login' });
    expect(authOptions.providers).toHaveLength(1);
    expect(credentialsProviderMock).toHaveBeenCalledTimes(1);
    expect(authOptions.secret).toBe(process.env.NEXTAUTH_SECRET);
  });

  it('configures credentials provider fields correctly', async () => {
    const { authOptions } = await import('./auth');
    const provider = authOptions.providers?.[0] as any;

    expect(provider.name).toBe('Credentials');
    expect(provider.credentials).toEqual({
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    });
    expect(typeof provider.authorize).toBe('function');
  });

  describe('authorize', () => {
    it('returns null when credentials fail schema validation', async () => {
      safeParseMock.mockReturnValue({ success: false, error: { issues: [] } });
      const { authOptions } = await import('./auth');
      const provider = authOptions.providers?.[0] as any;

      const result = await provider.authorize({ email: 'bad', password: '' });

      expect(result).toBeNull();
      expect(findUniqueMock).not.toHaveBeenCalled();
      expect(compareMock).not.toHaveBeenCalled();
    });

    it('returns null when user is not found', async () => {
      safeParseMock.mockReturnValue({
        success: true,
        data: { email: 'user@example.com', password: 'secret123' },
      });
      findUniqueMock.mockResolvedValue(null);

      const { authOptions } = await import('./auth');
      const provider = authOptions.providers?.[0] as any;
      const result = await provider.authorize({ email: 'user@example.com', password: 'secret123' });

      expect(findUniqueMock).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
      expect(result).toBeNull();
      expect(compareMock).not.toHaveBeenCalled();
    });

    it('returns null when user has no password hash', async () => {
      safeParseMock.mockReturnValue({
        success: true,
        data: { email: 'user@example.com', password: 'secret123' },
      });
      findUniqueMock.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        name: 'User',
        passwordHash: null,
      });

      const { authOptions } = await import('./auth');
      const provider = authOptions.providers?.[0] as any;
      const result = await provider.authorize({ email: 'user@example.com', password: 'secret123' });

      expect(result).toBeNull();
      expect(compareMock).not.toHaveBeenCalled();
    });

    it('returns null when password comparison fails', async () => {
      safeParseMock.mockReturnValue({
        success: true,
        data: { email: 'user@example.com', password: 'wrongpass' },
      });
      findUniqueMock.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        name: 'User',
        passwordHash: 'hashed',
      });
      compareMock.mockResolvedValue(false);

      const { authOptions } = await import('./auth');
      const provider = authOptions.providers?.[0] as any;
      const result = await provider.authorize({ email: 'user@example.com', password: 'wrongpass' });

      expect(compareMock).toHaveBeenCalledWith('wrongpass', 'hashed');
      expect(result).toBeNull();
    });

    it('returns normalized user data when credentials are valid', async () => {
      safeParseMock.mockReturnValue({
        success: true,
        data: { email: 'user@example.com', password: 'correctpass' },
      });
      findUniqueMock.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        name: 'User Name',
        passwordHash: 'hashed',
      });
      compareMock.mockResolvedValue(true);

      const { authOptions } = await import('./auth');
      const provider = authOptions.providers?.[0] as any;
      const result = await provider.authorize({ email: 'user@example.com', password: 'correctpass' });

      expect(result).toEqual({
        id: 'u1',
        email: 'user@example.com',
        name: 'User Name',
      });
    });

    it('returns null when schema parsing throws unexpectedly', async () => {
      safeParseMock.mockImplementation(() => {
        throw new Error('parse failed');
      });

      const { authOptions } = await import('./auth');
      const provider = authOptions.providers?.[0] as any;
      const result = await provider.authorize({ email: 'user@example.com', password: 'x' });

      expect(result).toBeNull();
    });

    it('returns null when database lookup throws unexpectedly', async () => {
      safeParseMock.mockReturnValue({
        success: true,
        data: { email: 'user@example.com', password: 'correctpass' },
      });
      findUniqueMock.mockRejectedValue(new Error('db error'));

      const { authOptions } = await import('./auth');
      const provider = authOptions.providers?.[0] as any;
      const result = await provider.authorize({ email: 'user@example.com', password: 'correctpass' });

      expect(result).toBeNull();
    });

    it('returns null when bcrypt compare throws unexpectedly', async () => {
      safeParseMock.mockReturnValue({
        success: true,
        data: { email: 'user@example.com', password: 'correctpass' },
      });
      findUniqueMock.mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        name: 'User Name',
        passwordHash: 'hashed',
      });
      compareMock.mockRejectedValue(new Error('bcrypt error'));

      const { authOptions } = await import('./auth');
      const provider = authOptions.providers?.[0] as any;
      const result = await provider.authorize({ email: 'user@example.com', password: 'correctpass' });

      expect(result).toBeNull();
    });
  });

  describe('jwt callback', () => {
    it('adds id, email, role, and tenantId when user and membership exist', async () => {
      findFirstMock.mockResolvedValue({
        role: 'ADMIN',
        tenantId: 'tenant-1',
        tenant: { id: 'tenant-1', slug: 'dark-fabrik' },
      });

      const { authOptions } = await import('./auth');
      const token = await authOptions.callbacks!.jwt!({
        token: { existing: 'value' } as any,
        user: { id: 'user-1', email: 'admin@example.com' } as any,
        account: null as any,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      });

      expect(findFirstMock).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { tenant: true },
      });
      expect(token).toMatchObject({
        existing: 'value',
        id: 'user-1',
        email: 'admin@example.com',
        role: 'ADMIN',
        tenantId: 'tenant-1',
      });
    });

    it('sets role and tenantId to null when membership is missing', async () => {
      findFirstMock.mockResolvedValue(null);

      const { authOptions } = await import('./auth');
      const token = await authOptions.callbacks!.jwt!({
        token: {} as any,
        user: { id: 'user-2', email: 'client@example.com' } as any,
        account: null as any,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      });

      expect(token).toMatchObject({
        id: 'user-2',
        email: 'client@example.com',
        role: null,
        tenantId: null,
      });
    });

    it('returns token unchanged when no user is provided', async () => {
      const { authOptions } = await import('./auth');
      const originalToken = { sub: 'abc' } as any;

      const token = await authOptions.callbacks!.jwt!({
        token: originalToken,
        user: undefined,
        account: null as any,
        profile: undefined,
        trigger: 'update',
        isNewUser: false,
        session: undefined,
      });

      expect(token).toBe(originalToken);
      expect(findFirstMock).not.toHaveBeenCalled();
    });

    it('returns token unchanged when membership lookup throws', async () => {
      findFirstMock.mockRejectedValue(new Error('membership failed'));

      const { authOptions } = await import('./auth');
      const originalToken = { keep: 'me' } as any;

      const token = await authOptions.callbacks!.jwt!({
        token: originalToken,
        user: { id: 'user-1', email: 'admin@example.com' } as any,
        account: null as any,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      });

      expect(token).toBe(originalToken);
      expect(token).toEqual({
        keep: 'me',
        id: 'user-1',
        email: 'admin@example.com',
      });
    });
  });

  describe('session callback', () => {
    it('hydrates session.user from token fields', async () => {
      const { authOptions } = await import('./auth');
      const session = {
        user: {
          email: 'user@example.com',
          name: 'User',
        },
        expires: '2099-01-01T00:00:00.000Z',
      } as any;

      const result = await authOptions.callbacks!.session!({
        session,
        token: { id: 'u1', role: 'CLIENT', tenantId: 't1' } as any,
        user: undefined,
        newSession: undefined,
        trigger: undefined,
      });

      expect(result.user).toMatchObject({
        email: 'user@example.com',
        name: 'User',
        id: 'u1',
        role: 'CLIENT',
        tenantId: 't1',
      });
    });

    it('leaves session unchanged when session.user is missing', async () => {
      const { authOptions } = await import('./auth');
      const session = { expires: '2099-01-01T00:00:00.000Z' } as any;

      const result = await authOptions.callbacks!.session!({
        session,
        token: { id: 'u1', role: 'CLIENT', tenantId: 't1' } as any,
        user: undefined,
        newSession: undefined,
        trigger: undefined,
      });

      expect(result).toBe(session);
      expect(result).toEqual({ expires: '2099-01-01T00:00:00.000Z' });
    });

    it('returns session unchanged when callback throws', async () => {
      const { authOptions } = await import('./auth');
      const session = {
        user: {
          set id(_value: string) {
            throw new Error('cannot assign');
          },
        },
      } as any;

      const result = await authOptions.callbacks!.session!({
        session,
        token: { id: 'u1', role: 'CLIENT', tenantId: 't1' } as any,
        user: undefined,
        newSession: undefined,
        trigger: undefined,
      });

      expect(result).toBe(session);
    });
  });

  describe('getAuthSession', () => {
    it('returns server session when getServerSession resolves', async () => {
      const fakeSession = { user: { id: 'u1' } };
      getServerSessionMock.mockResolvedValue(fakeSession);

      const { getAuthSession, authOptions } = await import('./auth');
      const result = await getAuthSession();

      expect(getServerSessionMock).toHaveBeenCalledWith(authOptions);
      expect(result).toBe(fakeSession);
    });

    it('returns null when getServerSession throws', async () => {
      getServerSessionMock.mockRejectedValue(new Error('session failed'));

      const { getAuthSession } = await import('./auth');
      const result = await getAuthSession();

      expect(result).toBeNull();
    });
  });
});
