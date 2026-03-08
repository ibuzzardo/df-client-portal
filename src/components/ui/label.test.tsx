import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Label } from '@/components/ui/label';

describe('Label', () => {
  it('renders label text and htmlFor', () => {
    render(<Label htmlFor="email">Email</Label>);

    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveAttribute('for', 'email');
  });

  it('applies custom class names', () => {
    render(<Label className="custom-label">Name</Label>);
    expect(screen.getByText('Name')).toHaveClass('custom-label');
  });
});
