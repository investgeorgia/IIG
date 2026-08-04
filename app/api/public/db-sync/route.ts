import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  // Simple token security check
  if (token !== 'sync1234') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return new Promise((resolve) => {
    // Run prisma db push in the project directory context
    const cmd = 'npx prisma db push'
    
    exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        resolve(
          NextResponse.json({
            success: false,
            message: 'Database sync failed',
            error: error.message,
            stderr
          }, { status: 500 })
        )
      } else {
        resolve(
          NextResponse.json({
            success: true,
            message: 'Database schema successfully synced to production database!',
            stdout,
            stderr
          })
        )
      }
    })
  })
}
