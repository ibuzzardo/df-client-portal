import { beforeEach, describe, expect, it, vi } from 'vitest';

const hashMock = vi.fn();
const userUpsertMock = vi.fn();
const tenantUpsertMock = vi.fn();
const membershipUpsertMock = vi.fn();
const disconnectMock = vi.fn();
const exitCodeDescriptor = Object.getOwnPropertyDescriptor(process, 'exitCode');

vi.mock('bcryptjs', () => ({
  hash: hashMock,
}));

vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn(() => ({
    user: { upsert: userUpsertMock },
    tenant: { upsert: tenantUpsertMock },
    membership: { upsert: membershipUpsertMock },
    $disconnect: disconnectMock,
  }));

  return {
    PrismaClient,
    MemberRole: {
      ADMIN: 'ADMIN',
      CLIENT: 'CLIENT',
    },
  };
});

describe('prisma/seed', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    hashMock.mockReset();
    userUpsertMock.mockReset();
    tenantUpsertMock.mockReset();
    membershipUpsertMock.mockReset();
    disconnectMock.mockReset();
    process.exitCode = undefined;
  });

  it('seeds admin/client users, tenants, memberships, and disconnects', async () => {
    hashMock
      .mockResolvedValueOnce('admin-hash')
      .mockResolvedValueOnce('client-hash');

    userUpsertMock
      .mockResolvedValueOnce({ id: 'admin-user-id', email: 'admin@darkfabrik.io' })
      .mockResolvedValueOnce({ id: 'client-user-id', email: 'client@example.com' });

    tenantUpsertMock
      .mockResolvedValueOnce({ id: 'admin-tenant-id', slug: 'dark-fabrik' })
      .mockResolvedValueOnce({ id: 'client-tenant-id', slug: 'acme-corp' });

    membershipUpsertMock.mockResolvedValue({});

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('./seed');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(hashMock).toHaveBeenNthCalledWith(1, 'admin123', 12);
    expect(hashMock).toHaveBeenNthCalledWith(2, 'client123', 12);

    expect(userUpsertMock).toHaveBeenNthCalledWith(1, {
      where: { email: 'admin@darkfabrik.io' },
      update: {
        name: 'Admin User',
        passwordHash: 'admin-hash',
      },
      create: {
        email: 'admin@darkfabrik.io',
        name: 'Admin User',
        passwordHash: 'admin-hash',
      },
    });

    expect(userUpsertMock).toHaveBeenNthCalledWith(2, {
      where: { email: 'client@example.com' },
      update: {
        name: 'Client User',
        passwordHash: 'client-hash',
      },
      create: {
        email: 'client@example.com',
        name: 'Client User',
        passwordHash: 'client-hash',
      },
    });

    expect(tenantUpsertMock).toHaveBeenNthCalledWith(1, {
      where: { slug: 'dark-fabrik' },
      update: { name: 'Dark Fabrik' },
      create: { name: 'Dark Fabrik', slug: 'dark-fabrik' },
    });

    expect(tenantUpsertMock).toHaveBeenNthCalledWith(2, {
      where: { slug: 'acme-corp' },
      update: { name: 'Acme Corp' },
      create: { name: 'Acme Corp', slug: 'acme-corp' },
    });

    expect(membershipUpsertMock).toHaveBeenNthCalledWith(1, {
      where: {
        userId_tenantId: {
          userId: 'admin-user-id',
          tenantId: 'admin-tenant-id',
        },
      },
      update: { role: 'ADMIN' },
      create: {
        userId: 'admin-user-id',
        tenantId: 'admin-tenant-id',
        role: 'ADMIN',
      },
    });

    expect(membershipUpsertMock).toHaveBeenNthCalledWith(2, {
      where: {
        userId_tenantId: {
          userId: 'client-user-id',
          tenantId: 'client-tenant-id',
        },
      },
      update: { role: 'CLIENT' },
      create: {
        userId: 'client-user-id',
        tenantId: 'client-tenant-id',
        role: 'CLIENT',
      },
    });

    expect(disconnectMock).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('logs seed failure, sets exitCode to 1, and disconnects when main rejects', async () => {
    const seedError = new Error('user upsert failed');
    hashMock
      .mockResolvedValueOnce('admin-hash')
      .mockResolvedValueOnce('client-hash');
    userUpsertMock.mockRejectedValue(seedError);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('./seed');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorSpy).toHaveBeenCalledWith('Seed failed:', seedError);
    expect(errorSpy).toHaveBeenCalledWith('Unhandled seed error:', seedError);
    expect(process.exitCode).toBe(1);
    expect(disconnectMock).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('still sets exitCode to 1 when console.error throws inside catch handler', async () => {
    const seedError = new Error('hash failed');
    hashMock.mockRejectedValue(seedError);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      throw new Error('console unavailable');
    });

    await import('./seed');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(process.exitCode).toBe(1);
    expect(disconnectMock).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('swallows disconnect errors in finally block', async () => {
    hashMock
      .mockResolvedValueOnce('admin-hash')
      .mockResolvedValueOnce('client-hash');
    userUpsertMock
      .mockResolvedValueOnce({ id: 'admin-user-id' })
      .mockResolvedValueOnce({ id: 'client-user-id' });
    tenantUpsertMock
      .mockResolvedValueOnce({ id: 'admin-tenant-id' })
      .mockResolvedValueOnce({ id: 'client-tenant-id' });
    membershipUpsertMock.mockResolvedValue({});
    disconnectMock.mockRejectedValue(new Error('disconnect failed'));

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(import('./seed')).resolves.toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(disconnectMock).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  afterAll(() => {
    if (exitCodeDescriptor) {
      Object.defineProperty(process, 'exitCode', exitCodeDescriptor);
    }
  });
});
