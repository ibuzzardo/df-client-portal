import { describe, expect, it } from 'vitest';

import { addMemberSchema, createTenantSchema } from '@/lib/validators/tenant';

describe('tenant validators', () => {
  it('accepts valid tenant input', () => {
    const result = createTenantSchema.safeParse({
      name: 'Acme Corp',
      slug: 'acme-corp',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid tenant slug', () => {
    const result = createTenantSchema.safeParse({
      name: 'Acme Corp',
      slug: 'Acme Corp',
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid member payload', () => {
    const result = addMemberSchema.safeParse({
      email: 'user@example.com',
      role: 'ADMIN',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid member email', () => {
    const result = addMemberSchema.safeParse({
      email: 'invalid-email',
      role: 'CLIENT',
    });

    expect(result.success).toBe(false);
  });
});
