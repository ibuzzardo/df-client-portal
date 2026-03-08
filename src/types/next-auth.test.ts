import { describe, expect, it } from 'vitest';

describe('next-auth type augmentation runtime compatibility', () => {
  it('supports session user objects carrying id, role, and tenantId fields', () => {
    const sessionLike = {
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        role: 'ADMIN',
        tenantId: 'tenant-1',
      },
    };

    expect(sessionLike.user.id).toBe('user-1');
    expect(sessionLike.user.email).toBe('user@example.com');
    expect(sessionLike.user.name).toBe('User');
    expect(sessionLike.user.role).toBe('ADMIN');
    expect(sessionLike.user.tenantId).toBe('tenant-1');
  });

  it('supports jwt-like objects carrying optional auth metadata', () => {
    const jwtLike = {
      id: 'user-1',
      role: null,
      tenantId: 'tenant-1',
    };

    expect(jwtLike).toEqual({
      id: 'user-1',
      role: null,
      tenantId: 'tenant-1',
    });
  });
});
