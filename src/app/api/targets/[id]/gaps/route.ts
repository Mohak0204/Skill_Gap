import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { analyzeSkillGap } from '@/services/skillGapEngine'
import { NotFoundError } from '@/lib/errors'
import { targetRepository } from '@/repositories/targetRepository'

export const GET = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id } = await params

        // Ownership check
        const target = await targetRepository.findById(id, userId!)
        if (!target) throw new NotFoundError('Target not found')

        const gaps = await analyzeSkillGap(userId!, id)
        return NextResponse.json({ gaps })
    }
)
