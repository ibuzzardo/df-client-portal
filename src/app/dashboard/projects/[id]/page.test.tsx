import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthSessionMock = vi.fn();
const findUniqueMock = vi.fn();
const redirectMock = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});
const notFoundMock = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    project: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    getAuthSessionMock.mockReset();
    findUniqueMock.mockReset();
    redirectMock.mockClear();
    notFoundMock.mockClear();
  });

  it('redirects to /login when no session exists', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/dashboard/projects/[id]/page');

    await expect(mod.default({ params: Promise.resolve({ id: 'project-1' }) })).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('calls notFound when the project does not exist', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN', tenantId: null },
    });
    findUniqueMock.mockResolvedValue(null);
    const mod = await import('@/app/dashboard/projects/[id]/page');

    await expect(mod.default({ params: Promise.resolve({ id: 'project-1' }) })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('calls notFound when a client accesses another tenant project', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '2', email: 'client@test.com', role: 'CLIENT', tenantId: 'tenant-1' },
    });
    findUniqueMock.mockResolvedValue({
      id: 'project-1',
      tenantId: 'tenant-2',
      name: 'Secret Project',
      status: 'SUBMITTED',
      brief: 'This is a sufficiently detailed brief for the secret project.',
      tenant: { name: 'Tenant B' },
      submittedBy: { name: 'Alice', email: 'alice@test.com' },
      approvedBy: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      events: [],
    });
    const mod = await import('@/app/dashboard/projects/[id]/page');

    await expect(mod.default({ params: Promise.resolve({ id: 'project-1' }) })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders project details, events, and admin actions for submitted projects', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN', tenantId: null },
    });
    findUniqueMock.mockResolvedValue({
      id: 'project-1',
      tenantId: 'tenant-1',
      name: 'Launch Campaign',
      status: 'SUBMITTED',
      brief: 'This is a sufficiently detailed brief for the launch campaign project.',
      tenant: { name: 'Tenant A' },
      submittedBy: { name: 'Alice', email: 'alice@test.com' },
      approvedBy: null,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      events: [
        {
          id: 'event-1',
          type: 'STATUS_CHANGE',
          message: 'Project submitted',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          user: { name: 'Alice', email: 'alice@test.com' },
        },
      ],
    });
    const mod = await import('@/app/dashboard/projects/[id]/page');

    const element = await mod.default({ params: Promise.resolve({ id: 'project-1' }) });
    render(element);

    expect(screen.getByText('Launch Campaign')).toBeInTheDocument();
    expect(screen.getByText('Project submitted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });
});
