import { type NextRequest, NextResponse } from 'next/server';

import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { createErrorResponse, normalizeError } from '@/lib/errors';
import { createProjectSchema } from '@/lib/validators/project';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getAuthSession();

    if (!session) {
      return createErrorResponse('Unauthorized', 401);
    }

    const isAdmin = session.user.role === 'ADMIN';
    const projects = await db.project.findMany({
      where: isAdmin ? undefined : { tenantId: session.user.tenantId ?? '' },
      include: {
        tenant: true,
        submittedBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ projects });
  } catch (error: unknown) {
    return createErrorResponse(normalizeError(error), 500);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getAuthSession();

    if (!session) {
      return createErrorResponse('Unauthorized', 401);
    }

    if (session.user.role !== 'CLIENT') {
      return createErrorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return createErrorResponse(
        'Invalid request body',
        400,
        parsed.error.issues.map((issue) => issue.message),
      );
    }

    const project = await db.project.create({
      data: {
        name: parsed.data.name,
        brief: parsed.data.brief,
        tenantId: session.user.tenantId ?? '',
        status: 'SUBMITTED',
        submittedById: session.user.id,
      },
    });

    await db.projectEvent.create({
      data: {
        projectId: project.id,
        type: 'STATUS_CHANGE',
        message: 'Project submitted',
        userId: session.user.id,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: unknown) {
    return createErrorResponse(normalizeError(error), 500);
  }
}
