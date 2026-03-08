import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('./package.json');

describe('package.json', () => {
  it('defines expected metadata', () => {
    expect(pkg.name).toBe('df-client-portal');
    expect(pkg.version).toBe('0.1.0');
    expect(pkg.private).toBe(true);
  });

  it('defines core scripts', () => {
    expect(pkg.scripts).toMatchObject({
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      test: 'vitest run',
      'prisma:generate': 'prisma generate',
      'prisma:seed': 'tsx prisma/seed.ts',
    });
  });

  it('includes key runtime dependencies', () => {
    expect(pkg.dependencies).toMatchObject({
      next: expect.any(String),
      react: expect.any(String),
      'react-dom': expect.any(String),
      'next-auth': expect.any(String),
      '@prisma/client': expect.any(String),
      bcryptjs: expect.any(String),
      zod: expect.any(String),
    });
  });

  it('includes key development dependencies for vitest and testing-library', () => {
    expect(pkg.devDependencies).toMatchObject({
      vitest: expect.any(String),
      jsdom: expect.any(String),
      '@testing-library/jest-dom': expect.any(String),
      '@testing-library/react': expect.any(String),
      typescript: expect.any(String),
    });
  });
});
