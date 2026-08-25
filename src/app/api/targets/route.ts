import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { targetRepository } from '@/repositories/targetRepository'
import { createTargetSchema } from '@/lib/validation/schemas'
import { enqueueJob } from '@/jobs/jobRunner'
// Register handlers on import
import '@/jobs/handlers/analyzeTargetHandler'

export const GET = apiHandler(async (req: NextRequest, { userId }) => {
    const targets = await targetRepository.findAllByUser(userId!)
    return NextResponse.json({ targets })
})

export const POST = apiHandler(async (req: NextRequest, { userId }) => {
    const body = await req.json()
    const data = createTargetSchema.parse(body)

    const target = await targetRepository.create(userId!, data)

    // Enqueue background job to analyze the job description
    const jobId = await enqueueJob('analyze_target', userId!, { targetId: target.id })

    return NextResponse.json({ target, jobId }, { status: 201 })
})
