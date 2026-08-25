import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { roadmapRepository } from '@/repositories/roadmapRepository'
import { updateRoadmapItemSchema } from '@/lib/validation/schemas'
import { NotFoundError, ForbiddenError } from '@/lib/errors'
import { prisma } from '@/lib/db'

export const PUT = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { itemId } = await params
        const body = await req.json()
        const data = updateRoadmapItemSchema.parse(body)

        // Verify ownership
        const item = await roadmapRepository.getItemById(itemId)
        if (!item) throw new NotFoundError('Roadmap item not found')

        const roadmap = item.roadmap
        const target = await prisma.target.findFirst({
            where: { id: roadmap.targetId, userId: userId! },
        })
        if (!target) throw new ForbiddenError()

        const updated = await roadmapRepository.updateItemStatus(
            itemId,
            data.status,
            data.selfReported
        )

        return NextResponse.json({ item: updated })
    }
)
