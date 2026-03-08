import { NextRequest, NextResponse } from 'next/server';

import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { createErrorResponse } from '@/lib/errors';
import { addMemberSchema } from '@/lib/validators/tenant';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return createErrorResponse('Unauthorized', 401);
    }

    if (session.user.role !== 'ADMIN') {
      return createErrorResponse('Forbidden', 403);
    }

    const { id } = await context.params;

    const memberships = await db.membership.findMany({
      where: { tenantId: id },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ memberships });
  } catch {
    return createErrorResponse('Failed to fetch tenant members', 500);
  }
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return createErrorResponse('Unauthorized', 401);
    }

    if (session.user.role !== 'ADMIN') {
      return createErrorResponse('Forbidden', 403);
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = addMemberSchema.safeParse(body);

    if (!parsed.success) {
      return createErrorResponse(
        'Invalid request body',
        400,
        parsed.error.issues.map((issue) => issue.message),
      );
    }

    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (!user) {
      const invitation = await db.invitation.create({
        data: {
          email: parsed.data.email,
          tenantId: id,
          role: parsed.data.role,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
      });

      return NextResponse.json({ invited: true, invitation }, { status: 201 });
    }

    const membership = await db.membership.create({
      data: {
        tenantId: id,
        userId: user.id,
        role: parsed.data.role,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ invited: false, membership }, { status: 201 });
  } catch {
    return createErrorResponse('Failed to add tenant member', 500);
  }
}
