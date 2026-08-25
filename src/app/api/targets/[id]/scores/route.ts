import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { computeReadinessScores, saveReadinessSnapshot } from '@/services/scoringService'
import { NotFoundError } from '@/lib/errors'
import { targetRepository } from '@/repositories/targetRepository'

export const GET = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id } = await params

        const target = await targetRepository.findById(id, userId!)
        if (!target) throw new NotFoundError('Target not found')

        const scores = await computeReadinessScores(userId!, id)
        return NextResponse.json({ scores })
    }
)

export const POST = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id } = await params

        const target = await targetRepository.findById(id, userId!)
        if (!target) throw new NotFoundError('Target not found')

        const scores = await computeReadinessScores(userId!, id)
        await saveReadinessSnapshot(id, scores, 'manual')

        return NextResponse.json({ scores, snapshotSaved: true })
    }
)
