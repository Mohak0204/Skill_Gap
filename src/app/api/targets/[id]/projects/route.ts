import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { generateProjectIdeas } from '@/services/projectGeneratorService'
import { getAIProvider } from '@/ai/adapters/claudeAdapter'

export const POST = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id: targetId } = await params

        const aiProvider = getAIProvider()
        const projectIdeas = await generateProjectIdeas(userId!, targetId, aiProvider)

        return NextResponse.json({ projects: projectIdeas })
    }
)
