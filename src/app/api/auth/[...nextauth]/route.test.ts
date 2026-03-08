import { describe, expect, it, vi } from 'vitest';

const nextAuthMock = vi.fn(() => 'next-auth-handler');

vi.mock('next-auth', () => ({
  default: nextAuthMock,
}));

vi.mock('@/lib/auth', () => ({
  authOptions: { secret: 'secret' },
}));

describe('auth route', () => {
  it('creates a NextAuth handler with authOptions and exports it for GET and POST', async () => {
    const mod = await import('@/app/api/auth/[...nextauth]/route');

    expect(nextAuthMock).toHaveBeenCalledWith({ secret: 'secret' });
    expect(mod.GET).toBe('next-auth-handler');
    expect(mod.POST).toBe('next-auth-handler');
  });
});
