import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Card } from '@/components/ui/card';

describe('Card', () => {
  it('renders children with base styles', () => {
    const { getByText } = render(<Card>content</Card>);
    const card = getByText('content');

    expect(card).toBeInTheDocument();
    expect(card.className).toContain('rounded-xl');
    expect(card.className).toContain('shadow-sm');
  });

  it('merges custom class names', () => {
    const { container } = render(<Card className="custom-card">content</Card>);
    expect(container.firstChild).toHaveClass('custom-card');
  });
});
