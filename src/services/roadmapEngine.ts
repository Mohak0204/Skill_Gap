import { prisma } from '@/lib/db'
import { normalizeSkill } from '@/lib/skillNormalization'
import { type AIProvider } from '@/ai/provider'
import { roadmapRepository } from '@/repositories/roadmapRepository'
import { analyzeSkillGap, type SkillGapResult } from './skillGapEngine'

/**
 * Roadmap Engine - Generates prioritized roadmap items
 * 
 * Priority = JobImportance×0.35 + GapSeverity×0.30 + EvidenceDeficit×0.20 + PortfolioValue×0.15
 */

// Status to severity score mapping
const STATUS_SEVERITY: Record<string, number> = {
    missing: 100,
    claimed_unproven: 75,
    low_priority: 50,
    partial: 25,
    strong: 0,
}

/**
 * Compute Priority Score - pure deterministic function
 */
export function computePriority(params: {
    importance: string     // "required" | "preferred"
    status: string         // gap status
    evidenceLevel: number  // 0-5
}): number {
    const { importance, status, evidenceLevel } = params

    const jobImportance = importance === 'required' ? 100 : 50
    const gapSeverity = STATUS_SEVERITY[status] ?? 50
    const evidenceDeficit = ((5 - evidenceLevel) / 5) * 100
    const portfolioValue = status === 'missing' ? 80 : status === 'claimed_unproven' ? 60 : 30

    return (
        jobImportance * 0.35 +
        gapSeverity * 0.30 +
        evidenceDeficit * 0.20 +
        portfolioValue * 0.15
    )
}

/**
 * Generate a roadmap for a target job
 */
export async function generateRoadmap(
    userId: string,
    targetId: string,
    aiProvider?: AIProvider
): Promise<void> {
    const target = await prisma.target.findFirst({
        where: { id: targetId, userId },
    })
    if (!target) throw new Error('Target not found')

    const gaps = await analyzeSkillGap(userId, targetId)

    // Only create roadmap items for skills that need work
    const actionableGaps = gaps.filter(
        (g) => g.status !== 'strong'
    )

    if (actionableGaps.length === 0) {
        // All skills are strong - create a minimal completion roadmap
        await roadmapRepository.createWithItems({
            targetId,
            title: `Roadmap: ${target.title}`,
            items: [{
                skillId: gaps[0]?.skillId || '',
                task: 'All required skills are strong! Consider polishing your portfolio.',
                definitionOfDone: 'Review and update project README files and documentation',
                priority: 10,
            }],
        })
        return
    }

    let items: Array<{
        skillId: string
        task: string
        whyItMatters?: string
        currentStatus?: string
        missingEvidence?: string
        definitionOfDone: string
        milestone?: string
        estimatedHours?: number
        priority: number
    }> = []

    // Try AI-powered roadmap generation
    if (aiProvider) {
        try {
            const roadmapOutput = await aiProvider.generateRoadmap({
                targetTitle: target.title,
                targetCompany: target.company || undefined,
                skills: actionableGaps.map((g) => ({
                    name: g.skillName,
                    status: g.status,
                    evidenceLevel: g.evidenceLevel,
                    importance: g.importance,
                })),
                deadline: target.deadline?.toISOString(),
            })

            // Map AI output to roadmap items
            for (const item of roadmapOutput.items) {
                const normalized = await normalizeSkill(item.skill)
                const gap = actionableGaps.find((g) => g.skillId === normalized.skillId)

                items.push({
                    skillId: normalized.skillId,
                    task: item.task,
                    whyItMatters: item.whyItMatters,
                    currentStatus: item.currentStatus,
                    missingEvidence: item.missingEvidence,
                    definitionOfDone: item.definitionOfDone || 'Complete the task and document results',
                    milestone: item.milestone,
                    estimatedHours: item.estimatedHours,
                    priority: gap
                        ? computePriority({ importance: gap.importance, status: gap.status, evidenceLevel: gap.evidenceLevel })
                        : 50,
                })
            }
        } catch {
            // Fall through to deterministic fallback
            items = []
        }
    }

    // Deterministic fallback if AI failed or not available
    if (items.length === 0) {
        items = generateDeterministicRoadmap(actionableGaps)
    }

    await roadmapRepository.createWithItems({
        targetId,
        title: `Roadmap: ${target.title}`,
        items,
    })
}

/**
 * Deterministic template-based roadmap generation (fallback when AI unavailable)
 */
function generateDeterministicRoadmap(gaps: SkillGapResult[]): Array<{
    skillId: string
    task: string
    whyItMatters: string
    currentStatus: string
    missingEvidence: string
    definitionOfDone: string
    milestone: string
    estimatedHours: number
    priority: number
}> {
    return gaps.map((gap) => {
        const priority = computePriority({
            importance: gap.importance,
            status: gap.status,
            evidenceLevel: gap.evidenceLevel,
        })

        const tasksByStatus: Record<string, string> = {
            missing: `Learn ${gap.skillName} fundamentals and build a project demonstrating it`,
            claimed_unproven: `Create a public project or contribution that demonstrates ${gap.skillName}`,
            partial: `Strengthen your ${gap.skillName} evidence with a more comprehensive project`,
            low_priority: `Explore ${gap.skillName} basics when time allows`,
        }

        const dodByStatus: Record<string, string> = {
            missing: `Complete a tutorial or course on ${gap.skillName}, then build and deploy a small project using it. Push code to GitHub with a README explaining your implementation.`,
            claimed_unproven: `Create a public GitHub repository demonstrating ${gap.skillName} with tests, documentation, and a clear README.`,
            partial: `Enhance an existing project to include more advanced ${gap.skillName} usage. Add tests and CI/CD if not already present.`,
            low_priority: `Read documentation and complete a basic exercise using ${gap.skillName}. Optional: build a small demo.`,
        }

        return {
            skillId: gap.skillId,
            task: tasksByStatus[gap.status] || `Work on ${gap.skillName}`,
            whyItMatters: `${gap.skillName} is ${gap.importance} for this role`,
            currentStatus: gap.status,
            missingEvidence: gap.explanation,
            definitionOfDone: dodByStatus[gap.status] || `Demonstrate ${gap.skillName} in a project`,
            milestone: gap.importance === 'required' ? 'Core Skills' : 'Nice-to-Have Skills',
            estimatedHours: gap.status === 'missing' ? 20 : 10,
            priority,
        }
    })
}
