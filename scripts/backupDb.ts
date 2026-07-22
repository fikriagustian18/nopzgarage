import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database backup...');

  // 1. Fetch all user tables from the public schema (excluding migration metadata tables)
  const tables: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_prisma_migrations';
  `);

  console.log(`Found ${tables.length} tables to back up.`);
  const backupData: Record<string, any[]> = {};

  for (const row of tables) {
    const tableName = row.table_name;
    console.log(`- Backing up table: ${tableName}...`);
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
      
      // Convert BigInt and custom object types for clean JSON serialization
      backupData[tableName] = JSON.parse(
        JSON.stringify(rows, (key, value) => {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        })
      );
      console.log(`  └ Saved ${rows.length} rows.`);
    } catch (err) {
      console.error(`  ❌ Failed to back up table ${tableName}:`, err);
    }
  }

  // Define backups directory
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Create timestamped backup file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

  console.log(`\n🎉 Backup completed successfully! Saved to: ${backupPath}`);
}

main()
  .catch((e) => {
    console.error('❌ Error occurred during backup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
