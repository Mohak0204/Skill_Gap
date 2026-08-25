import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createProjectSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    repositoryUrl: z.string().url().optional(),
    deploymentUrl: z.string().url().optional(),
    status: z.enum(['planned', 'in_progress', 'completed']),
    skillIds: z.array(z.string()).optional()
})

export const POST = apiHandler(
    async (req: NextRequest, { userId }) => {
        const body = createProjectSchema.parse(await req.json())

        const project = await prisma.project.create({
            data: {
                userId: userId!,
                title: body.title,
                description: body.description,
                repositoryUrl: body.repositoryUrl,
                deploymentUrl: body.deploymentUrl,
                status: body.status,
                projectSkills: {
                    create: (body.skillIds || []).map(skillId => ({
                        skillId,
                        relevance: 100 // Default full relevance
                    }))
                }
            }
        })

        return NextResponse.json({ project })
    }
)

export const GET = apiHandler(
    async (req: NextRequest, { userId }) => {
        const projects = await prisma.project.findMany({
            where: { userId: userId! },
            include: {
                projectSkills: {
                    include: { skill: true }
                }
            },
            orderBy: { title: 'asc' }
        })

        return NextResponse.json({ projects })
    }
)
