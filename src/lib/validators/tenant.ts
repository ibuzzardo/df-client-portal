import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').max(200),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

export const addMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['ADMIN', 'CLIENT']).default('CLIENT'),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
