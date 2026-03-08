import { type NextRequest, NextResponse } from 'next/server';

import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { createErrorResponse, normalizeError } from '@/lib/errors';
import { updateStatusSchema } from '@/lib/validators/project';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getAuthSession();

    if (!session) {
      return createErrorResponse('Unauthorized', 401);
    }

    if (session.user.role !== 'ADMIN') {
      return createErrorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return createErrorResponse(
        'Invalid request body',
        400,
        parsed.error.issues.map((issue) => issue.message),
      );
    }

    const { id } = await context.params;
    const existingProject = await db.project.findUnique({ where: { id } });

    if (!existingProject) {
      return createErrorResponse('Project not found', 404);
    }

    const project = await db.project.update({
      where: { id },
      data: {
        status: parsed.data.status,
        approvedById: session.user.id,
      },
    });

    await db.projectEvent.create({
      data: {
        projectId: id,
        type: 'STATUS_CHANGE',
        message: `Status changed to ${parsed.data.status}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ project });
  } catch (error: unknown) {
    return createErrorResponse(normalizeError(error), 500);
  }
}
