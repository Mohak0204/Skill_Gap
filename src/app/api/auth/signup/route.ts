import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signUpSchema } from '@/lib/validation/schemas'
import { apiHandler } from '@/lib/apiHandler'
import { ConflictError } from '@/lib/errors'

export const POST = apiHandler(
    async (req: NextRequest) => {
        const body = await req.json()
        const data = signUpSchema.parse(body)

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        })

        if (existingUser) {
            throw new ConflictError('An account with this email already exists')
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                passwordHash,
            },
        })

        return NextResponse.json(
            { user: { id: user.id, name: user.name, email: user.email } },
            { status: 201 }
        )
    },
    { requireAuth: false }
)
