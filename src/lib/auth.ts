import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { ensureStudentProfile, ensureTeacherProfile } from '@/lib/profiles';

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
          if (user.role && user.role !== 'user') {
            return undefined;
          }

          const role = (await prisma.user.count()) === 0 ? 'admin' : 'student';

          return { data: { ...user, role } };
        },
        after: async (user) => {
          const role = Array.isArray(user.role) ? user.role[0] : user.role;

          try {
            if (role === 'teacher') {
              await ensureTeacherProfile({ userId: user.id });
            } else if (role === 'student') {
              await ensureStudentProfile({ userId: user.id });
            }
          } catch (err) {
            console.error(`[profile] failed to create ${role} profile for ${user.email}:`, err);
          }
        }
      }
    }
  },
  plugins: [admin(), nextCookies()]
});
