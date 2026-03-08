import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  brief: z.string().min(20, 'Brief must be at least 20 characters').max(5000),
});

export const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'BUILDING', 'DELIVERED']),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
