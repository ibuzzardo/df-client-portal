import { InvoiceStatus, ProjectStatus } from '@prisma/client';

import { db } from '@/lib/db';

export type DashboardSummary = {
  totalClients: number;
  activeProjects: number;
  outstandingInvoices: number;
  overdueInvoices: number;
};

export type DashboardRecord = {
  id: string;
  clientName: string;
  projectName: string;
  projectStatus: ProjectStatus;
  invoiceNumber: string | null;
  invoiceStatus: InvoiceStatus | null;
};

export type DashboardData = {
  summary: DashboardSummary;
  records: DashboardRecord[];
};

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const [totalClients, activeProjects, outstandingInvoices, overdueInvoices, projects] = await Promise.all([
      db.client.count(),
      db.project.count({
        where: {
          status: ProjectStatus.ACTIVE,
        },
      }),
      db.invoice.count({
        where: {
          status: {
            in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
          },
        },
      }),
      db.invoice.count({
        where: {
          status: InvoiceStatus.OVERDUE,
        },
      }),
      db.project.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          client: true,
        },
      }),
    ]);

    const invoices = await db.invoice.findMany({
      where: {
        clientId: {
          in: projects.map((project) => project.clientId),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const records: DashboardRecord[] = projects.map((project) => {
      const invoice = invoices.find((item) => item.clientId === project.clientId) ?? null;

      return {
        id: project.id,
        clientName: project.client.name,
        projectName: project.name,
        projectStatus: project.status,
        invoiceNumber: invoice?.invoiceNo ?? null,
        invoiceStatus: invoice?.status ?? null,
      };
    });

    return {
      summary: {
        totalClients,
        activeProjects,
        outstandingInvoices,
        overdueInvoices,
      },
      records,
    };
  } catch {
    return {
      summary: {
        totalClients: 0,
        activeProjects: 0,
        outstandingInvoices: 0,
        overdueInvoices: 0,
      },
      records: [],
    };
  }
}
