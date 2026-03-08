import { describe, expect, it } from 'vitest';

import { createProjectSchema, updateStatusSchema } from '@/lib/validators/project';

describe('project validators', () => {
  it('accepts a valid project payload', () => {
    const result = createProjectSchema.safeParse({
      name: 'Website redesign',
      brief: 'This is a sufficiently detailed brief for the new website redesign.',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty project name', () => {
    const result = createProjectSchema.safeParse({
      name: '',
      brief: 'This is a sufficiently detailed brief for the new website redesign.',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Project name is required');
    }
  });

  it('rejects a brief shorter than 20 characters', () => {
    const result = createProjectSchema.safeParse({
      name: 'Website redesign',
      brief: 'Too short brief',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Brief must be at least 20 characters');
    }
  });

  it('accepts a valid status update', () => {
    const result = updateStatusSchema.safeParse({ status: 'APPROVED' });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid status update', () => {
    const result = updateStatusSchema.safeParse({ status: 'SUBMITTED' });

    expect(result.success).toBe(false);
  });
});
