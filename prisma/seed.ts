import { PrismaClient, InvoiceStatus, ProjectStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  try {
    const passwordHash = await hash('password123', 10);

    const user = await prisma.user.upsert({
      where: { email: 'admin@darkfabrik.com' },
      update: {
        name: 'Admin User',
        passwordHash,
      },
      create: {
        email: 'admin@darkfabrik.com',
        name: 'Admin User',
        passwordHash,
      },
    });

    const clientA = await prisma.client.upsert({
      where: { email: 'hello@acme.co' },
      update: {
        name: 'Acme Team',
        companyName: 'Acme Co',
      },
      create: {
        name: 'Acme Team',
        email: 'hello@acme.co',
        companyName: 'Acme Co',
      },
    });

    const clientB = await prisma.client.upsert({
      where: { email: 'ops@northstar.io' },
      update: {
        name: 'Northstar Ops',
        companyName: 'Northstar IO',
      },
      create: {
        name: 'Northstar Ops',
        email: 'ops@northstar.io',
        companyName: 'Northstar IO',
      },
    });

    await prisma.project.createMany({
      data: [
        {
          name: 'Portal Redesign',
          description: 'Responsive dashboard redesign and UX improvements.',
          status: ProjectStatus.ACTIVE,
          budgetCents: 250000,
          clientId: clientA.id,
        },
        {
          name: 'Analytics Integration',
          description: 'Integrate reporting and KPI dashboards.',
          status: ProjectStatus.PLANNING,
          budgetCents: 180000,
          clientId: clientA.id,
        },
        {
          name: 'Operations Automation',
          description: 'Automate internal workflows and approvals.',
          status: ProjectStatus.ON_HOLD,
          budgetCents: 320000,
          clientId: clientB.id,
        },
      ],
      skipDuplicates: true,
    });

    await prisma.invoice.createMany({
      data: [
        {
          invoiceNo: 'INV-1001',
          amountCents: 45000,
          status: InvoiceStatus.PAID,
          dueDate: new Date('2025-01-15T00:00:00.000Z'),
          paidAt: new Date('2025-01-10T00:00:00.000Z'),
          clientId: clientA.id,
        },
        {
          invoiceNo: 'INV-1002',
          amountCents: 78000,
          status: InvoiceStatus.SENT,
          dueDate: new Date('2025-02-15T00:00:00.000Z'),
          clientId: clientA.id,
        },
        {
          invoiceNo: 'INV-1003',
          amountCents: 120000,
          status: InvoiceStatus.OVERDUE,
          dueDate: new Date('2025-01-05T00:00:00.000Z'),
          clientId: clientB.id,
        },
      ],
      skipDuplicates: true,
    });

    console.log(`Seeded user ${user.email}`);
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Unhandled seed error:', error);
  process.exit(1);
});
