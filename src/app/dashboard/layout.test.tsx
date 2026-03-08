import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const getAuthSessionMock = vi.fn();
const redirectMock = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/components/dashboard/sidebar', () => ({
  Sidebar: ({ user }: { user: { email?: string | null } }) => <div>Sidebar for {user.email}</div>,
}));

describe('DashboardLayout', () => {
  it('redirects to /login when no session exists', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/dashboard/layout');

    await expect(
      mod.default({
        children: <div>content</div>,
      }),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('renders the sidebar and children when a session exists', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', tenantId: null },
    });
    const mod = await import('@/app/dashboard/layout');

    const element = await mod.default({
      children: <div>dashboard content</div>,
    });

    render(element);

    expect(screen.getByText('Sidebar for admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('dashboard content')).toBeInTheDocument();
  });
});
