import { prisma } from '@/lib/db'
import { normalizeSkill } from '@/lib/skillNormalization'
import { evidenceRepository } from '@/repositories/evidenceRepository'

/**
 * GitHub Sync Service
 * Handles repository scanning and evidence detection
 */

const GITHUB_API_BASE = 'https://api.github.com'
const SYNC_COOLDOWN_MS = 15 * 60 * 1000 // 15 minutes

interface GitHubRepo {
    id: number
    name: string
    full_name: string
    html_url: string
    description: string | null
    language: string | null
    stargazers_count: number
    forks_count: number
    pushed_at: string | null
}

interface GitHubFile {
    name: string
    type: string
    path: string
}

/**
 * Check if sync is within cooldown period
 */
export async function checkSyncCooldown(userId: string): Promise<{
    allowed: boolean
    retryAfter?: number
}> {
    const lastSync = await prisma.gitHubRepository.findFirst({
        where: { userId },
        orderBy: { lastSyncedAt: 'desc' },
    })

    if (!lastSync?.lastSyncedAt) return { allowed: true }

    const elapsed = Date.now() - lastSync.lastSyncedAt.getTime()
    if (elapsed < SYNC_COOLDOWN_MS) {
        return {
            allowed: false,
            retryAfter: Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000),
        }
    }

    return { allowed: true }
}

/**
 * Fetch repositories from GitHub API
 */
export async function fetchRepositories(
    accessToken: string
): Promise<GitHubRepo[]> {
    const response = await fetch(`${GITHUB_API_BASE}/user/repos?per_page=100&sort=pushed&type=public`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
        },
    })

    if (response.status === 401) {
        throw new Error('GITHUB_TOKEN_INVALID')
    }

    if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
        throw new Error('GITHUB_RATE_LIMITED')
    }

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
    }

    return response.json()
}

/**
 * Fetch top-level file listing for a repo (scan-depth limited)
 */
async function fetchRepoFiles(
    accessToken: string,
    fullName: string
): Promise<GitHubFile[]> {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/repos/${fullName}/contents`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        })

        if (!response.ok) return []
        return response.json()
    } catch {
        return []
    }
}

/**
 * Check for .github/workflows directory
 */
async function checkCiCd(
    accessToken: string,
    fullName: string
): Promise<boolean> {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/repos/${fullName}/contents/.github/workflows`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json',
            },
        })
        return response.ok
    } catch {
        return false
    }
}

/**
 * Detect technologies and signals from repo files
 */
export function detectSignals(files: GitHubFile[]): {
    hasDockerfile: boolean
    hasCiCd: boolean
    hasTests: boolean
    hasReadme: boolean
    detectedSkills: string[]
} {
    const fileNames = files.map((f) => f.name.toLowerCase())
    const hasDockerfile = fileNames.some((f) => f === 'dockerfile' || f === 'docker-compose.yml' || f === 'docker-compose.yaml')
    const hasTests = fileNames.some((f) =>
        f.includes('test') || f.includes('spec') || f === '__tests__' || f === 'tests' || f === 'test'
    )
    const hasReadme = fileNames.some((f) => f.startsWith('readme'))

    const detectedSkills: string[] = []

    // Detect from files
    if (hasDockerfile) detectedSkills.push('Docker')
    if (fileNames.includes('requirements.txt') || fileNames.includes('pyproject.toml') || fileNames.includes('setup.py')) {
        detectedSkills.push('Python')
    }
    if (fileNames.includes('package.json')) detectedSkills.push('JavaScript', 'Node.js')
    if (fileNames.includes('go.mod')) detectedSkills.push('Go')
    if (fileNames.includes('cargo.toml')) detectedSkills.push('Rust')
    if (fileNames.includes('gemfile')) detectedSkills.push('Ruby')
    if (fileNames.includes('pom.xml') || fileNames.includes('build.gradle')) detectedSkills.push('Java')
    if (fileNames.includes('tsconfig.json')) detectedSkills.push('TypeScript')
    if (fileNames.includes('.env') || fileNames.includes('.env.example')) detectedSkills.push('Environment Configuration')
    if (fileNames.includes('makefile')) detectedSkills.push('Build Tools')
    if (fileNames.includes('terraform.tf') || fileNames.includes('main.tf')) detectedSkills.push('Terraform')
    if (fileNames.includes('kubernetes') || fileNames.includes('k8s')) detectedSkills.push('Kubernetes')
    if (hasTests) detectedSkills.push('Testing')

    return { hasDockerfile, hasCiCd: false, hasTests, hasReadme, detectedSkills }
}

/**
 * Full sync a user's GitHub repositories
 */
export async function syncGitHubRepositories(
    userId: string,
    accessToken: string
): Promise<{ reposProcessed: number; evidenceCreated: number }> {
    const repos = await fetchRepositories(accessToken)
    let evidenceCreated = 0

    for (const repo of repos) {
        // Fetch top-level files (scan-depth limited)
        const files = await fetchRepoFiles(accessToken, repo.full_name)
        const hasCiCd = await checkCiCd(accessToken, repo.full_name)
        const signals = detectSignals(files)
        signals.hasCiCd = hasCiCd

        // README length check
        let readmeLength = 0
        const readmeFile = files.find((f) => f.name.toLowerCase().startsWith('readme'))
        if (readmeFile) {
            try {
                const readmeResponse = await fetch(`${GITHUB_API_BASE}/repos/${repo.full_name}/readme`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                })
                if (readmeResponse.ok) {
                    const readmeData = await readmeResponse.json()
                    readmeLength = readmeData.size || 0
                }
            } catch { /* ignore */ }
        }

        // Upsert repository record
        const repoRecord = await prisma.gitHubRepository.upsert({
            where: {
                userId_githubId: { userId, githubId: String(repo.id) },
            },
            create: {
                userId,
                githubId: String(repo.id),
                name: repo.name,
                fullName: repo.full_name,
                url: repo.html_url,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                hasDockerfile: signals.hasDockerfile,
                hasCiCd: signals.hasCiCd,
                hasTests: signals.hasTests,
                hasReadme: signals.hasReadme,
                readmeLength,
                lastActivity: repo.pushed_at ? new Date(repo.pushed_at) : null,
                lastSyncedAt: new Date(),
            },
            update: {
                name: repo.name,
                fullName: repo.full_name,
                url: repo.html_url,
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                hasDockerfile: signals.hasDockerfile,
                hasCiCd: signals.hasCiCd,
                hasTests: signals.hasTests,
                hasReadme: signals.hasReadme,
                readmeLength,
                lastActivity: repo.pushed_at ? new Date(repo.pushed_at) : null,
                lastSyncedAt: new Date(),
            },
        })

        // Create evidence records for detected skills
        for (const skillName of signals.detectedSkills) {
            try {
                const normalized = await normalizeSkill(skillName)

                // Determine evidence strength based on signals
                let strength = 2 // Base: present in a project
                if (signals.hasTests) strength = Math.max(strength, 3)
                if (signals.hasCiCd || signals.hasDockerfile) strength = Math.max(strength, 4)
                // Cap at 4 for GitHub-only evidence
                strength = Math.min(strength, 4)

                await evidenceRepository.upsertForSkill({
                    userId,
                    skillId: normalized.skillId,
                    sourceType: 'github',
                    sourceUrl: repo.html_url,
                    description: `Detected in repository "${repo.name}"${signals.hasTests ? ' (with tests)' : ''}${signals.hasCiCd ? ' (with CI/CD)' : ''}${signals.hasDockerfile ? ' (with Docker)' : ''}`,
                    strength,
                    repositoryId: repoRecord.id,
                })

                // Also create/update UserSkill if not exists
                await prisma.userSkill.upsert({
                    where: {
                        userId_skillId: { userId, skillId: normalized.skillId },
                    },
                    create: {
                        userId,
                        skillId: normalized.skillId,
                        source: 'github',
                        confidence: strength * 20,
                    },
                    update: {
                        // Don't overwrite manually set skills
                    },
                })

                evidenceCreated++
            } catch {
                // Skip skills that can't be normalized
            }
        }
    }

    return { reposProcessed: repos.length, evidenceCreated }
}
