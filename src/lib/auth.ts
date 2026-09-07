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
  plugins: [admin(), nextCookies()]
});
