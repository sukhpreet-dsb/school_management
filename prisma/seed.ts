import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { auth } from '../src/lib/auth';

const DEMO_PASSWORD = 'Password123!';

const demoUsers = [
  { name: 'School Admin', email: 'admin@school.edu', role: 'admin' },
  { name: 'Teacher One', email: 'teacher@school.edu', role: 'teacher' },
  { name: 'Student One', email: 'student@school.edu', role: 'student' }
];

async function main() {
  for (const user of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });

    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { role: user.role } });
      console.log(`· exists, role ensured (${user.role}): ${user.email}`);
      continue;
    }

    await auth.api.signUpEmail({
      body: {
        name: user.name,
        email: user.email,
        password: DEMO_PASSWORD,
        callbackURL: '/dashboard'
      },
      headers: new Headers({ origin: 'http://localhost:3000' })
    });

    const created = await prisma.user.findUnique({ where: { email: user.email } });

    if (!created) {
      throw new Error(`Failed to create user: ${user.email}`);
    }

    await prisma.user.update({ where: { id: created.id }, data: { role: user.role } });
    console.log(`· created (${user.role}): ${user.email} / ${DEMO_PASSWORD}`);
  }
}

main()
  .then(() => console.log('Seed complete.'))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());