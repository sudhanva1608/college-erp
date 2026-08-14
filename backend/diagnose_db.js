// Simple DB connectivity check
require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@') : 'NOT SET');
    await prisma.$connect();
    console.log('✅ DB connected successfully');

    // Try to count users
    const count = await prisma.user.count();
    console.log('✅ User count:', count);

    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ DB Error:', err.message);
    console.error('   Code:', err.code);
    console.error('   Meta:', JSON.stringify(err.meta));
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

run();
