import { prisma } from '@/lib/db'

/**
 * Background Job Runner
 * Simple DB-backed job queue for async work (AI calls, GitHub sync)
 * MVP: executes inline. Upgradeable to a dedicated queue later.
 */

type JobHandler = (payload: Record<string, unknown>, userId: string) => Promise<unknown>

const handlers = new Map<string, JobHandler>()

/**
 * Register a job handler
 */
export function registerJobHandler(type: string, handler: JobHandler) {
    handlers.set(type, handler)
}

/**
 * Enqueue a background job and execute it
 */
export async function enqueueJob(
    type: string,
    userId: string,
    payload: Record<string, unknown> = {}
): Promise<string> {
    const job = await prisma.backgroundJob.create({
        data: {
            userId,
            type,
            status: 'pending',
            payload: JSON.stringify(payload),
        },
    })

    // MVP: Execute inline (async)
    executeJob(job.id, type, payload, userId).catch((err) => {
        console.error(`Job ${job.id} execution error:`, err)
    })

    return job.id
}

/**
 * Execute a job
 */
async function executeJob(
    jobId: string,
    type: string,
    payload: Record<string, unknown>,
    userId: string
) {
    const handler = handlers.get(type)
    if (!handler) {
        await prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
                status: 'failed',
                error: `No handler registered for job type: ${type}`,
                completedAt: new Date(),
            },
        })
        return
    }

    await prisma.backgroundJob.update({
        where: { id: jobId },
        data: { status: 'running', startedAt: new Date() },
    })

    try {
        const result = await handler(payload, userId)
        await prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
                status: 'complete',
                result: JSON.stringify(result),
                completedAt: new Date(),
            },
        })
    } catch (error) {
        await prisma.backgroundJob.update({
            where: { id: jobId },
            data: {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                completedAt: new Date(),
            },
        })
    }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
    const job = await prisma.backgroundJob.findUnique({
        where: { id: jobId },
    })

    if (!job) return null

    return {
        id: job.id,
        type: job.type,
        status: job.status,
        result: job.result ? JSON.parse(job.result) : null,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
    }
}
