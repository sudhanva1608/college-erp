import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const checks = [
    { id: 'CS21B042', password: 'student123', role: 'student' },
    { id: 'FAC2018',  password: 'teacher123', role: 'teacher' },
    { id: 'DEAN123',  password: 'dean123',    role: 'dean'    },
  ];

  for (const c of checks) {
    const user = await prisma.user.findUnique({ where: { id: c.id } });
    if (!user) {
      console.log(`❌ ${c.id} — NOT FOUND in database`);
      continue;
    }
    const match = await bcrypt.compare(c.password, user.password);
    console.log(`${match ? '✅' : '❌'} ${c.id} (${user.role}) — password match: ${match}`);
    if (!match) {
      console.log(`   Stored hash: ${user.password}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
