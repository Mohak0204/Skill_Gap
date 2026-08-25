import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { NotFoundError } from '@/lib/errors'
import { targetRepository } from '@/repositories/targetRepository'
import { roadmapRepository } from '@/repositories/roadmapRepository'
import { generateRoadmap } from '@/services/roadmapEngine'

export const GET = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id } = await params

        const target = await targetRepository.findById(id, userId!)
        if (!target) throw new NotFoundError('Target not found')

        const roadmap = await roadmapRepository.findByTarget(id)
        if (!roadmap) {
            return NextResponse.json({ roadmap: null, message: 'No roadmap generated yet' })
        }

        return NextResponse.json({ roadmap })
    }
)

export const POST = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id } = await params

        const target = await targetRepository.findById(id, userId!)
        if (!target) throw new NotFoundError('Target not found')

        // Generate roadmap (will try AI then fallback to deterministic)
        try {
            const { getAIProvider } = await import('@/ai/adapters/claudeAdapter')
            await generateRoadmap(userId!, id, getAIProvider())
        } catch {
            // Fallback to deterministic
            await generateRoadmap(userId!, id)
        }

        const roadmap = await roadmapRepository.findByTarget(id)
        return NextResponse.json({ roadmap }, { status: 201 })
    }
)
