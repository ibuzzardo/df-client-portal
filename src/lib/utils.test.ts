import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('filters falsy values via clsx', () => {
    expect(cn('base', false && 'hidden', undefined, null, 'active')).toBe('base active');
  });

  it('resolves conflicting tailwind classes using tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
