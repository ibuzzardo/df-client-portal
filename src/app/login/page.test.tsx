import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/auth/login-form', () => ({
  LoginForm: () => <div data-testid="login-form">login form</div>,
}));

describe('LoginPage', () => {
  it('renders branding, description, login form, and footer copy', async () => {
    const mod = await import('@/app/login/page');
    const LoginPage = mod.default;

    render(<LoginPage />);

    expect(screen.getByText('Dark Fabrik')).toBeInTheDocument();
    expect(screen.getByText('Client Portal')).toBeInTheDocument();
    expect(screen.getByText('Sign in to access your tenant workspace.')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(
      screen.getByText('Protected by secure authentication and tenant-aware access controls.'),
    ).toBeInTheDocument();
  });
});
