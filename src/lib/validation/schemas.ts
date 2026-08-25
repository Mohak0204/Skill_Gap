import { z } from 'zod'

// Shared validation schemas used across routes and client

export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const idSchema = z.string().min(1, 'ID is required')

export const signUpSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    name: z.string().min(1, 'Name is required').max(100),
})

export const signInSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
})

export const createTargetSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    company: z.string().max(200).optional(),
    jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
    experienceLevel: z.string().optional(),
    deadline: z.string().datetime().optional(),
})

export const updateTargetSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    company: z.string().max(200).optional(),
    jobDescription: z.string().min(50).optional(),
    experienceLevel: z.string().optional(),
    deadline: z.string().datetime().optional().nullable(),
})

export const addUserSkillSchema = z.object({
    skillId: z.string().min(1, 'Skill ID is required'),
    confidence: z.number().int().min(0).max(100).default(50),
})

export const addEvidenceSchema = z.object({
    skillId: z.string().min(1, 'Skill ID is required'),
    sourceType: z.enum(['github', 'resume', 'manual']),
    sourceUrl: z.string().url().optional(),
    description: z.string().min(1, 'Description is required'),
})

export const updateRoadmapItemSchema = z.object({
    status: z.enum(['not_started', 'in_progress', 'blocked', 'completed', 'verified']),
    selfReported: z.boolean().optional(),
})

export const confirmResumeSchema = z.object({
    skillIds: z.array(z.string()),
    projectIds: z.array(z.string()),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type CreateTargetInput = z.infer<typeof createTargetSchema>
export type UpdateTargetInput = z.infer<typeof updateTargetSchema>
export type AddUserSkillInput = z.infer<typeof addUserSkillSchema>
export type AddEvidenceInput = z.infer<typeof addEvidenceSchema>
export type UpdateRoadmapItemInput = z.infer<typeof updateRoadmapItemSchema>
export type ConfirmResumeInput = z.infer<typeof confirmResumeSchema>
