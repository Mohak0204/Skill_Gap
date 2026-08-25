import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { getNextBestAction } from '@/services/nextBestActionService'

export const GET = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id: targetId } = await params

        const nextTarget = await getNextBestAction(targetId, userId!)

        if (!nextTarget) {
            return NextResponse.json({ action: null })
        }

        return NextResponse.json({
            action: nextTarget
        })
    }
)
