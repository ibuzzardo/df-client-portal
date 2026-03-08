import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaInstances: Array<{ options: unknown }> = [];

vi.mock('@prisma/client', () => {
  class PrismaClient {
    options: unknown;
    constructor(options: unknown) {
      this.options = options;
      prismaInstances.push({ options });
    }
  }

  return { PrismaClient };
});

describe('db', () => {
  beforeEach(() => {
    prismaInstances.length = 0;
    delete (globalThis as { prisma?: unknown }).prisma;
    vi.resetModules();
  });

  it('creates a Prisma client with development logging and stores it globally in non-production', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const mod = await import('@/lib/db');

    expect(mod.db).toBeDefined();
    expect(prismaInstances).toHaveLength(1);
    expect(prismaInstances[0]?.options).toEqual({ log: ['warn', 'error'] });
    expect((globalThis as { prisma?: unknown }).prisma).toBe(mod.db);
  });

  it('creates a Prisma client with production logging and does not store it globally', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const mod = await import('@/lib/db');

    expect(prismaInstances).toHaveLength(1);
    expect(prismaInstances[0]?.options).toEqual({ log: ['error'] });
    expect((globalThis as { prisma?: unknown }).prisma).toBeUndefined();
    expect(mod.db).toBeDefined();
  });

  it('reuses the global Prisma client when already present', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const existing = { existing: true };
    (globalThis as { prisma?: unknown }).prisma = existing;

    const mod = await import('@/lib/db');

    expect(mod.db).toBe(existing);
    expect(prismaInstances).toHaveLength(0);
  });
});
