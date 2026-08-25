import { prisma } from '@/lib/db'
import { normalizeSkill } from '@/lib/skillNormalization'
import { getAIProvider } from '@/ai/adapters/claudeAdapter'
import { registerJobHandler } from '../jobRunner'

/**
 * Extract Resume Handler  
 * Parses resume text via AI, stores as pending extraction for user review
 */
registerJobHandler('extract_resume', async (payload, userId) => {
    const resumeText = payload.resumeText as string

    if (!resumeText || resumeText.trim().length < 20) {
        throw new Error('Resume text is too short for meaningful extraction')
    }

    let result
    try {
        const aiProvider = getAIProvider()
        result = await aiProvider.extractResumeProfile(resumeText)
    } catch {
        // Return a minimal extraction on AI failure
        result = { skills: [], projects: [] }
    }

    // Store pending extraction data (not saved to profile until user confirms)
    // Using a temporary storage approach via job result
    return {
        skills: result.skills.map((s) => ({
            name: s.name,
            category: s.category,
            proficiency: s.proficiency,
        })),
        projects: result.projects.map((p) => ({
            title: p.title,
            description: p.description,
            technologies: p.technologies,
            url: p.url,
        })),
        education: result.education || [],
        certifications: result.certifications || [],
        experience: result.experience || [],
    }
})

/**
 * Confirm and merge resume extraction into user profile
 */
export async function confirmResumeExtraction(
    userId: string,
    jobResult: {
        skills: Array<{ name: string; category: string; proficiency?: string }>
        projects: Array<{ title: string; description: string; technologies: string[]; url?: string }>
    },
    selectedSkillNames: string[],
    selectedProjectTitles: string[]
) {
    let skillsCreated = 0
    let projectsCreated = 0

    // Process selected skills
    for (const skill of jobResult.skills) {
        if (!selectedSkillNames.includes(skill.name)) continue

        try {
            const normalized = await normalizeSkill(skill.name)

            // Upsert UserSkill with source=resume (don't overwrite manual entries)
            await prisma.userSkill.upsert({
                where: {
                    userId_skillId: { userId, skillId: normalized.skillId },
                },
                create: {
                    userId,
                    skillId: normalized.skillId,
                    source: 'resume',
                    confidence: 50,
                },
                update: {
                    // Only update if current source is 'resume' (preserve manual entries)
                },
            })

            // Create evidence record
            await prisma.evidence.create({
                data: {
                    userId,
                    skillId: normalized.skillId,
                    sourceType: 'resume',
                    description: `Mentioned in resume${skill.proficiency ? ` (${skill.proficiency})` : ''}`,
                    strength: 1,
                },
            })

            skillsCreated++
        } catch {
            // Skip failed normalizations
        }
    }

    // Process selected projects
    for (const project of jobResult.projects) {
        if (!selectedProjectTitles.includes(project.title)) continue

        const createdProject = await prisma.project.create({
            data: {
                userId,
                title: project.title,
                description: project.description,
                repositoryUrl: project.url,
                status: 'completed',
            },
        })

        // Link project skills
        for (const tech of project.technologies) {
            try {
                const normalized = await normalizeSkill(tech)
                await prisma.projectSkill.create({
                    data: {
                        projectId: createdProject.id,
                        skillId: normalized.skillId,
                        relevance: 70,
                    },
                })

                // Create evidence from project
                await prisma.evidence.create({
                    data: {
                        userId,
                        skillId: normalized.skillId,
                        sourceType: 'resume',
                        description: `Used in project "${project.title}"`,
                        strength: 2,
                        projectId: createdProject.id,
                    },
                })
            } catch {
                // Skip failed normalizations
            }
        }

        projectsCreated++
    }

    return { skillsCreated, projectsCreated }
}
