import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const pushMock = vi.fn();
const useSessionMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: useSessionMock,
}));

describe('NewTenantPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionMock.mockReturnValue({
      data: { user: { role: 'ADMIN' } },
      status: 'authenticated',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      }),
    );
  });

  it('renders the form', async () => {
    const mod = await import('@/app/dashboard/tenants/new/page');

    render(<mod.default />);

    expect(screen.getByText('New Tenant')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Slug')).toBeInTheDocument();
  });

  it('submits successfully', async () => {
    const mod = await import('@/app/dashboard/tenants/new/page');

    render(<mod.default />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Acme Corp' } });
    expect(screen.getByLabelText('Slug')).toHaveValue('acme-corp');

    fireEvent.submit(screen.getByRole('button', { name: 'Create Tenant' }).closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard/tenants');
    });
  });
});
