'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface DashboardData {
    summary: {
        totalTargets: number
        totalSkills: number
        totalEvidence: number
    }
    targets: Array<{
        id: string
        title: string
        company: string | null
        requirementCount: number
        latestReadiness: number | null
        scores: {
            overallReadiness: number
            skillCoverage: number
            evidenceStrength: number
            portfolioStrength: number
            productionReadiness: number
            jobMatch: number
        } | null
    }>
    recentJobs: Array<{
        id: string
        type: string
        status: string
        createdAt: string
    }>
}

function ScoreRing({ value, size = 120, label }: { value: number; size?: number; label: string }) {
    const radius = (size - 12) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference * (1 - value / 100)
    const color = value >= 70 ? 'var(--status-strong)' : value >= 40 ? 'var(--status-partial)' : 'var(--status-missing)'

    return (
        <div style={{ textAlign: 'center' }}>
            <div className="score-ring" style={{ width: size, height: size }}>
                <svg width={size} height={size}>
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-primary)" strokeWidth="8" />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                    />
                </svg>
                <span className="score-ring-value" style={{ color, WebkitTextFillColor: color, background: 'none', WebkitBackgroundClip: 'unset' }}>{value}</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
        </div>
    )
}

export default function DashboardPage() {
    const { data: session } = useSession()
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchDashboard = useCallback(async () => {
        try {
            const res = await fetch('/api/dashboard')
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch {
            // Ignore fetch errors for dashboard
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDashboard()
    }, [fetchDashboard])

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }} />
                    <div className="skeleton" style={{ width: '300px', height: '20px' }} />
                </div>
                <div className="grid-stats">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton" style={{ height: '120px' }} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    Welcome back, {session?.user?.name || 'there'} 👋
                </h1>
                <p className="page-description">
                    Here&apos;s your career readiness overview
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid-stats" style={{ marginBottom: '32px' }}>
                {[
                    { label: 'Active Targets', value: data?.summary.totalTargets || 0, icon: '🎯', color: 'var(--accent-primary)' },
                    { label: 'Skills Tracked', value: data?.summary.totalSkills || 0, icon: '⚡', color: 'var(--accent-secondary)' },
                    { label: 'Evidence Items', value: data?.summary.totalEvidence || 0, icon: '📋', color: 'var(--accent-success)' },
                ].map((stat, i) => (
                    <div key={i} className="card animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                fontSize: '28px',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `${stat.color}15`,
                                borderRadius: 'var(--radius-md)',
                            }}>{stat.icon}</div>
                            <div>
                                <div style={{ fontSize: '28px', fontWeight: 700 }}>{stat.value}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Targets Overview */}
            {data?.targets && data.targets.length > 0 ? (
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Your Targets</h2>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {data.targets.map((target, i) => (
                            <a
                                key={target.id}
                                href={`/dashboard/targets/${target.id}`}
                                className="card animate-fade-in"
                                style={{
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    animationDelay: `${i * 100}ms`,
                                }}
                                onClick={(e) => {
                                    e.preventDefault()
                                    window.location.href = `/dashboard/targets/${target.id}`
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                                            {target.title}
                                        </h3>
                                        {target.company && (
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                {target.company}
                                            </p>
                                        )}
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <span className="badge badge-info">{target.requirementCount} skills</span>
                                        </div>
                                    </div>
                                    {target.scores && (
                                        <ScoreRing value={target.scores.overallReadiness} size={80} label="Readiness" />
                                    )}
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon" style={{ fontSize: '48px' }}>🎯</div>
                        <h3 className="empty-state-title">No targets yet</h3>
                        <p className="empty-state-text">
                            Add a target job to get started with your skill gap analysis
                        </p>
                        <a href="/dashboard/targets" className="btn btn-primary">
                            Add Your First Target
                        </a>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            {data?.recentJobs && data.recentJobs.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Recent Activity</h2>
                    <div className="card">
                        {data.recentJobs.map((job) => (
                            <div key={job.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 0',
                                borderBottom: '1px solid var(--border-primary)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '16px' }}>
                                        {job.type === 'analyze_target' ? '🎯' : job.type === 'extract_resume' ? '📄' : job.type === 'github_sync' ? '🔗' : '🗺️'}
                                    </span>
                                    <span style={{ fontSize: '14px' }}>
                                        {job.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                    </span>
                                </div>
                                <span className={`badge ${job.status === 'complete' ? 'badge-strong' : job.status === 'failed' ? 'badge-missing' : 'badge-partial'}`}>
                                    {job.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
