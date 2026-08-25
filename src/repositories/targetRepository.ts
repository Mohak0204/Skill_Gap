import { prisma } from '@/lib/db'
import type { CreateTargetInput, UpdateTargetInput } from '@/lib/validation/schemas'

export const targetRepository = {
    async findById(id: string, userId: string) {
        return prisma.target.findFirst({
            where: { id, userId, deletedAt: null },
            include: {
                jobRequirements: { include: { skill: true } },
                roadmaps: { include: { roadmapItems: { include: { skill: true, project: true } } } },
            },
        })
    },

    async findAllByUser(userId: string) {
        return prisma.target.findMany({
            where: { userId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { jobRequirements: true } },
            },
        })
    },

    async create(userId: string, data: CreateTargetInput) {
        return prisma.target.create({
            data: {
                userId,
                title: data.title,
                company: data.company,
                jobDescription: data.jobDescription,
                experienceLevel: data.experienceLevel,
                deadline: data.deadline ? new Date(data.deadline) : null,
            },
        })
    },

    async update(id: string, userId: string, data: UpdateTargetInput) {
        return prisma.target.updateMany({
            where: { id, userId, deletedAt: null },
            data: {
                ...data,
                deadline: data.deadline === null ? null : data.deadline ? new Date(data.deadline) : undefined,
            },
        })
    },

    async softDelete(id: string, userId: string) {
        return prisma.target.updateMany({
            where: { id, userId, deletedAt: null },
            data: { deletedAt: new Date() },
        })
    },
}
