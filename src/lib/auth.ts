import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[reset-email] request for ${user.email}`);
      void sendEmail({
        to: user.email,
        subject: 'Reset your password',
        text: `Click the link to reset your password: ${url}`,
        html: `<p>Click the link below to reset your password:</p><p><a href="${url}">Reset password</a></p>`
      }).catch((err) => {
        console.error('[reset-email] send failed:', err);
      });
    }
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
