import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthSessionMock = vi.fn();
const projectFindUniqueMock = vi.fn();
const projectUpdateMock = vi.fn();
const projectEventCreateMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    project: {
      findUnique: projectFindUniqueMock,
      update: projectUpdateMock,
    },
    projectEvent: {
      create: projectEventCreateMock,
    },
  },
}));

describe('/api/projects/[id]/trigger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns 401 when unauthenticated', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/api/projects/[id]/trigger/route');

    const response = await mod.POST(new Request('http://localhost', { method: 'POST' }), {
      params: Promise.resolve({ id: 'project-1' }),
    });

    expect(response.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'CLIENT' } });
    const mod = await import('@/app/api/projects/[id]/trigger/route');

    const response = await mod.POST(new Request('http://localhost', { method: 'POST' }), {
      params: Promise.resolve({ id: 'project-1' }),
    });

    expect(response.status).toBe(403);
  });

  it('returns 404 when project does not exist', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    projectFindUniqueMock.mockResolvedValue(null);
    const mod = await import('@/app/api/projects/[id]/trigger/route');

    const response = await mod.POST(new Request('http://localhost', { method: 'POST' }), {
      params: Promise.resolve({ id: 'project-1' }),
    });

    expect(response.status).toBe(404);
  });

  it('returns 409 when project is not approved', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    projectFindUniqueMock.mockResolvedValue({ id: 'project-1', status: 'SUBMITTED' });
    const mod = await import('@/app/api/projects/[id]/trigger/route');

    const response = await mod.POST(new Request('http://localhost', { method: 'POST' }), {
      params: Promise.resolve({ id: 'project-1' }),
    });

    expect(response.status).toBe(409);
  });

  it('triggers pipeline successfully', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    projectFindUniqueMock.mockResolvedValue({
      id: 'project-1',
      name: 'Project One',
      brief: 'This is a sufficiently long project brief for testing.',
      status: 'APPROVED',
    });
    projectUpdateMock
      .mockResolvedValueOnce({ id: 'project-1', status: 'BUILDING' })
      .mockResolvedValueOnce({ id: 'project-1', status: 'BUILDING', pipelineJobId: 'job-123' });
    projectEventCreateMock.mockResolvedValue({ id: 'event-1' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ jobId: 'job-123' }),
      }),
    );
    const mod = await import('@/app/api/projects/[id]/trigger/route');

    const response = await mod.POST(new Request('http://localhost', { method: 'POST' }), {
      params: Promise.resolve({ id: 'project-1' }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.jobId).toBe('job-123');
    expect(projectEventCreateMock).toHaveBeenCalled();
  });
});
