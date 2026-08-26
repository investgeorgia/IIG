import { NextResponse } from 'next/server'
import { projectsData } from '@/app/iigprojects/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(projectsData, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
