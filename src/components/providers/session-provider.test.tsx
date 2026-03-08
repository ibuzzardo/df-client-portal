import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const nextAuthProviderMock = vi.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid="next-auth-provider">{children}</div>
));

vi.mock('next-auth/react', () => ({
  SessionProvider: nextAuthProviderMock,
}));

describe('SessionProvider', () => {
  it('wraps children with NextAuth SessionProvider', async () => {
    const { SessionProvider } = await import('@/components/providers/session-provider');

    render(
      <SessionProvider>
        <span>child content</span>
      </SessionProvider>,
    );

    expect(screen.getByTestId('next-auth-provider')).toBeInTheDocument();
    expect(screen.getByText('child content')).toBeInTheDocument();
    expect(nextAuthProviderMock).toHaveBeenCalled();
  });
});
