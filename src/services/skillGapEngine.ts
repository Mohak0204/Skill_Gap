import { prisma } from '@/lib/db'
import { computeEvidenceLevel, type EvidenceLevel } from './evidenceEngine'

/**
 * Skill Gap Engine - Deterministic skill status computation
 * 
 * Status values:
 * - Strong: User has the skill AND strong evidence (Level >= 3) AND it's required/preferred
 * - Partial: User has the skill AND some evidence (Level 1-2)  
 * - Claimed-Unproven: User claims the skill (resume/manual) but no supporting evidence
 * - Missing: Skill is required but user has no record of it
 * - Low Priority: Skill is "preferred" and user doesn't have it (less urgent than Missing)
 *
 * This is computed deterministically - no AI calls involved.
 * Per PRD §5.5: "computed deterministically from evidence level and requirement importance"
 */

export type SkillStatus = 'strong' | 'partial' | 'claimed_unproven' | 'missing' | 'low_priority'

export interface SkillGapResult {
    skillId: string
    skillName: string
    category: string
    status: SkillStatus
    explanation: string
    evidenceLevel: EvidenceLevel
    importance: string
    requirementType: string
}

/**
 * Compute the status for a single skill given the evidence and requirement.
 * Pure, unit-testable function.
 */
export function computeSkillStatus(params: {
    hasUserSkill: boolean
    evidenceLevel: EvidenceLevel
    importance: string // "required" | "preferred"
}): { status: SkillStatus; explanation: string } {
    const { hasUserSkill, evidenceLevel, importance } = params

    // User has the skill AND strong evidence
    if (hasUserSkill && evidenceLevel >= 3) {
        return {
            status: 'strong',
            explanation: `Strong evidence found (Level ${evidenceLevel}). Skill is well-demonstrated with supporting evidence from projects and/or GitHub activity.`,
        }
    }

    // User has the skill AND some evidence (Level 1-2)
    if (hasUserSkill && evidenceLevel >= 1 && evidenceLevel < 3) {
        return {
            status: 'partial',
            explanation: `Partial evidence found (Level ${evidenceLevel}). Skill is claimed with some supporting evidence, but could be strengthened with more concrete demonstrations.`,
        }
    }

    // User claims the skill but no supporting evidence
    if (hasUserSkill && evidenceLevel === 0) {
        return {
            status: 'claimed_unproven',
            explanation: 'Claimed on resume or manually entered, but no supporting evidence found. Consider building a project or contributing to open source to demonstrate this skill.',
        }
    }

    // Skill is preferred but user doesn't have it - lower priority
    if (!hasUserSkill && importance === 'preferred') {
        return {
            status: 'low_priority',
            explanation: 'This skill is preferred but not required for the role. Focus on required skills first, then address this gap.',
        }
    }

    // Skill is required but user has no record of it
    return {
        status: 'missing',
        explanation: 'This skill is required for the role but not found in your profile. This is a critical gap to address.',
    }
}

/**
 * Run the full skill gap analysis for a target job.
 * Compares target requirements against user skills and evidence.
 */
export async function analyzeSkillGap(
    userId: string,
    targetId: string
): Promise<SkillGapResult[]> {
    // Get all job requirements for this target
    const requirements = await prisma.jobRequirement.findMany({
        where: { targetId },
        include: { skill: true },
    })

    // Get all user skills
    const userSkills = await prisma.userSkill.findMany({
        where: { userId },
    })
    const userSkillMap = new Map(userSkills.map((us: any) => [us.skillId, us]))

    // Get all evidence for this user
    const evidence = await prisma.evidence.findMany({
        where: { userId },
    })

    // Group evidence by skillId
    const evidenceBySkill = new Map<string, typeof evidence>()
    for (const e of evidence) {
        const existing = evidenceBySkill.get(e.skillId) || []
        existing.push(e)
        evidenceBySkill.set(e.skillId, existing)
    }

    // Compute status for each requirement
    const results: SkillGapResult[] = requirements.map((req: any) => {
        const hasUserSkill = userSkillMap.has(req.skillId)
        const skillEvidence = evidenceBySkill.get(req.skillId) || []
        const evidenceLevel = computeEvidenceLevel(skillEvidence)

        const { status, explanation } = computeSkillStatus({
            hasUserSkill,
            evidenceLevel,
            importance: req.importance,
        })

        return {
            skillId: req.skillId,
            skillName: req.skill.name,
            category: req.skill.category,
            status,
            explanation,
            evidenceLevel,
            importance: req.importance,
            requirementType: req.requirementType,
        }
    })

    return results
}
