import { PrismaClient } from '@prisma/client';

const auth_id: string = '8ff287f8-f26f-49e7-b0ba-c13df26fef5f';
const prisma = new PrismaClient();

async function main() {
  await prisma.users.create({
    data: {
      auth_id,
      email: 'super@admin.com',
      admin: true,
      super_admin: true,
    },
  });
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
