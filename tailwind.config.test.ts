import { describe, expect, it } from 'vitest';
import config from './tailwind.config';

describe('tailwind.config', () => {
  it('exports expected content paths and dark mode strategy', () => {
    expect(config.content).toEqual(['./src/**/*.{ts,tsx}']);
    expect(config.darkMode).toBe('class');
  });

  it('extends theme with expected brand colors', () => {
    expect(config.theme?.extend).toMatchObject({
      colors: {
        primary: '#2563EB',
        secondary: '#0F172A',
        accent: '#10B981',
      },
    });
  });

  it('has no tailwind plugins configured', () => {
    expect(config.plugins).toEqual([]);
  });
});
