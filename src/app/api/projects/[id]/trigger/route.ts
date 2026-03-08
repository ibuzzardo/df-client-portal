import { NextRequest, NextResponse } from 'next/server';

import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { createErrorResponse } from '@/lib/errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface PipelineResponse {
  jobId?: string;
  id?: string;
}

export async function POST(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return createErrorResponse('Unauthorized', 401);
    }

    if (session.user.role !== 'ADMIN') {
      return createErrorResponse('Forbidden', 403);
    }

    const { id } = await context.params;

    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return createErrorResponse('Project not found', 404);
    }

    if (project.status !== 'APPROVED') {
      return createErrorResponse('Only approved projects can trigger a build', 409);
    }

    await db.project.update({
      where: { id },
      data: { status: 'BUILDING' },
    });

    try {
      const response = await fetch(process.env.PIPELINE_API_URL ?? 'http://localhost:3000/api/pipeline/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: project.name,
          issueTitle: project.name,
          issueBody: project.brief,
          triggerBuild: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Pipeline API request failed');
      }

      const data = (await response.json()) as PipelineResponse;
      const jobId = data.jobId ?? data.id;

      if (!jobId) {
        throw new Error('Pipeline API did not return a job ID');
      }

      const updatedProject = await db.project.update({
        where: { id },
        data: {
          pipelineJobId: jobId,
        },
      });

      await db.projectEvent.create({
        data: {
          projectId: id,
          type: 'PIPELINE_TRIGGERED',
          message: 'Build triggered',
        },
      });

      return NextResponse.json({ project: updatedProject, jobId });
    } catch {
      await db.project.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      return createErrorResponse('Pipeline API is unreachable. Project status was reverted to APPROVED.', 502);
    }
  } catch {
    return createErrorResponse('Failed to trigger pipeline', 500);
  }
}
