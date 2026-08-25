import { prisma } from '@/lib/db'
import { type AIProvider } from '@/ai/provider'
import { analyzeSkillGap } from './skillGapEngine'

export async function generateProjectIdeas(
    userId: string,
    targetId: string,
    aiProvider: AIProvider
) {
    const target = await prisma.target.findFirst({
        where: { id: targetId, userId }
    })

    if (!target) throw new Error('Target not found')

    const gaps = await analyzeSkillGap(userId, targetId)

    const gapSkills = gaps.filter((g: any) => g.status !== 'strong').map((g: any) => ({
        name: g.skillName,
        priority: 50, // default placeholder
        importance: g.importance
    }))

    const existingSkills = gaps.filter((g: any) => g.status === 'strong').map((g: any) => g.skillName)

    if (gapSkills.length === 0) {
        return []
    }

    try {
        const result = await aiProvider.generateProjectIdeas({
            gapSkills,
            existingSkills,
            availableHours: 40 // Default constraint
        })

        return result.projects
    } catch {
        return [{
            title: `Master ${gapSkills[0]?.name}`,
            description: `A focused project demonstrating core usage of ${gapSkills[0]?.name}`,
            skillsCovered: [gapSkills[0]?.name],
            skillCoveragePercent: 100,
            difficulty: 'beginner',
            estimatedHours: 10,
            portfolioValue: 50,
            evidenceStrengthProjected: 60
        }]
    }
}
