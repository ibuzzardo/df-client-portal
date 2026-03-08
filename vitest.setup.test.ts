import { describe, expect, it } from 'vitest';

describe('vitest.setup runtime effects', () => {
  it('registers jest-dom matchers globally', () => {
    expect(document.createElement('div')).toBeInTheDocument;
    expect(typeof expect(document.body).toBeInTheDocument).toBe('function');
  });
});
