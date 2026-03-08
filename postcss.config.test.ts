import { describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('./postcss.config.js');

describe('postcss.config', () => {
  it('configures tailwindcss and autoprefixer plugins', () => {
    expect(config).toEqual({
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    });
  });
});
