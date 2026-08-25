import { prisma } from '@/lib/db'

export const roadmapRepository = {
    async findByTarget(targetId: string) {
        return prisma.roadmap.findFirst({
            where: { targetId, status: 'active' },
            include: {
                roadmapItems: {
                    include: { skill: true, project: true },
                    orderBy: { priority: 'desc' },
                },
            },
        })
    },

    async createWithItems(data: {
        targetId: string
        title: string
        items: Array<{
            skillId: string
            projectId?: string
            task: string
            whyItMatters?: string
            currentStatus?: string
            missingEvidence?: string
            definitionOfDone: string
            milestone?: string
            estimatedHours?: number
            priority: number
        }>
    }) {
        // Archive any existing active roadmaps
        await prisma.roadmap.updateMany({
            where: { targetId: data.targetId, status: 'active' },
            data: { status: 'archived' },
        })

        return prisma.roadmap.create({
            data: {
                targetId: data.targetId,
                title: data.title,
                status: 'active',
                roadmapItems: {
                    create: data.items,
                },
            },
            include: {
                roadmapItems: {
                    include: { skill: true },
                    orderBy: { priority: 'desc' },
                },
            },
        })
    },

    async updateItemStatus(
        itemId: string,
        status: string,
        selfReported?: boolean
    ) {
        return prisma.roadmapItem.update({
            where: { id: itemId },
            data: {
                status,
                ...(selfReported !== undefined ? { selfReported } : {}),
            },
        })
    },

    async getItemById(itemId: string) {
        return prisma.roadmapItem.findUnique({
            where: { id: itemId },
            include: { roadmap: true, skill: true, project: true },
        })
    },

    async getHighestPriorityOpenItem(targetId: string) {
        const roadmap = await prisma.roadmap.findFirst({
            where: { targetId, status: 'active' },
        })
        if (!roadmap) return null

        return prisma.roadmapItem.findFirst({
            where: {
                roadmapId: roadmap.id,
                status: { notIn: ['completed', 'verified'] },
            },
            include: { skill: true, project: true },
            orderBy: { priority: 'desc' },
        })
    },
}
