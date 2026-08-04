import { NextResponse } from 'next/server'
import { exec } from 'child_process'
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

  // 1. Run npx prisma db push
  const syncResult = await new Promise<{ success: boolean; stdout: string; stderr: string }>((resolve) => {
    exec('npx prisma db push', { cwd: process.cwd() }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        stdout,
        stderr: stderr || ''
      })
    })
  })

  if (!syncResult.success) {
    return NextResponse.json({
      success: false,
      message: 'Database schema sync failed',
      details: syncResult
    }, { status: 500 })
  }

  // 2. Seed the salespersons
  const seedLogs: string[] = []
  try {
    for (const sp of salespersons) {
      const result = await prisma.salesperson.upsert({
        where: { slug: sp.slug },
        update: {
          name: sp.name,
          phone: sp.phone,
          email: sp.email,
          active: true
        },
        create: {
          name: sp.name,
          slug: sp.slug,
          phone: sp.phone,
          email: sp.email,
          active: true
        }
      })
      seedLogs.push(`Seed success: ${result.name} (${result.slug})`)
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema synced AND salespersons successfully seeded in production!',
      dbPushOutput: syncResult.stdout,
      seedingLogs: seedLogs
    })
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      message: 'Database schema synced but seeding failed.',
      dbPushOutput: syncResult.stdout,
      seedingError: err.message
    }, { status: 500 })
  }
}
