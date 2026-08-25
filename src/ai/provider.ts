import { z } from 'zod'

/**
 * AIProvider interface - abstracts LLM calls behind a consistent interface
 * so the concrete provider (Claude, OpenAI, etc.) can be swapped.
 */

// --- Output Schemas ---

export const jobRequirementSchema = z.object({
    skill: z.string(),
    category: z.string(),
    importance: z.enum(['required', 'preferred']),
    requirementType: z.string(),
    seniorityIndicator: z.string().optional(),
})

export const jobRequirementsOutputSchema = z.object({
    requirements: z.array(jobRequirementSchema),
})

export const resumeSkillSchema = z.object({
    name: z.string(),
    category: z.string(),
    proficiency: z.string().optional(),
    source: z.string().optional(),
})

export const resumeProjectSchema = z.object({
    title: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    url: z.string().optional(),
})

export const resumeProfileOutputSchema = z.object({
    skills: z.array(resumeSkillSchema),
    projects: z.array(resumeProjectSchema),
    education: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
    experience: z.array(z.object({
        title: z.string(),
        company: z.string(),
        duration: z.string().optional(),
        description: z.string().optional(),
    })).optional(),
})

export const roadmapItemSchema = z.object({
    skill: z.string(),
    whyItMatters: z.string(),
    currentStatus: z.string(),
    missingEvidence: z.string(),
    task: z.string(),
    projectIdea: z.string().optional(),
    definitionOfDone: z.string(),
    estimatedHours: z.number().optional(),
    milestone: z.string().optional(),
})

export const roadmapOutputSchema = z.object({
    items: z.array(roadmapItemSchema),
})

export const projectIdeaSchema = z.object({
    title: z.string(),
    description: z.string(),
    skillsCovered: z.array(z.string()),
    skillCoveragePercent: z.number(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    estimatedHours: z.number(),
    portfolioValue: z.number(), // 0-100
    evidenceStrengthProjected: z.number(), // 0-100
})

export const projectIdeasOutputSchema = z.object({
    projects: z.array(projectIdeaSchema),
})

// --- Type Exports ---
export type JobRequirementOutput = z.infer<typeof jobRequirementsOutputSchema>
export type ResumeProfileOutput = z.infer<typeof resumeProfileOutputSchema>
export type RoadmapOutput = z.infer<typeof roadmapOutputSchema>
export type ProjectIdeasOutput = z.infer<typeof projectIdeasOutputSchema>

// --- Interface ---
export interface AIProvider {
    extractJobRequirements(jobDescription: string): Promise<JobRequirementOutput>
    extractResumeProfile(resumeText: string): Promise<ResumeProfileOutput>
    generateRoadmap(context: RoadmapContext): Promise<RoadmapOutput>
    generateProjectIdeas(context: ProjectContext): Promise<ProjectIdeasOutput>
}

export interface RoadmapContext {
    targetTitle: string
    targetCompany?: string
    skills: Array<{
        name: string
        status: string
        evidenceLevel: number
        importance: string
    }>
    deadline?: string
}

export interface ProjectContext {
    gapSkills: Array<{
        name: string
        priority: number
        importance: string
    }>
    existingSkills: string[]
    availableHours?: number
}
