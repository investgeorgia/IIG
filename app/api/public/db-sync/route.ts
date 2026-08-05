import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const salespersons = [
  { name: 'Ivane Kurasbediani',           slug: 'ivane',    phone: '971542574715', email: 'ivane@investingeorgia.ae' },
  { name: 'Liza',                          slug: 'liza',     phone: '971542574717', email: 'liza@investingeorgia.ae' },
  { name: 'Lika Tsamalashvili',            slug: 'lika',     phone: '971542574719', email: 'lika@investingeorgia.ae' },
  { name: 'Tamer Raouf Fouad Abdelkader', slug: 'tamer',    phone: '971542574721', email: 'tamer@investingeorgia.ae' },
  { name: 'Bijesh Vijayan',               slug: 'bijesh',   phone: '971542574714', email: 'bijesh@investingeorgia.ae' },
  { name: 'Achraf',                        slug: 'achraf',   phone: '971542574720', email: 'achraf@investingeorgia.ae' },
  { name: 'Hajar',                         slug: 'hajar',    phone: '971564156060', email: 'hajar@investingeorgia.ae' },
  { name: 'Oyunsaikhan',                   slug: 'oyun',     phone: '971564156161', email: 'oyun@investingeorgia.ae' },
  { name: 'Mohamed Adel Mohamed Ali Gad', slug: 'adel',     phone: '971564160505', email: 'adel@investingeorgia.ae' },
  { name: 'Sana',                          slug: 'sana',     phone: '971564165151', email: 'sana@investingeorgia.ae' },
  { name: 'Admin',                         slug: 'admin-sp', phone: '971542570122', email: 'admin@investingeorgia.ae' },
  { name: 'Analyn Johnson',               slug: 'showroom', phone: '971542574716', email: 'showroom@investingeorgia.ae' },
  { name: 'Anton',                         slug: 'anton',    phone: '971542574718', email: 'admin02@investingeorgia.ae' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (token !== 'sync1234') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const logs: string[] = []
  const errors: string[] = []

  // ── 1. Create Salesperson table if it doesn't exist ──
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`Salesperson\` (
        \`id\`           int           NOT NULL AUTO_INCREMENT,
        \`name\`         varchar(191)  NOT NULL,
        \`slug\`         varchar(191)  NOT NULL,
        \`phone\`        varchar(191)  NOT NULL,
        \`email\`        varchar(191)  NOT NULL,
        \`profileImage\` varchar(191)  DEFAULT NULL,
        \`active\`       tinyint(1)    NOT NULL DEFAULT 1,
        \`createdAt\`    datetime(3)   NOT NULL DEFAULT current_timestamp(3),
        \`updatedAt\`    datetime(3)   NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`Salesperson_slug_key\` (\`slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    logs.push('✓ Salesperson table created (or already exists)')
  } catch (e: any) {
    errors.push('Salesperson table: ' + e.message)
  }

  // ── 2. Add new columns to Customer and PaymentPlan tables if missing ──
  const alterColumns = [
    { table: 'Customer', col: 'salesperson_id',   sql: 'ADD COLUMN IF NOT EXISTS `salesperson_id`   int          DEFAULT NULL' },
    { table: 'Customer', col: 'salesperson_name', sql: 'ADD COLUMN IF NOT EXISTS `salesperson_name` varchar(191) DEFAULT NULL' },
    { table: 'Customer', col: 'salesperson_slug', sql: 'ADD COLUMN IF NOT EXISTS `salesperson_slug` varchar(191) DEFAULT NULL' },
    { table: 'PaymentPlan', col: 'unitId', sql: 'ADD COLUMN IF NOT EXISTS `unitId` int DEFAULT NULL' },
  ]

  for (const { table, col, sql } of alterColumns) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ${sql};`)
      logs.push(`✓ ${table}.${col} column ensured`)
    } catch (e: any) {
      // Ignore "duplicate column" errors — means it already exists
      if (e.message?.includes('Duplicate column')) {
        logs.push(`• Customer.${col} already exists`)
      } else {
        errors.push(`Customer.${col}: ` + e.message)
      }
    }
  }

  // ── 3. Add index on Customer.salesperson_id if missing ──
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`Customer\` ADD INDEX \`Customer_salesperson_id_idx\` (\`salesperson_id\`);
    `)
    logs.push('✓ Customer.salesperson_id index created')
  } catch (e: any) {
    logs.push('• Customer.salesperson_id index already exists')
  }

  // ── 3b. Create ReferralVisitor table if it doesn't exist ──
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`ReferralVisitor\` (
        \`id\`        int          NOT NULL AUTO_INCREMENT,
        \`visitorId\` varchar(191) NOT NULL,
        \`ipAddress\` varchar(191) NOT NULL,
        \`userAgent\` text         NOT NULL,
        \`device\`    varchar(191) DEFAULT NULL,
        \`browser\`   varchar(191) DEFAULT NULL,
        \`firstSeen\` datetime(3)  NOT NULL DEFAULT current_timestamp(3),
        \`lastSeen\`  datetime(3)  NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`ReferralVisitor_visitorId_key\` (\`visitorId\`),
        KEY \`ReferralVisitor_visitorId_idx\` (\`visitorId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    logs.push('✓ ReferralVisitor table created (or already exists)')
  } catch (e: any) {
    errors.push('ReferralVisitor table: ' + e.message)
  }

  // ── 3c. Create ReferralTrackingEvent table if it doesn't exist ──
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`ReferralTrackingEvent\` (
        \`id\`            int          NOT NULL AUTO_INCREMENT,
        \`salespersonId\` int          NOT NULL,
        \`visitorId\`     varchar(191) NOT NULL,
        \`eventType\`     enum('PAGE_VISIT', 'WHATSAPP_CLICK') NOT NULL,
        \`utmSource\`     varchar(191) DEFAULT NULL,
        \`utmMedium\`     varchar(191) DEFAULT NULL,
        \`utmCampaign\`   varchar(191) DEFAULT NULL,
        \`referrerUrl\`   text         DEFAULT NULL,
        \`createdAt\`     datetime(3)  NOT NULL DEFAULT current_timestamp(3),
        PRIMARY KEY (\`id\`),
        KEY \`ReferralTrackingEvent_salespersonId_idx\` (\`salespersonId\`),
        KEY \`ReferralTrackingEvent_visitorId_idx\` (\`visitorId\`),
        KEY \`ReferralTrackingEvent_eventType_idx\` (\`eventType\`),
        KEY \`ReferralTrackingEvent_createdAt_idx\` (\`createdAt\`),
        CONSTRAINT \`ReferralTrackingEvent_salespersonId_fkey\` FOREIGN KEY (\`salespersonId\`) REFERENCES \`Salesperson\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `)
    logs.push('✓ ReferralTrackingEvent table created (or already exists)')
  } catch (e: any) {
    errors.push('ReferralTrackingEvent table: ' + e.message)
  }


  // ── 4. Seed salespersons ──
  const seedLogs: string[] = []
  for (const sp of salespersons) {
    try {
      await prisma.salesperson.upsert({
        where: { slug: sp.slug },
        update: { name: sp.name, phone: sp.phone, email: sp.email, active: true },
        create: { name: sp.name, slug: sp.slug, phone: sp.phone, email: sp.email, active: true },
      })
      seedLogs.push(`✓ ${sp.name} (${sp.slug})`)
    } catch (e: any) {
      seedLogs.push(`✗ ${sp.name}: ${e.message}`)
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    schemaMigration: logs,
    seeding: seedLogs,
    errors: errors.length ? errors : undefined,
  })
}
