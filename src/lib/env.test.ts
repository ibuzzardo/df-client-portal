import { afterEach, describe, expect, it, vi } from 'vitest';

import { getEnv } from '@/lib/env';

describe('getEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns parsed environment variables when valid', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:password@localhost:5432/db');
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
    vi.stubEnv('NEXTAUTH_SECRET', 'secret');

    expect(getEnv()).toEqual({
      DATABASE_URL: 'postgresql://user:password@localhost:5432/db',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'secret',
    });
  });

  it('throws when required variables are missing or invalid', () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('NEXTAUTH_URL', 'not-a-url');
    vi.stubEnv('NEXTAUTH_SECRET', '');

    expect(() => getEnv()).toThrowError(/Invalid environment configuration/);
  });

  it('includes all validation messages in the thrown error', () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('NEXTAUTH_URL', 'invalid');
    vi.stubEnv('NEXTAUTH_SECRET', '');

    expect(() => getEnv()).toThrowError(
      /DATABASE_URL is required, NEXTAUTH_URL must be a valid URL, NEXTAUTH_SECRET is required/,
    );
  });

  it('throws when variables are undefined', () => {
    vi.stubEnv('DATABASE_URL', undefined as unknown as string);
    vi.stubEnv('NEXTAUTH_URL', undefined as unknown as string);
    vi.stubEnv('NEXTAUTH_SECRET', undefined as unknown as string);

    expect(() => getEnv()).toThrowError(/Invalid environment configuration/);
  });
});
