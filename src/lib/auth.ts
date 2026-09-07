import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import prisma from '@/lib/prisma';

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          let role = 'student';

          if ((await prisma.user.count()) === 0) {
            role = 'admin';
          }

          return { data: { ...user, role } };
        }
      }
    }
  },
  plugins: [admin(), nextCookies()]
});
