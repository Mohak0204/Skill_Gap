import { prisma } from '@/lib/db'

export const githubRepository = {
    async findByUser(userId: string) {
        return prisma.gitHubRepository.findMany({
            where: { userId },
            orderBy: { lastSyncedAt: 'desc' },
        })
    },

    async findByGithubId(userId: string, githubId: string) {
        return prisma.gitHubRepository.findFirst({
            where: { userId, githubId },
        })
    },

    async upsert(data: {
        userId: string
        githubId: string
        name: string
        fullName?: string
        url: string
        description?: string
        language?: string
        languages?: string
        stars?: number
        forks?: number
        hasDockerfile?: boolean
        hasCiCd?: boolean
        hasTests?: boolean
        hasReadme?: boolean
        readmeLength?: number
        lastActivity?: Date
    }) {
        return prisma.gitHubRepository.upsert({
            where: {
                userId_githubId: {
                    userId: data.userId,
                    githubId: data.githubId,
                },
            },
            create: {
                ...data,
                lastSyncedAt: new Date(),
            },
            update: {
                ...data,
                lastSyncedAt: new Date(),
            },
        })
    },

    async getLastSyncTime(userId: string): Promise<Date | null> {
        const repo = await prisma.gitHubRepository.findFirst({
            where: { userId },
            orderBy: { lastSyncedAt: 'desc' },
        })
        return repo?.lastSyncedAt || null
    },

    async deleteByUser(userId: string) {
        return prisma.gitHubRepository.deleteMany({ where: { userId } })
    },
}
