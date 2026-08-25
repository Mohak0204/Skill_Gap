import { prisma } from '@/lib/db'

export const skillRepository = {
    async findById(id: string) {
        return prisma.skill.findUnique({ where: { id } })
    },

    async findByName(name: string) {
        return prisma.skill.findUnique({ where: { name } })
    },

    async findByAliasOrName(term: string) {
        const normalized = term.trim().toLowerCase()
        // Try exact name match first
        const exact = await prisma.skill.findFirst({
            where: { name: { equals: normalized } },
        })
        if (exact) return exact

        // Search in aliases (comma-separated in the aliases field)
        const skills = await prisma.skill.findMany()
        return skills.find((s: any) => {
            const aliases = s.aliases.split(',').map((a: string) => a.trim().toLowerCase())
            return aliases.includes(normalized)
        }) || null
    },

    async search(query: string) {
        return prisma.skill.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { aliases: { contains: query } },
                ],
            },
            take: 50,
        })
    },

    async findAll() {
        return prisma.skill.findMany({ orderBy: { category: 'asc' } })
    },

    async create(data: { name: string; category: string; aliases?: string }) {
        return prisma.skill.create({ data: { ...data, aliases: data.aliases || '' } })
    },
}
