import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import {
    AppError,
    UnauthorizedError,
} from './errors'
import { getServerSession } from './auth'

type RouteHandler = (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

interface ApiHandlerOptions {
    requireAuth?: boolean
}

/**
 * Wraps an API route handler with standard error handling and auth checks.
 * Maps domain errors to consistent {error: {code, message}} HTTP responses.
 */
export function apiHandler(
    handler: (
        req: NextRequest,
        context: {
            params: Promise<Record<string, string>>
            userId?: string
        }
    ) => Promise<NextResponse>,
    options: ApiHandlerOptions = { requireAuth: true }
): RouteHandler {
    return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
        try {
            // Auth check if required
            let userId: string | undefined
            if (options.requireAuth) {
                const session = await getServerSession()
                if (!session?.user?.id) {
                    throw new UnauthorizedError()
                }
                userId = session.user.id
            }

            return await handler(req, { ...context, userId })
        } catch (error) {
            // Zod validation errors
            if (error instanceof ZodError) {
                const details: Record<string, string[]> = {}
                for (const issue of error.issues) {
                    const path = issue.path.join('.')
                    if (!details[path]) details[path] = []
                    details[path].push(issue.message)
                }
                return NextResponse.json(
                    { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } },
                    { status: 400 }
                )
            }

            // Domain errors
            if (error instanceof AppError) {
                return NextResponse.json(
                    { error: { code: error.code, message: error.message } },
                    { status: error.statusCode }
                )
            }

            // Unknown errors - log and return 500
            console.error('Unhandled API error:', error)
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
                { status: 500 }
            )
        }
    }
}
