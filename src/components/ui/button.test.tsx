import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Button, buttonVariants } from '@/components/ui/button';

describe('buttonVariants', () => {
  it('returns default variant classes', () => {
    const classes = buttonVariants({});
    expect(classes).toContain('bg-[#2563EB]');
    expect(classes).toContain('h-10');
  });

  it('returns classes for specific variant and size', () => {
    const classes = buttonVariants({ variant: 'destructive', size: 'lg' });
    expect(classes).toContain('bg-[#DC2626]');
    expect(classes).toContain('h-11');
  });
});

describe('Button', () => {
  it('renders children and forwards button props', () => {
    render(
      <Button type="submit" disabled>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('applies custom className and variant classes', () => {
    render(
      <Button className="custom-class" variant="outline">
        Outline
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Outline' });
    expect(button.className).toContain('custom-class');
    expect(button.className).toContain('border');
  });
});
