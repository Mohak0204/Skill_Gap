import { prisma } from '@/lib/db'
import { evidenceRepository } from '@/repositories/evidenceRepository'

/**
 * Evidence Engine - Computes Evidence Level (0-5) per skill
 * 
 * Level 0: No evidence (Claimed only)
 * Level 1: Mentioned in resume 
 * Level 2: Present in a project description
 * Level 3: Demonstrated in working project (code exists)
 * Level 4: Deployed/used in realistic environment (Docker, CI/CD, deployment)
 * Level 5: Independently verified via sustained GitHub activity + CI passing
 * 
 * GitHub-sourced evidence is explicitly capped as "detected, not verified mastery"
 * It can reach Level 3-4 automatically but Level 5 requires additional signals.
 */

export type EvidenceLevel = 0 | 1 | 2 | 3 | 4 | 5

export interface EvidenceSummary {
    skillId: string
    skillName: string
    level: EvidenceLevel
    sources: Array<{
        type: string
        url?: string
        description: string
        strength: number
    }>
}

/**
 * Compute Evidence Level from a set of evidence records
 * Pure, deterministic function - no AI calls
 */
export function computeEvidenceLevel(
    evidenceItems: Array<{
        sourceType: string
        strength: number
        description: string
    }>
): EvidenceLevel {
    if (evidenceItems.length === 0) return 0

    const maxStrength = Math.max(...evidenceItems.map((e) => e.strength))
    const hasGithub = evidenceItems.some((e) => e.sourceType === 'github')
    const hasResume = evidenceItems.some((e) => e.sourceType === 'resume')
    const hasManual = evidenceItems.some((e) => e.sourceType === 'manual')

    // Level 5: Requires sustained activity from multiple sources
    if (maxStrength >= 5 && hasGithub && (hasResume || hasManual)) {
        return 5
    }

    // Level 4: Deployed/used in realistic environment
    if (maxStrength >= 4 || (hasGithub && maxStrength >= 3)) {
        return 4
    }

    // Level 3: Demonstrated in working project
    if (maxStrength >= 3 || (hasGithub && maxStrength >= 2)) {
        return 3
    }

    // Level 2: Present in a project
    if (maxStrength >= 2 || (hasResume && hasGithub)) {
        return 2
    }

    // Level 1: Mentioned in resume or manual entry
    if (hasResume || hasManual || maxStrength >= 1) {
        return 1
    }

    return 0
}

/**
 * Get aggregated evidence summary for a user+skill pair
 */
export async function getEvidenceSummary(
    userId: string,
    skillId: string
): Promise<EvidenceSummary> {
    const evidence = await evidenceRepository.findByUserAndSkill(userId, skillId)
    const skill = await prisma.skill.findUnique({ where: { id: skillId } })

    const level = computeEvidenceLevel(evidence)

    return {
        skillId,
        skillName: skill?.name || 'Unknown',
        level,
        sources: evidence.map((e: any) => ({
            type: e.sourceType,
            url: e.sourceUrl || undefined,
            description: e.description,
            strength: e.strength,
        })),
    }
}

/**
 * Get evidence summaries for all skills of a user
 */
export async function getAllEvidenceSummaries(
    userId: string
): Promise<EvidenceSummary[]> {
    const userSkills = await prisma.userSkill.findMany({
        where: { userId },
        include: { skill: true },
    })

    const summaries: EvidenceSummary[] = []
    for (const us of userSkills) {
        const summary = await getEvidenceSummary(userId, us.skillId)
        summaries.push(summary)
    }

    return summaries
}
