import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthSessionMock = vi.fn();
const groupByMock = vi.fn();
const redirectMock = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    project: {
      groupBy: groupByMock,
    },
  },
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    getAuthSessionMock.mockReset();
    groupByMock.mockReset();
    redirectMock.mockClear();
  });

  it('redirects to /login when no session exists', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/dashboard/page');

    await expect(mod.default()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('renders grouped counts for admin users', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', tenantId: null },
    });
    groupByMock.mockResolvedValue([
      { status: 'SUBMITTED', _count: { status: 2 } },
      { status: 'APPROVED', _count: { status: 1 } },
    ]);
    const mod = await import('@/app/dashboard/page');

    const element = await mod.default();
    render(element);

    expect(groupByMock).toHaveBeenCalledWith({
      by: ['status'],
      where: undefined,
      _count: { status: true },
    });
    expect(screen.getByText('Welcome back, Admin')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders tenant-scoped counts for client users', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '2', email: 'client@test.com', name: 'Client', role: 'CLIENT', tenantId: 'tenant-1' },
    });
    groupByMock.mockResolvedValue([{ status: 'DELIVERED', _count: { status: 3 } }]);
    const mod = await import('@/app/dashboard/page');

    const element = await mod.default();
    render(element);

    expect(groupByMock).toHaveBeenCalledWith({
      by: ['status'],
      where: { tenantId: 'tenant-1' },
      _count: { status: true },
    });
    expect(screen.getByText('Welcome back, Client')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
