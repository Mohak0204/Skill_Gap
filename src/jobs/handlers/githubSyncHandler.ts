import { registerJobHandler } from '../jobRunner'
import { syncGitHubRepositories } from '@/services/githubSyncService'
import { decrypt } from '@/lib/encryption'
import { prisma } from '@/lib/db'

/**
 * GitHub Sync Handler
 * Syncs repositories and creates evidence records
 */
registerJobHandler('github_sync', async (payload, userId) => {
    // Get encrypted token
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { githubAccessToken: true, githubTokenIv: true },
    })

    if (!user?.githubAccessToken || !user?.githubTokenIv) {
        throw new Error('GitHub not connected. Please link your GitHub account first.')
    }

    let accessToken: string
    try {
        accessToken = decrypt(user.githubAccessToken, user.githubTokenIv)
    } catch {
        throw new Error('GITHUB_TOKEN_INVALID')
    }

    try {
        const result = await syncGitHubRepositories(userId, accessToken)
        return result
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'GITHUB_TOKEN_INVALID') {
                // Mark token as needing reconnection
                await prisma.user.update({
                    where: { id: userId },
                    data: { githubAccessToken: null, githubTokenIv: null },
                })
                throw new Error('GitHub token expired or revoked. Please reconnect your GitHub account.')
            }
            if (error.message === 'GITHUB_RATE_LIMITED') {
                throw new Error('GitHub API rate limit exceeded. Please try again later.')
            }
        }
        throw error
    }
})
