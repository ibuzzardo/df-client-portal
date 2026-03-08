import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const getDashboardDataMock = vi.fn();

vi.mock('@/lib/dashboard-data', () => ({
  getDashboardData: getDashboardDataMock,
}));

describe('DashboardPage', () => {
  it('renders summary cards and recent records', async () => {
    getDashboardDataMock.mockResolvedValue({
      summary: {
        totalClients: 3,
        activeProjects: 2,
        outstandingInvoices: 1,
        totalRevenueCents: 123400,
      },
      recentRecords: [
        {
          id: '1',
          type: 'client',
          title: 'Acme Co',
          subtitle: 'sarah@acme.com',
          status: 'ACTIVE',
          createdAt: '2024-10-01T00:00:00.000Z',
        },
      ],
    });

    const mod = await import('@/app/(dashboard)/page');
    const element = await mod.default();

    render(element);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Acme Co')).toBeInTheDocument();
  });

  it('renders fallback error state when data loading fails', async () => {
    getDashboardDataMock.mockRejectedValue(new Error('failed'));

    const mod = await import('@/app/(dashboard)/page');
    const element = await mod.default();

    render(element);

    expect(screen.getByText('Failed to load dashboard data.')).toBeInTheDocument();
  });
});
