import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { targetRepository } from '@/repositories/targetRepository'
import { updateTargetSchema } from '@/lib/validation/schemas'
import { NotFoundError } from '@/lib/errors'

export const GET = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id } = await params
        const target = await targetRepository.findById(id, userId!)
        if (!target) throw new NotFoundError('Target not found')
        return NextResponse.json({ target })
    }
)

export const PUT = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id } = await params
        const body = await req.json()
        const data = updateTargetSchema.parse(body)

        const result = await targetRepository.update(id, userId!, data)
        if (result.count === 0) throw new NotFoundError('Target not found')

        const updated = await targetRepository.findById(id, userId!)
        return NextResponse.json({ target: updated })
    }
)

export const DELETE = apiHandler(
    async (req: NextRequest, { params, userId }) => {
        const { id } = await params
        const result = await targetRepository.softDelete(id, userId!)
        if (result.count === 0) throw new NotFoundError('Target not found')
        return NextResponse.json({ message: 'Target deleted' })
    }
)
