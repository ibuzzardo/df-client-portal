import { describe, expect, it, vi } from 'vitest';

const nextAuthMock = vi.fn(() => 'handler');

vi.mock('next-auth', () => ({
  default: nextAuthMock,
}));

vi.mock('@/lib/auth', () => ({
  authOptions: { providers: [] },
}));

describe('auth route', () => {
  it('creates a NextAuth handler and exports it for GET and POST', async () => {
    const mod = await import('@/app/api/auth/[...nextauth]/route');

    expect(nextAuthMock).toHaveBeenCalledWith({ providers: [] });
    expect(mod.GET).toBe('handler');
    expect(mod.POST).toBe('handler');
  });
});
