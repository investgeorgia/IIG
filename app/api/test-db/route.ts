import { NextResponse } from 'next/server'
import mariadb from 'mariadb'
import { getCurrentUser } from '@/server/utils/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (user.role.name !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return NextResponse.json({ error: 'DATABASE_URL env variable is missing' })
  }

  const results: any = {
    rawConnection: 'Not tested',
    poolConnection: 'Not tested',
  }

  let url: URL
  try {
    const cleanUrl = dbUrl.split('?')[0]
    url = new URL(cleanUrl)
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to parse DATABASE_URL' })
  }

  const connConfig = {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.replace('/', ''),
    connectTimeout: 8000,
  }

  // Test 1: single non-pooled connection
  try {
    const conn = await mariadb.createConnection(connConfig)
    const rows = await conn.query('SELECT 1 as ok')
    await conn.end()
    results.rawConnection = {
      status: 'SUCCESS'
    }
  } catch (err: any) {
    results.rawConnection = {
      status: 'FAILED',
      code: err.code
    }
  }

  // Test 2: pool connection (same as Prisma uses)
  let pool: any = null
  try {
    pool = mariadb.createPool({
      ...connConfig,
      connectionLimit: 1,
      minimumIdle: 0,
      acquireTimeout: 8000,
    })
    const conn = await pool.getConnection()
    const rows = await conn.query('SELECT 1 as ok')
    conn.release()
    results.poolConnection = { status: 'SUCCESS' }
  } catch (err: any) {
    results.poolConnection = {
      status: 'FAILED',
      code: err.code
    }
  } finally {
    if (pool) {
      try { await pool.end() } catch (_) {}
    }
  }

  return NextResponse.json(results)
}
