import { MemberRole, PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  try {
    const saltRounds = 12;

    const adminPasswordHash = await hash('admin123', saltRounds);
    const clientPasswordHash = await hash('client123', saltRounds);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@darkfabrik.io' },
      update: {
        name: 'Admin User',
        passwordHash: adminPasswordHash,
      },
      create: {
        email: 'admin@darkfabrik.io',
        name: 'Admin User',
        passwordHash: adminPasswordHash,
      },
    });

    const clientUser = await prisma.user.upsert({
      where: { email: 'client@example.com' },
      update: {
        name: 'Client User',
        passwordHash: clientPasswordHash,
      },
      create: {
        email: 'client@example.com',
        name: 'Client User',
        passwordHash: clientPasswordHash,
      },
    });

    const adminTenant = await prisma.tenant.upsert({
      where: { slug: 'dark-fabrik' },
      update: {
        name: 'Dark Fabrik',
      },
      create: {
        name: 'Dark Fabrik',
        slug: 'dark-fabrik',
      },
    });

    const clientTenant = await prisma.tenant.upsert({
      where: { slug: 'acme-corp' },
      update: {
        name: 'Acme Corp',
      },
      create: {
        name: 'Acme Corp',
        slug: 'acme-corp',
      },
    });

    await prisma.membership.upsert({
      where: {
        userId_tenantId: {
          userId: adminUser.id,
          tenantId: adminTenant.id,
        },
      },
      update: {
        role: MemberRole.ADMIN,
      },
      create: {
        userId: adminUser.id,
        tenantId: adminTenant.id,
        role: MemberRole.ADMIN,
      },
    });

    await prisma.membership.upsert({
      where: {
        userId_tenantId: {
          userId: clientUser.id,
          tenantId: clientTenant.id,
        },
      },
      update: {
        role: MemberRole.CLIENT,
      },
      create: {
        userId: clientUser.id,
        tenantId: clientTenant.id,
        role: MemberRole.CLIENT,
      },
    });
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  try {
    console.error('Unhandled seed error:', error);
  } catch {
    // console unavailable
  }
  process.exitCode = 1;
});
