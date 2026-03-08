import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthSessionMock = vi.fn();
const findUniqueMock = vi.fn();
const updateMock = vi.fn();
const createProjectEventMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('@/lib/db', () => ({
  db: {
    project: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
    projectEvent: {
      create: createProjectEventMock,
    },
  },
}));

describe('/api/projects/[id]/status route', () => {
  beforeEach(() => {
    getAuthSessionMock.mockReset();
    findUniqueMock.mockReset();
    updateMock.mockReset();
    createProjectEventMock.mockReset();
  });

  it('returns 401 for unauthenticated requests', async () => {
    getAuthSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/api/projects/[id]/status/route');

    const response = await mod.PATCH(
      new Request('http://localhost/api/projects/project-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }) as never,
      { params: Promise.resolve({ id: 'project-1' }) },
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 for non-admin requests', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '2', email: 'client@test.com', role: 'CLIENT', tenantId: 'tenant-1' },
    });
    const mod = await import('@/app/api/projects/[id]/status/route');

    const response = await mod.PATCH(
      new Request('http://localhost/api/projects/project-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }) as never,
      { params: Promise.resolve({ id: 'project-1' }) },
    );

    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid payloads', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN', tenantId: null },
    });
    const mod = await import('@/app/api/projects/[id]/status/route');

    const response = await mod.PATCH(
      new Request('http://localhost/api/projects/project-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'SUBMITTED' }),
      }) as never,
      { params: Promise.resolve({ id: 'project-1' }) },
    );

    expect(response.status).toBe(400);
  });

  it('returns 404 when the project does not exist', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN', tenantId: null },
    });
    findUniqueMock.mockResolvedValue(null);
    const mod = await import('@/app/api/projects/[id]/status/route');

    const response = await mod.PATCH(
      new Request('http://localhost/api/projects/project-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }) as never,
      { params: Promise.resolve({ id: 'project-1' }) },
    );

    expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: 'project-1' } });
    expect(response.status).toBe(404);
  });

  it('updates the project status and creates an event', async () => {
    getAuthSessionMock.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN', tenantId: null },
    });
    findUniqueMock.mockResolvedValue({ id: 'project-1' });
    updateMock.mockResolvedValue({ id: 'project-1', status: 'APPROVED' });
    createProjectEventMock.mockResolvedValue({ id: 'event-1' });
    const mod = await import('@/app/api/projects/[id]/status/route');

    const response = await mod.PATCH(
      new Request('http://localhost/api/projects/project-1/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }) as never,
      { params: Promise.resolve({ id: 'project-1' }) },
    );
    const body = await response.json();

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: {
        status: 'APPROVED',
        approvedById: '1',
      },
    });
    expect(createProjectEventMock).toHaveBeenCalledWith({
      data: {
        projectId: 'project-1',
        type: 'STATUS_CHANGE',
        message: 'Status changed to APPROVED',
        userId: '1',
      },
    });
    expect(response.status).toBe(200);
    expect(body).toEqual({ project: { id: 'project-1', status: 'APPROVED' } });
  });
});
