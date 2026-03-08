import { NextRequest, NextResponse } from 'next/server';

import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { createErrorResponse } from '@/lib/errors';
import { createTenantSchema } from '@/lib/validators/tenant';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return createErrorResponse('Unauthorized', 401);
    }

    if (session.user.role !== 'ADMIN') {
      return createErrorResponse('Forbidden', 403);
    }

    const tenants = await db.tenant.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ tenants });
  } catch {
    return createErrorResponse('Failed to fetch tenants', 500);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return createErrorResponse('Unauthorized', 401);
    }

    if (session.user.role !== 'ADMIN') {
      return createErrorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const parsed = createTenantSchema.safeParse(body);

    if (!parsed.success) {
      return createErrorResponse(
        'Invalid request body',
        400,
        parsed.error.issues.map((issue) => issue.message),
      );
    }

    const tenant = await db.tenant.create({
      data: parsed.data,
    });

    return NextResponse.json({ tenant }, { status: 201 });
  } catch {
    return createErrorResponse('Failed to create tenant', 500);
  }
}
