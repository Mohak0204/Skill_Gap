import { prisma } from '@/lib/db'
import { analyzeSkillGap, type SkillGapResult } from './skillGapEngine'

/**
 * Scoring Service - Computes readiness scores per PRD §5.10
 * 
 * MVP Readiness = Skill Coverage × 40% + Evidence Strength × 30% + Portfolio Strength × 20% + Production Readiness × 10%
 * 
 * Job Match is a separate metric.
 * Interview Readiness is post-MVP and NOT included.
 */

export interface ReadinessScores {
    jobMatch: number          // 0-100
    skillCoverage: number     // 0-100
    evidenceStrength: number  // 0-100
    portfolioStrength: number // 0-100
    productionReadiness: number // 0-100
    overallReadiness: number  // 0-100 (weighted formula)
    breakdown: {
        formula: string
        weights: Record<string, number>
        labels: Record<string, string>
    }
}

/**
 * Compute Skill Coverage: % of required skills that are Strong or Partial
 */
export function computeSkillCoverage(gaps: SkillGapResult[]): number {
    const requiredSkills = gaps.filter((g) => g.importance === 'required')
    if (requiredSkills.length === 0) return 0

    const coveredSkills = requiredSkills.filter(
        (g) => g.status === 'strong' || g.status === 'partial'
    )

    return Math.round((coveredSkills.length / requiredSkills.length) * 100)
}

/**
 * Compute Evidence Strength: average evidence level across all skills (scaled to 0-100)
 */
export function computeEvidenceStrength(gaps: SkillGapResult[]): number {
    if (gaps.length === 0) return 0
    const totalLevel = gaps.reduce((sum, g) => sum + g.evidenceLevel, 0)
    return Math.round((totalLevel / (gaps.length * 5)) * 100) // 5 is max evidence level
}

/**
 * Compute Job Match: how many total skills (required + preferred) the user has
 */
export function computeJobMatch(gaps: SkillGapResult[]): number {
    if (gaps.length === 0) return 0
    const matched = gaps.filter(
        (g) => g.status === 'strong' || g.status === 'partial' || g.status === 'claimed_unproven'
    )
    return Math.round((matched.length / gaps.length) * 100)
}

/**
 * Compute Portfolio Strength from portfolio signals
 * MVP: deterministic from available signals
 */
export async function computePortfolioStrength(userId: string): Promise<number> {
    const repos = await prisma.gitHubRepository.findMany({ where: { userId } })
    const projects = await prisma.project.findMany({ where: { userId } })

    if (repos.length === 0 && projects.length === 0) return 0

    let score = 0
    let maxScore = 0

    // GitHub repo signals
    for (const repo of repos) {
        maxScore += 5
        if (repo.hasReadme && repo.readmeLength > 100) score += 1
        if (repo.hasTests) score += 1
        if (repo.hasCiCd) score += 1
        if (repo.hasDockerfile) score += 1
        if (repo.stars > 0) score += 1
    }

    // Project signals
    for (const project of projects) {
        maxScore += 3
        if (project.repositoryUrl) score += 1
        if (project.deploymentUrl) score += 1
        if (project.status === 'completed') score += 1
    }

    if (maxScore === 0) return 0
    return Math.round((score / maxScore) * 100)
}

/**
 * Compute Production Readiness from production-related signals
 */
export async function computeProductionReadiness(userId: string): Promise<number> {
    const repos = await prisma.gitHubRepository.findMany({ where: { userId } })

    if (repos.length === 0) return 0

    let score = 0
    const total = repos.length

    for (const repo of repos) {
        let repoScore = 0
        if (repo.hasDockerfile) repoScore += 25
        if (repo.hasCiCd) repoScore += 25
        if (repo.hasTests) repoScore += 25
        if (repo.hasReadme && repo.readmeLength > 200) repoScore += 25
        score += repoScore
    }

    return Math.round(score / total)
}

/**
 * Compute all readiness scores for a target
 */
export async function computeReadinessScores(
    userId: string,
    targetId: string
): Promise<ReadinessScores> {
    const gaps = await analyzeSkillGap(userId, targetId)

    const jobMatch = computeJobMatch(gaps)
    const skillCoverage = computeSkillCoverage(gaps)
    const evidenceStrength = computeEvidenceStrength(gaps)
    const portfolioStrength = await computePortfolioStrength(userId)
    const productionReadiness = await computeProductionReadiness(userId)

    // MVP Readiness formula per PRD §5.10
    const overallReadiness = Math.round(
        skillCoverage * 0.40 +
        evidenceStrength * 0.30 +
        portfolioStrength * 0.20 +
        productionReadiness * 0.10
    )

    return {
        jobMatch,
        skillCoverage,
        evidenceStrength,
        portfolioStrength,
        productionReadiness,
        overallReadiness,
        breakdown: {
            formula: 'Readiness = SkillCoverage×0.40 + EvidenceStrength×0.30 + PortfolioStrength×0.20 + ProductionReadiness×0.10',
            weights: {
                skillCoverage: 0.40,
                evidenceStrength: 0.30,
                portfolioStrength: 0.20,
                productionReadiness: 0.10,
            },
            labels: {
                jobMatch: 'Job Match',
                skillCoverage: 'Skill Coverage',
                evidenceStrength: 'Evidence Strength',
                portfolioStrength: 'Portfolio Strength',
                productionReadiness: 'Production Readiness',
                overallReadiness: 'Overall Readiness',
            },
        },
    }
}

/**
 * Save a readiness snapshot for history tracking
 */
export async function saveReadinessSnapshot(
    targetId: string,
    scores: ReadinessScores,
    trigger: string
) {
    return prisma.readinessSnapshot.create({
        data: {
            targetId,
            jobMatch: scores.jobMatch,
            skillCoverage: scores.skillCoverage,
            evidenceStrength: scores.evidenceStrength,
            portfolioStrength: scores.portfolioStrength,
            productionReadiness: scores.productionReadiness,
            overallReadiness: scores.overallReadiness,
            trigger,
        },
    })
}
