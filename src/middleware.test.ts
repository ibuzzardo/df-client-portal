import { describe, expect, it, vi } from 'vitest';

vi.mock('next-auth/middleware', () => ({
  default: 'middleware-default-export',
}));

describe('middleware', () => {
  it('re-exports next-auth middleware as default', async () => {
    const mod = await import('@/middleware');
    expect(mod.default).toBe('middleware-default-export');
  });

  it('defines the expected matcher configuration', async () => {
    const mod = await import('@/middleware');
    expect(mod.config).toEqual({
      matcher: ['/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)'],
    });
  });
});
