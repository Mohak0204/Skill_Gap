import { prisma } from '@/lib/db'

export const evidenceRepository = {
    async findByUserAndSkill(userId: string, skillId: string) {
        return prisma.evidence.findMany({
            where: { userId, skillId },
            orderBy: { strength: 'desc' },
        })
    },

    async findAllByUser(userId: string) {
        return prisma.evidence.findMany({
            where: { userId },
            include: { skill: true },
            orderBy: { createdAt: 'desc' },
        })
    },

    async findBySkillId(skillId: string, userId: string) {
        return prisma.evidence.findMany({
            where: { userId, skillId },
            include: { skill: true, repository: true, project: true },
        })
    },

    async upsertForSkill(data: {
        userId: string
        skillId: string
        sourceType: string
        sourceUrl?: string
        description: string
        strength: number
        repositoryId?: string
        projectId?: string
    }) {
        // Check for existing evidence from same source
        const existing = await prisma.evidence.findFirst({
            where: {
                userId: data.userId,
                skillId: data.skillId,
                sourceType: data.sourceType,
                sourceUrl: data.sourceUrl || undefined,
            },
        })

        if (existing) {
            return prisma.evidence.update({
                where: { id: existing.id },
                data: {
                    description: data.description,
                    strength: Math.max(existing.strength, data.strength),
                    verifiedAt: new Date(),
                },
            })
        }

        return prisma.evidence.create({
            data: {
                ...data,
                verifiedAt: new Date(),
            },
        })
    },

    async create(data: {
        userId: string
        skillId: string
        sourceType: string
        sourceUrl?: string
        description: string
        strength: number
        repositoryId?: string
        projectId?: string
    }) {
        return prisma.evidence.create({ data })
    },

    async getMaxStrengthBySkill(userId: string, skillId: string): Promise<number> {
        const result = await prisma.evidence.aggregate({
            where: { userId, skillId },
            _max: { strength: true },
        })
        return result._max.strength || 0
    },
}
