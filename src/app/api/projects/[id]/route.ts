import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateProjectSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    repositoryUrl: z.string().url().optional(),
    deploymentUrl: z.string().url().optional(),
    status: z.enum(['planned', 'in_progress', 'completed']).optional(),
})

export const PATCH = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id } = await params
        const body = updateProjectSchema.parse(await req.json())

        const existing = await prisma.project.findFirst({
            where: { id, userId: userId! }
        })

        if (!existing) {
            throw new Error('Project not found') // Handled by API 
        }

        const project = await prisma.project.update({
            where: { id },
            data: body
        })

        return NextResponse.json({ project })
    }
)

export const DELETE = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id } = await params

        const existing = await prisma.project.findFirst({
            where: { id, userId: userId! }
        })

        if (!existing) {
            throw new Error('Project not found')
        }

        await prisma.project.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    }
)
