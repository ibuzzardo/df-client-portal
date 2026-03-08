import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const pushMock = vi.fn();
const refreshMock = vi.fn();
const replaceMock = vi.fn();
const useSessionMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
    replace: replaceMock,
  }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

describe('NewProjectPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    replaceMock.mockReset();
    useSessionMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('redirects admin users to the projects list', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { role: 'ADMIN' } },
    });
    const mod = await import('@/app/dashboard/projects/new/page');

    render(<mod.default />);

    expect(replaceMock).toHaveBeenCalledWith('/dashboard/projects');
  });

  it('submits the form and redirects on success', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { role: 'CLIENT' } },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal('fetch', fetchMock);
    const mod = await import('@/app/dashboard/projects/new/page');

    render(<mod.default />);

    fireEvent.change(screen.getByLabelText('Project Name'), {
      target: { value: 'New Website' },
    });
    fireEvent.change(screen.getByLabelText('Brief'), {
      target: { value: 'This is a detailed project brief that is long enough.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Project' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Website',
          brief: 'This is a detailed project brief that is long enough.',
        }),
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard/projects');
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it('shows an error message when the API returns an error', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { role: 'CLIENT' } },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: { message: 'Invalid request body', details: ['Brief must be at least 20 characters'] },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const mod = await import('@/app/dashboard/projects/new/page');

    render(<mod.default />);

    fireEvent.change(screen.getByLabelText('Project Name'), {
      target: { value: 'New Website' },
    });
    fireEvent.change(screen.getByLabelText('Brief'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Project' }));

    await waitFor(() => {
      expect(screen.getByText('Brief must be at least 20 characters')).toBeInTheDocument();
    });
  });
});
