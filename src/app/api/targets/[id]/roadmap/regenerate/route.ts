import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { generateRoadmap } from '@/services/roadmapEngine'
import { getAIProvider } from '@/ai/adapters/claudeAdapter'

export const POST = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id: targetId } = await params

        const aiProvider = getAIProvider()
        // Synchronous generation for MVP (might take a few seconds)
        await generateRoadmap(userId!, targetId, aiProvider)

        return NextResponse.json({ success: true })
    }
)
