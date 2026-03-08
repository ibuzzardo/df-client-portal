import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/dashboard/dashboard-header', () => ({
  DashboardHeader: () => <div data-testid="dashboard-header">Header</div>,
}));

vi.mock('@/components/dashboard/dashboard-sidebar', () => ({
  DashboardSidebar: () => <div data-testid="dashboard-sidebar">Sidebar</div>,
}));

describe('DashboardShell', () => {
  it('renders header, sidebar, and children', async () => {
    const mod = await import('@/components/dashboard/dashboard-shell');

    render(
      <mod.DashboardShell>
        <div>Dashboard content</div>
      </mod.DashboardShell>,
    );

    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});
