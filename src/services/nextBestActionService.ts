import { roadmapRepository } from '@/repositories/roadmapRepository'
import { computePriority } from './roadmapEngine'
import { prisma } from '@/lib/db'

export async function getNextBestAction(targetId: string, userId: string) {
    // 1. Verify target exists and belongs to user
    const target = await prisma.target.findFirst({
        where: { id: targetId, userId }
    })

    if (!target) {
        throw new Error('Target not found')
    }

    // 2. Fetch the highest priority open item for this target
    const nextItem = await roadmapRepository.getHighestPriorityOpenItem(targetId)

    if (!nextItem) {
        return null
    }

    return {
        id: nextItem.id,
        skillId: nextItem.skillId,
        skillName: nextItem.skill?.name || 'Unknown Skill',
        task: nextItem.task,
        priority: nextItem.priority,
        whyItMatters: nextItem.whyItMatters,
        milestone: nextItem.milestone
    }
}
