import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-font' }),
}));

vi.mock('@/components/providers/session-provider', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

describe('RootLayout', () => {
  it('renders html/body structure and wraps children in SessionProvider', async () => {
    const mod = await import('@/app/layout');
    const RootLayout = mod.default;

    const { container } = render(
      <RootLayout>
        <main>page content</main>
      </RootLayout>,
    );

    expect(container.querySelector('html')).toHaveAttribute('lang', 'en');
    expect(container.querySelector('body')).toHaveClass('inter-font');
    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('exports the expected metadata', async () => {
    const mod = await import('@/app/layout');

    expect(mod.metadata).toEqual({
      title: 'Dark Fabrik Client Portal',
      description: 'Multi-tenant client portal for the Dark Fabrik pipeline.',
    });
  });
});
