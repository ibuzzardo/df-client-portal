import { describe, expect, it, vi, beforeEach } from 'vitest';

const getAuthSessionMock = vi.fn();
const findManyMock = vi.fn();
const createProjectMock = vi.fn();
const createProjectEventMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    project: {
      findMany: findManyMock,
      create: createProjectMock,
    },
    projectEvent: {
      create: createProjectEventMock,
    },
  },
}));

describe('/api/projects route', () => {
  beforeEach(() => {
    getAuthSessionMock.mockReset();
    findManyMock.mockReset();
    createProjectMock.mockReset();
    createProjectEventMock.mockReset();
  });

  it('returns 401 for unauthenticated GET requests', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/api/projects/route');

    const response = await mod.GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: { message: 'Unauthorized' } });
  });

  it('returns all projects for admin GET requests', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN', tenantId: null },
    });
    findManyMock.mockResolvedValue([{ id: 'project-1' }]);
    const mod = await import('@/app/api/projects/route');

    const response = await mod.GET();
    const body = await response.json();

    expect(findManyMock).toHaveBeenCalledWith({
      where: undefined,
      include: { tenant: true, submittedBy: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(response.status).toBe(200);
    expect(body).toEqual({ projects: [{ id: 'project-1' }] });
  });

  it('returns tenant-scoped projects for client GET requests', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '2', email: 'client@test.com', role: 'CLIENT', tenantId: 'tenant-1' },
    });
    findManyMock.mockResolvedValue([{ id: 'project-2' }]);
    const mod = await import('@/app/api/projects/route');

    await mod.GET();

    expect(findManyMock).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      include: { tenant: true, submittedBy: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns 401 for unauthenticated POST requests', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/api/projects/route');

    const response = await mod.POST(
      new Request('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Project', brief: 'This brief is definitely long enough.' }),
      }) as never,
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 when a non-client attempts to create a project', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN', tenantId: null },
    });
    const mod = await import('@/app/api/projects/route');

    const response = await mod.POST(
      new Request('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Project', brief: 'This brief is definitely long enough.' }),
      }) as never,
    );

    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid POST payloads', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '2', email: 'client@test.com', role: 'CLIENT', tenantId: 'tenant-1' },
    });
    const mod = await import('@/app/api/projects/route');

    const response = await mod.POST(
      new Request('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: '', brief: 'short' }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe('Invalid request body');
    expect(body.error.details).toContain('Project name is required');
  });

  it('creates a project and event for valid client POST requests', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '2', email: 'client@test.com', role: 'CLIENT', tenantId: 'tenant-1' },
    });
    createProjectMock.mockResolvedValue({ id: 'project-3', name: 'Project' });
    createProjectEventMock.mockResolvedValue({ id: 'event-1' });
    const mod = await import('@/app/api/projects/route');

    const response = await mod.POST(
      new Request('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Project',
          brief: 'This brief is definitely long enough for validation.',
        }),
      }) as never,
    );
    const body = await response.json();

    expect(createProjectMock).toHaveBeenCalledWith({
      data: {
        name: 'Project',
        brief: 'This brief is definitely long enough for validation.',
        tenantId: 'tenant-1',
        status: 'SUBMITTED',
        submittedById: '2',
      },
    });
    expect(createProjectEventMock).toHaveBeenCalledWith({
      data: {
        projectId: 'project-3',
        type: 'STATUS_CHANGE',
        message: 'Project submitted',
        userId: '2',
      },
    });
    expect(response.status).toBe(201);
    expect(body).toEqual({ project: { id: 'project-3', name: 'Project' } });
  });
});
