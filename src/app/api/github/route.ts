import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { enqueueJob, getJobStatus } from '@/jobs/jobRunner'
import { checkSyncCooldown } from '@/services/githubSyncService'
import { RateLimitError } from '@/lib/errors'
import { prisma } from '@/lib/db'
import { githubRepository } from '@/repositories/githubRepository'
// Register handler
import '@/jobs/handlers/githubSyncHandler'

export const GET = apiHandler(
    async (req: NextRequest, { userId }) => {
        const repos = await githubRepository.findByUser(userId!)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { githubUsername: true, githubAccessToken: true },
        })

        return NextResponse.json({
            connected: !!user?.githubAccessToken,
            githubUsername: user?.githubUsername,
            repositories: repos,
        })
    }
)

export const POST = apiHandler(
    async (req: NextRequest, { userId }) => {
        // Check cooldown
        const cooldown = await checkSyncCooldown(userId!)
        if (!cooldown.allowed) {
            throw new RateLimitError(
                `Please wait ${cooldown.retryAfter} seconds before syncing again`,
                cooldown.retryAfter
            )
        }

        // Check GitHub is connected
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { githubAccessToken: true },
        })

        if (!user?.githubAccessToken) {
            return NextResponse.json(
                { error: { code: 'GITHUB_NOT_CONNECTED', message: 'GitHub account not connected' } },
                { status: 400 }
            )
        }

        // Enqueue sync job
        const jobId = await enqueueJob('github_sync', userId!)

        return NextResponse.json({ jobId }, { status: 202 })
    }
)
