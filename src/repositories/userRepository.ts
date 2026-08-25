import { prisma } from '@/lib/db'

export const userRepository = {
    async findById(id: string) {
        return prisma.user.findUnique({ where: { id } })
    },

    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } })
    },

    async create(data: {
        email: string
        name: string
        passwordHash: string
    }) {
        return prisma.user.create({ data })
    },

    async update(id: string, data: Partial<{
        name: string
        githubUsername: string | null
        githubAccessToken: string | null
        githubTokenIv: string | null
    }>) {
        return prisma.user.update({ where: { id }, data })
    },

    async delete(id: string) {
        return prisma.user.delete({ where: { id } })
    },
}
