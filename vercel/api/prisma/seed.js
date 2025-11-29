import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const departments = [
  { name: 'Mathematics' },
  { name: 'Physics' },
  { name: 'Chemistry' },
  { name: 'Microbiology' },
  { name: 'History' },
  { name: 'English' },
  { name: 'ASM' },
  { name: 'BBA' },
  { name: 'BCOM' },
  { name: 'Computer Science' },
  { name: 'Economics' },
];

const officers = [
  { id: 'officer', name: 'Program Officer', password: 'officer123' },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - uncomment if you want to reset)
  // console.log('Clearing existing data...');
  // await prisma.programParticipant.deleteMany();
  // await prisma.programCoordinator.deleteMany();
  // await prisma.studentActivity.deleteMany();
  // await prisma.program.deleteMany();
  // await prisma.student.deleteMany();
  // await prisma.coordinator.deleteMany();
  // await prisma.department.deleteMany();
  // await prisma.officer.deleteMany();
  // await prisma.homepageImage.deleteMany();

  // Seed departments
  console.log('📚 Seeding departments...');
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: {
        name: dept.name,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${departments.length} departments`);

  // Seed officers
  console.log('👮 Seeding officers...');
  for (const officer of officers) {
    await prisma.officer.upsert({
      where: { id: officer.id },
      update: { name: officer.name, password: officer.password },
      create: officer,
    });
  }
  console.log(`✅ Created ${officers.length} officers`);

  // Get created departments for reference
  const createdDepts = await prisma.department.findMany();
  console.log('');
  console.log('📋 Available departments:');
  createdDepts.forEach(d => console.log(`   - ${d.name} (${d.id})`));

  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('Default credentials:');
  console.log('  Officer: id="officer", password="officer123"');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
