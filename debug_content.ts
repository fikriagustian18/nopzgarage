import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("=== Starting Role Migration (Helper -> Mekanik) ===");
    
    // Update role of Employee records
    const updatedEmployees = await prisma.employee.updateMany({
      where: {
        role: {
          mode: 'insensitive',
          in: ['helper', 'Helper', 'HELPER']
        }
      },
      data: {
        role: 'Mekanik'
      }
    });
    console.log(`✅ Updated ${updatedEmployees.count} records in Employee table.`);

    // Update role of USERS records (ERD Table)
    const updatedUSERS = await prisma.uSERS.updateMany({
      where: {
        role: {
          mode: 'insensitive',
          in: ['helper', 'Helper', 'HELPER']
        }
      },
      data: {
        role: 'Mekanik'
      }
    });
    console.log(`✅ Updated ${updatedUSERS.count} records in USERS (ERD) table.`);

  } catch (e) {
    console.error("❌ Migration error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

