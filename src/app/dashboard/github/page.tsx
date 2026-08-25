'use client'

import { useState, useEffect, useCallback } from 'react'

interface Repository {
    id: string
    name: string
    fullName: string | null
    url: string
    description: string | null
    language: string | null
    stars: number
    forks: number
    hasDockerfile: boolean
    hasCiCd: boolean
    hasTests: boolean
    hasReadme: boolean
    lastActivity: string | null
    lastSyncedAt: string | null
}

export default function GitHubPage() {
    const [connected, setConnected] = useState(false)
    const [githubUsername, setGithubUsername] = useState<string | null>(null)
    const [repos, setRepos] = useState<Repository[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [syncError, setSyncError] = useState('')

    const fetchGithub = useCallback(async () => {
        try {
            const res = await fetch('/api/github')
            if (res.ok) {
                const data = await res.json()
                setConnected(data.connected)
                setGithubUsername(data.githubUsername)
                setRepos(data.repositories || [])
            }
        } catch { /* ignore */ } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchGithub() }, [fetchGithub])

    const handleSync = async () => {
        setSyncing(true)
        setSyncError('')
        try {
            const res = await fetch('/api/github', { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                // Poll for completion
                for (let i = 0; i < 60; i++) {
                    await new Promise((resolve) => setTimeout(resolve, 3000))
                    try {
                        const jobRes = await fetch(`/api/jobs/${data.jobId}`)
                        if (jobRes.ok) {
                            const jobData = await jobRes.json()
                            if (jobData.job.status === 'complete') {
                                fetchGithub()
                                setSyncing(false)
                                return
                            }
                            if (jobData.job.status === 'failed') {
                                setSyncError(jobData.job.error || 'Sync failed')
                                setSyncing(false)
                                return
                            }
                        }
                    } catch { /* keep polling */ }
                }
                setSyncError('Sync timed out')
            } else {
                const data = await res.json()
                setSyncError(data.error?.message || 'Sync failed')
            }
        } catch {
            setSyncError('Network error')
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">GitHub Integration</h1>
                    <p className="page-description">
                        Sync your repositories to automatically detect skills and create evidence
                    </p>
                </div>
                {connected && (
                    <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
                        {syncing ? <><span className="spinner" /> Syncing...</> : '🔄 Sync Repositories'}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: '200px' }} />
            ) : !connected ? (
                <div className="card">
                    <div className="empty-state">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
                        <h3 className="empty-state-title">GitHub Not Connected</h3>
                        <p className="empty-state-text">
                            Connect your GitHub account to automatically scan your repositories for technology signals and create evidence.
                            Set up GitHub OAuth in your environment variables to enable this feature.
                        </p>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-full)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                            }}>🐙</div>
                            <div>
                                <div style={{ fontWeight: 600 }}>Connected as {githubUsername}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {repos.length} repositories tracked
                                </div>
                            </div>
                        </div>
                    </div>

                    {syncError && <p className="error-text" style={{ marginBottom: '16px' }}>{syncError}</p>}

                    <div style={{ display: 'grid', gap: '12px' }}>
                        {repos.map((repo) => (
                            <div key={repo.id} className="card" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div>
                                        <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '15px', fontWeight: 600 }}>
                                            {repo.name}
                                        </a>
                                        {repo.description && (
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                {repo.description}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                                            {repo.language && <span className="badge badge-primary">{repo.language}</span>}
                                            {repo.hasTests && <span className="badge badge-strong">Tests ✓</span>}
                                            {repo.hasCiCd && <span className="badge badge-strong">CI/CD ✓</span>}
                                            {repo.hasDockerfile && <span className="badge badge-strong">Docker ✓</span>}
                                            {repo.hasReadme && <span className="badge badge-info">README</span>}
                                            {repo.stars > 0 && <span className="badge badge-partial">⭐ {repo.stars}</span>}
                                        </div>
                                    </div>
                                    {repo.lastActivity && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {new Date(repo.lastActivity).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
