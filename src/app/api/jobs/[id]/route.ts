import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { getJobStatus } from '@/jobs/jobRunner'
import { NotFoundError } from '@/lib/errors'

export const GET = apiHandler(
    async (req: NextRequest, { params }) => {
        const { id } = await params
        const status = await getJobStatus(id)

        if (!status) throw new NotFoundError('Job not found')

        return NextResponse.json({ job: status })
    }
)
