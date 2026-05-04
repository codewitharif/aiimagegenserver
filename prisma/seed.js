import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const userData = [
    {
      name: 'Admin User',
      email: 'admin@imagegen.com',
      password: 'password123',
      role: 'admin',
      status: 'active',
    },
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'user',
      status: 'active',
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'user',
      status: 'inactive',
    },
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      role: 'user',
      status: 'ban',
    },
  ];

  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    console.log(`Created user with id: ${user.id}`);
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
