import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/apiHandler'
import { prisma } from '@/lib/db'
import { computeReadinessScores } from '@/services/scoringService'
import { getAllEvidenceSummaries } from '@/services/evidenceEngine'

export const GET = apiHandler(
    async (req: NextRequest, { userId }) => {
        // Get targets
        const targets = await prisma.target.findMany({
            where: { userId: userId!, deletedAt: null },
            include: {
                _count: { select: { jobRequirements: true } },
                readinessSnapshots: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        // Get overall stats
        const userSkillCount = await prisma.userSkill.count({ where: { userId: userId! } })
        const evidenceCount = await prisma.evidence.count({ where: { userId: userId! } })
        const evidenceSummaries = await getAllEvidenceSummaries(userId!)

        // Get readiness for all targets
        const targetScores = await Promise.all(
            targets.map(async (target: any) => {
                try {
                    const scores = await computeReadinessScores(userId!, target.id)
                    return { targetId: target.id, scores }
                } catch {
                    return { targetId: target.id, scores: null }
                }
            })
        )

        // Recent activity
        const recentJobs = await prisma.backgroundJob.findMany({
            where: { userId: userId! },
            orderBy: { createdAt: 'desc' },
            take: 5,
        })

        return NextResponse.json({
            summary: {
                totalTargets: targets.length,
                totalSkills: userSkillCount,
                totalEvidence: evidenceCount,
            },
            targets: targets.map((t: any) => ({
                id: t.id,
                title: t.title,
                company: t.company,
                requirementCount: t._count.jobRequirements,
                latestReadiness: t.readinessSnapshots[0]?.overallReadiness || null,
                scores: targetScores.find((ts) => ts.targetId === t.id)?.scores || null,
            })),
            evidenceSummaries,
            recentJobs: recentJobs.map((j: any) => ({
                id: j.id,
                type: j.type,
                status: j.status,
                createdAt: j.createdAt,
            })),
        })
    }
)
