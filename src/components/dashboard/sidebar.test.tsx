import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const usePathnameMock = vi.fn();
const signOutMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock('next-auth/react', () => ({
  signOut: signOutMock,
}));

describe('Sidebar', () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
    signOutMock.mockReset();
  });

  it('renders user info and navigation links', async () => {
    usePathnameMock.mockReturnValue('/dashboard');
    const mod = await import('@/components/dashboard/sidebar');

    render(
      <mod.Sidebar
        user={{
          name: 'Admin User',
          email: 'admin@test.com',
          role: 'ADMIN',
        }}
      />,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('applies active styling to the current route', async () => {
    usePathnameMock.mockReturnValue('/dashboard/projects');
    const mod = await import('@/components/dashboard/sidebar');

    render(
      <mod.Sidebar
        user={{
          name: 'Client User',
          email: 'client@test.com',
          role: 'CLIENT',
        }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Projects' }).className).toContain('bg-slate-100');
  });

  it('calls signOut when the sign out button is clicked', async () => {
    usePathnameMock.mockReturnValue('/dashboard');
    signOutMock.mockResolvedValue(undefined);
    const mod = await import('@/components/dashboard/sidebar');

    render(
      <mod.Sidebar
        user={{
          name: 'Admin User',
          email: 'admin@test.com',
          role: 'ADMIN',
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });
});
