import { describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

describe('HomePage', () => {
  it('redirects to /dashboard', async () => {
    const mod = await import('@/app/page');

    expect(() => mod.default()).toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
  });
});
