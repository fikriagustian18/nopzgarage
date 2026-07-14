
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const sections = await prisma.contentSection.findMany();
    console.log("Found sections:", sections.length);
    for (const section of sections) {
      console.log(`Key: ${section.sectionKey}`);
      console.log(`Content Sample:`, JSON.stringify(section.content).slice(0, 200));
      console.log('---');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
