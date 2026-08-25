import Anthropic from '@anthropic-ai/sdk'
import { ExternalServiceError } from '@/lib/errors'
import {
    type AIProvider,
    type JobRequirementOutput,
    type ResumeProfileOutput,
    type RoadmapOutput,
    type ProjectIdeasOutput,
    type RoadmapContext,
    type ProjectContext,
    jobRequirementsOutputSchema,
    resumeProfileOutputSchema,
    roadmapOutputSchema,
    projectIdeasOutputSchema,
} from '../provider'

const JOB_REQUIREMENTS_PROMPT = `You are a job description analyzer. Extract all required and preferred skills, technologies, and qualifications from the following job description.

For each skill/technology, determine:
- skill: the name of the skill or technology
- category: one of "programming_language", "framework", "database", "cloud", "devops", "testing", "architecture", "soft_skill", "other"
- importance: "required" or "preferred"
- requirementType: "technical", "soft", "experience", or "certification"
- seniorityIndicator: any seniority level mentioned (e.g., "junior", "senior", "3+ years")

Include ALL skills mentioned, even uncommon ones. Do not drop or ignore any. Unmapped or unusual technologies should still be included.

Respond with ONLY valid JSON in this exact format:
{"requirements": [{"skill": "...", "category": "...", "importance": "...", "requirementType": "...", "seniorityIndicator": "..."}]}

Job Description:
`

const RESUME_PROFILE_PROMPT = `You are a resume analyzer. Extract skills, projects, education, certifications, and experience from the following resume text.

For skills, determine the category: "programming_language", "framework", "database", "cloud", "devops", "testing", "architecture", "soft_skill", or "other".

Extract ONLY what is explicitly stated in the resume. Do NOT invent or hallucinate skills, projects, or experience that are not in the text.

Respond with ONLY valid JSON in this exact format:
{"skills": [{"name": "...", "category": "...", "proficiency": "..."}], "projects": [{"title": "...", "description": "...", "technologies": ["..."], "url": "..."}], "education": ["..."], "certifications": ["..."], "experience": [{"title": "...", "company": "...", "duration": "...", "description": "..."}]}

Resume Text:
`

const ROADMAP_PROMPT = `You are a career development advisor. Generate a personalized learning roadmap based on the skill gap analysis below.

For each skill that needs improvement, create a roadmap item with:
- skill: the skill name
- whyItMatters: why this skill matters for the target role
- currentStatus: the current skill status
- missingEvidence: what evidence is missing
- task: a specific, actionable task to close the gap
- projectIdea: a project idea that demonstrates this skill (optional)
- definitionOfDone: a concrete, checkable criterion for completion (REQUIRED, must not be empty)
- estimatedHours: estimated hours to complete
- milestone: a milestone name this task belongs to

Every item MUST have a non-empty definitionOfDone.

Respond with ONLY valid JSON:
{"items": [{"skill": "...", "whyItMatters": "...", "currentStatus": "...", "missingEvidence": "...", "task": "...", "projectIdea": "...", "definitionOfDone": "...", "estimatedHours": 10, "milestone": "..."}]}

Context:
`

const PROJECT_IDEAS_PROMPT = `You are a project idea generator for career development. Generate project ideas that cover MULTIPLE skill gaps simultaneously.

Prefer projects that:
- Cover 3 or more gap skills when possible
- Are realistic to build within the estimated time
- Would produce strong portfolio evidence
- Include deployment, testing, and CI/CD when relevant

Each project should include:
- title: project name
- description: what to build
- skillsCovered: array of skill names this project covers
- skillCoveragePercent: percentage of gap skills covered (0-100)
- difficulty: "beginner", "intermediate", or "advanced"
- estimatedHours: realistic time estimate
- portfolioValue: how impressive this is in a portfolio (0-100)
- evidenceStrengthProjected: projected evidence strength gain (0-100)

Respond with ONLY valid JSON:
{"projects": [{"title": "...", "description": "...", "skillsCovered": ["..."], "skillCoveragePercent": 50, "difficulty": "intermediate", "estimatedHours": 40, "portfolioValue": 80, "evidenceStrengthProjected": 70}]}

Gap Skills and Context:
`

export class ClaudeAdapter implements AIProvider {
    private client: Anthropic

    constructor() {
        const apiKey = process.env.AI_PROVIDER_API_KEY
        if (!apiKey) {
            throw new Error('AI_PROVIDER_API_KEY environment variable is required')
        }
        this.client = new Anthropic({ apiKey })
    }

    private async callClaude(prompt: string, retryCount = 0): Promise<string> {
        try {
            const response = await this.client.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }],
            })

            const textBlock = response.content.find((c) => c.type === 'text')
            if (!textBlock || textBlock.type !== 'text') {
                throw new Error('No text response from Claude')
            }

            return textBlock.text
        } catch (error) {
            if (retryCount < 1) {
                return this.callClaude(
                    prompt + '\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanation.',
                    retryCount + 1
                )
            }
            throw new ExternalServiceError(
                `AI provider error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
        }
    }

    private parseJSON<T>(text: string, schema: { parse: (data: unknown) => T }): T {
        // Clean up common LLM response issues
        let cleaned = text.trim()
        // Remove markdown code blocks if present
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }

        try {
            const parsed = JSON.parse(cleaned)
            return schema.parse(parsed)
        } catch {
            throw new ExternalServiceError('AI returned invalid JSON response')
        }
    }

    async extractJobRequirements(jobDescription: string): Promise<JobRequirementOutput> {
        const response = await this.callClaude(JOB_REQUIREMENTS_PROMPT + jobDescription)
        return this.parseJSON(response, jobRequirementsOutputSchema)
    }

    async extractResumeProfile(resumeText: string): Promise<ResumeProfileOutput> {
        const response = await this.callClaude(RESUME_PROFILE_PROMPT + resumeText)
        return this.parseJSON(response, resumeProfileOutputSchema)
    }

    async generateRoadmap(context: RoadmapContext): Promise<RoadmapOutput> {
        const contextStr = JSON.stringify(context, null, 2)
        const response = await this.callClaude(ROADMAP_PROMPT + contextStr)
        return this.parseJSON(response, roadmapOutputSchema)
    }

    async generateProjectIdeas(context: ProjectContext): Promise<ProjectIdeasOutput> {
        const contextStr = JSON.stringify(context, null, 2)
        const response = await this.callClaude(PROJECT_IDEAS_PROMPT + contextStr)
        return this.parseJSON(response, projectIdeasOutputSchema)
    }
}

// Singleton instance with lazy initialization
let aiProviderInstance: AIProvider | null = null

export function getAIProvider(): AIProvider {
    if (!aiProviderInstance) {
        aiProviderInstance = new ClaudeAdapter()
    }
    return aiProviderInstance
}
