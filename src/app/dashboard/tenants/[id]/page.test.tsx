import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const pushMock = vi.fn();
const useSessionMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: 'tenant-1' }),
}));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
}));

describe('TenantDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects non-admin users', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { role: 'CLIENT' } },
      status: 'authenticated',
    });
    vi.stubGlobal('fetch', vi.fn());
    const mod = await import('@/app/dashboard/tenants/[id]/page');

    render(<mod.default />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('renders tenant metadata and members', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { role: 'ADMIN' } },
      status: 'authenticated',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({
            memberships: [
              {
                id: 'membership-1',
                role: 'ADMIN',
                user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({
            tenants: [
              {
                id: 'tenant-1',
                name: 'Acme',
                slug: 'acme',
                createdAt: '2024-01-01T00:00:00.000Z',
              },
            ],
          }),
        }),
    );
    const mod = await import('@/app/dashboard/tenants/[id]/page');

    render(<mod.default />);

    expect(await screen.findByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Tenant Details')).toBeInTheDocument();
  });

  it('renders projects section and add member form', async () => {
    useSessionMock.mockReturnValue({
      data: { user: { role: 'ADMIN' } },
      status: 'authenticated',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({ memberships: [] }),
        })
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({
            tenants: [
              {
                id: 'tenant-1',
                name: 'Acme',
                slug: 'acme',
                createdAt: '2024-01-01T00:00:00.000Z',
              },
            ],
          }),
        }),
    );
    const mod = await import('@/app/dashboard/tenants/[id]/page');

    render(<mod.default />);

    expect(await screen.findByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Add Member')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});
