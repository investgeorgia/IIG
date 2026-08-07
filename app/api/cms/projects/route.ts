import { NextResponse } from 'next/server'
import { ProjectService } from '@/server/services/ProjectService'
import { getCurrentUser } from '@/server/utils/auth'
import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { safeErrorMessage } from '@/server/utils/errors'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    if (!checkPermission(user, 'Projects', AccessLevel.VIEW)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const projects = await ProjectService.getAllProjects()
    return NextResponse.json(projects)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    if (!checkPermission(user, 'Projects', AccessLevel.EDIT)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    // Convert date strings to Date objects if necessary
    if (body.completionDate) {
      body.completionDate = new Date(body.completionDate)
    }
    const project = await ProjectService.createProject(body)
    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
