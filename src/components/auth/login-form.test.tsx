import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInMock = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: signInMock,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    signInMock.mockReset();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: 'http://localhost/' },
    });
  });

  it('renders form fields and submit button', async () => {
    const { LoginForm } = await import('@/components/auth/login-form');

    render(<LoginForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('submits credentials to signIn with expected options', async () => {
    signInMock.mockResolvedValue({ error: null, url: '/dashboard' });
    const { LoginForm } = await import('@/components/auth/login-form');

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('credentials', {
        email: 'user@example.com',
        password: 'password123',
        redirect: false,
        callbackUrl: '/',
      });
    });

    expect(window.location.href).toBe('/dashboard');
  });

  it('shows invalid credentials error when signIn returns null', async () => {
    signInMock.mockResolvedValue(null);
    const { LoginForm } = await import('@/components/auth/login-form');

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(window.location.href).toBe('http://localhost/');
  });

  it('shows invalid credentials error when signIn returns an error', async () => {
    signInMock.mockResolvedValue({ error: 'CredentialsSignin', url: null });
    const { LoginForm } = await import('@/components/auth/login-form');

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('shows a generic error when signIn throws', async () => {
    signInMock.mockRejectedValue(new Error('network failure'));
    const { LoginForm } = await import('@/components/auth/login-form');

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Unable to sign in. Please try again.')).toBeInTheDocument();
  });

  it('shows loading state while submitting and resets it afterwards', async () => {
    let resolvePromise: (value: { error: null; url: string }) => void = () => undefined;
    signInMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { LoginForm } = await import('@/components/auth/login-form');

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();

    resolvePromise({ error: null, url: '/' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).not.toBeDisabled();
    });
  });
});
