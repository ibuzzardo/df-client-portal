import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});
const getAuthSessionMock = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/components/dashboard/dashboard-shell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-shell">{children}</div>,
}));

describe('DashboardLayout', () => {
  it('redirects unauthenticated users to login', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/(dashboard)/layout');

    await expect(mod.default({ children: <div>content</div> })).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('renders dashboard shell for authenticated users', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    const mod = await import('@/app/(dashboard)/layout');
    const element = await mod.default({ children: <div>content</div> });

    render(element);

    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
