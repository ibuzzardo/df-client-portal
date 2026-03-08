import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthSessionMock = vi.fn();
const findManyMock = vi.fn();
const redirectMock = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    project: {
      findMany: findManyMock,
    },
  },
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

describe('ProjectsPage', () => {
  beforeEach(() => {
    getAuthSessionMock.mockReset();
    findManyMock.mockReset();
    redirectMock.mockClear();
  });

  it('redirects to /login when no session exists', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/dashboard/projects/page');

    await expect(mod.default()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('renders all projects for admin users without new project button', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN', tenantId: null },
    });
    findManyMock.mockResolvedValue([
      {
        id: 'project-1',
        name: 'Admin Project',
        status: 'SUBMITTED',
        tenant: { name: 'Tenant A' },
        submittedBy: { name: 'Alice', email: 'alice@test.com' },
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);
    const mod = await import('@/app/dashboard/projects/page');

    const element = await mod.default();
    render(element);

    expect(findManyMock).toHaveBeenCalledWith({
      where: undefined,
      include: { tenant: true, submittedBy: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(screen.getAllByText('Admin Project')).toHaveLength(2);
    expect(screen.queryByRole('link', { name: 'New Project' })).not.toBeInTheDocument();
  });

  it('renders tenant-scoped projects for client users with new project button', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '2', email: 'client@test.com', role: 'CLIENT', tenantId: 'tenant-1' },
    });
    findManyMock.mockResolvedValue([
      {
        id: 'project-2',
        name: 'Client Project',
        status: 'APPROVED',
        tenant: { name: 'Tenant B' },
        submittedBy: { name: null, email: 'client@test.com' },
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
      },
    ]);
    const mod = await import('@/app/dashboard/projects/page');

    const element = await mod.default();
    render(element);

    expect(findManyMock).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      include: { tenant: true, submittedBy: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(screen.getAllByText('Client Project')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'New Project' })).toBeInTheDocument();
  });
});
