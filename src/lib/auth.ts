import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validators/auth';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<{ id: string; email: string | null; name: string | null } | null> {
        try {
          const parsed = loginSchema.safeParse(credentials);

          if (!parsed.success) {
            return null;
          }

          const user = await db.user.findUnique({
            where: { email: parsed.data.email },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isValid = await compare(parsed.data.password, user.passwordHash);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.email = user.email;

          const membership = await db.membership.findFirst({
            where: { userId: user.id },
            include: { tenant: true },
          });

          token.role = membership?.role ?? null;
          token.tenantId = membership?.tenantId ?? null;
        }

        return token;
      } catch {
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.tenantId = token.tenantId as string;
        }

        return session;
      } catch {
        return session;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getAuthSession(): Promise<Awaited<ReturnType<typeof getServerSession>> | null> {
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}
