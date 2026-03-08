import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1, 'limit must be at least 1').max(20, 'limit must be 20 or less').optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
