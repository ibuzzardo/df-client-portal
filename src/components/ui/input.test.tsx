import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders with provided type and value changes', () => {
    const handleChange = vi.fn();

    render(<Input type="email" aria-label="Email" onChange={handleChange} />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');

    fireEvent.change(input, { target: { value: 'user@example.com' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies custom class names', () => {
    render(<Input aria-label="Name" className="custom-input" />);
    expect(screen.getByLabelText('Name')).toHaveClass('custom-input');
  });
});
