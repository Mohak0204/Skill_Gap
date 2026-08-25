import { prisma } from '@/lib/db'
import { normalizeSkill } from '@/lib/skillNormalization'
import { getAIProvider } from '@/ai/adapters/claudeAdapter'
import { registerJobHandler } from '../jobRunner'

/**
 * Analyze Target Job Description Handler
 * Extracts skills/requirements from job description via AI, with deterministic fallback
 */
registerJobHandler('analyze_target', async (payload, userId) => {
    const targetId = payload.targetId as string

    const target = await prisma.target.findFirst({
        where: { id: targetId, userId },
    })

    if (!target) throw new Error('Target not found')

    let requirements: Array<{
        skill: string
        category: string
        importance: string
        requirementType: string
        seniorityIndicator?: string
    }> = []

    try {
        const aiProvider = getAIProvider()
        const result = await aiProvider.extractJobRequirements(target.jobDescription)
        requirements = result.requirements
    } catch {
        // Deterministic fallback: keyword matching against skill table
        requirements = await keywordFallback(target.jobDescription)
    }

    // Normalize and upsert requirements
    let created = 0
    for (const req of requirements) {
        try {
            const normalized = await normalizeSkill(req.skill)

            await prisma.jobRequirement.upsert({
                where: {
                    targetId_skillId: {
                        targetId,
                        skillId: normalized.skillId,
                    },
                },
                create: {
                    targetId,
                    skillId: normalized.skillId,
                    importance: req.importance || 'required',
                    requirementType: req.requirementType || 'technical',
                    seniorityIndicator: req.seniorityIndicator,
                },
                update: {
                    importance: req.importance || 'required',
                    requirementType: req.requirementType || 'technical',
                    seniorityIndicator: req.seniorityIndicator,
                },
            })
            created++
        } catch {
            // Skip skills that fail normalization/insertion
        }
    }

    return { requirementsCreated: created }
})

/**
 * Deterministic fallback: search job description for known skills
 */
async function keywordFallback(jobDescription: string) {
    const skills = await prisma.skill.findMany()
    const jdLower = jobDescription.toLowerCase()
    const matched: Array<{
        skill: string
        category: string
        importance: string
        requirementType: string
    }> = []

    for (const skill of skills) {
        const searchTerms = [skill.name.toLowerCase()]
        if (skill.aliases) {
            searchTerms.push(...skill.aliases.split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean))
        }

        for (const term of searchTerms) {
            if (term && jdLower.includes(term)) {
                matched.push({
                    skill: skill.name,
                    category: skill.category,
                    importance: 'required',
                    requirementType: 'technical',
                })
                break
            }
        }
    }

    return matched
}
