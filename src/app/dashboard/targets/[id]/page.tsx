'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface SkillGap {
    skillId: string
    skillName: string
    category: string
    status: string
    explanation: string
    evidenceLevel: number
    importance: string
    requirementType: string
}

interface Scores {
    overallReadiness: number
    skillCoverage: number
    evidenceStrength: number
    portfolioStrength: number
    productionReadiness: number
    jobMatch: number
    breakdown: {
        formula: string
    }
}

interface RoadmapItem {
    id: string
    task: string
    definitionOfDone: string
    whyItMatters: string | null
    status: string
    estimatedHours: number | null
    milestone: string | null
    priority: number
    selfReported: boolean
    skill: { name: string }
}

interface Roadmap {
    id: string
    title: string
    roadmapItems: RoadmapItem[]
}

const statusColors: Record<string, string> = {
    strong: 'badge-strong',
    partial: 'badge-partial',
    claimed_unproven: 'badge-claimed',
    missing: 'badge-missing',
    low_priority: 'badge-low',
}

const statusLabels: Record<string, string> = {
    strong: 'Strong',
    partial: 'Partial',
    claimed_unproven: 'Claimed',
    missing: 'Missing',
    low_priority: 'Low Priority',
}

const itemStatusLabels: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    completed: 'Completed',
    verified: 'Verified',
}

function ScoreBar({ label, value, description }: { label: string; value: number; description?: string }) {
    const color = value >= 70 ? 'progress-fill-success' : value >= 40 ? 'progress-fill-warning' : 'progress-fill-danger'
    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: value >= 70 ? 'var(--status-strong)' : value >= 40 ? 'var(--status-partial)' : 'var(--status-missing)' }}>{value}%</span>
            </div>
            <div className="progress-bar">
                <div className={`progress-fill ${color}`} style={{ width: `${value}%` }} />
            </div>
            {description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{description}</div>}
        </div>
    )
}

export default function TargetDetailPage() {
    const params = useParams()
    const router = useRouter()
    const targetId = params.id as string

    const [target, setTarget] = useState<{ title: string; company: string | null } | null>(null)
    const [gaps, setGaps] = useState<SkillGap[]>([])
    const [scores, setScores] = useState<Scores | null>(null)
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'gaps' | 'scores' | 'roadmap' | 'projects'>('gaps')
    const [generating, setGenerating] = useState(false)

    const [nextAction, setNextAction] = useState<any>(null)
    const [projectIdeas, setProjectIdeas] = useState<any[]>([])

    const fetchAll = useCallback(async () => {
        try {
            const [targetRes, gapsRes, scoresRes, roadmapRes, actionRes] = await Promise.all([
                fetch(`/api/targets/${targetId}`),
                fetch(`/api/targets/${targetId}/gaps`),
                fetch(`/api/targets/${targetId}/scores`),
                fetch(`/api/targets/${targetId}/roadmap`),
                fetch(`/api/targets/${targetId}/next-best-action`),
            ])

            if (targetRes.ok) {
                const d = await targetRes.json()
                setTarget(d.target)
            }
            if (gapsRes.ok) {
                const d = await gapsRes.json()
                setGaps(d.gaps)
            }
            if (scoresRes.ok) {
                const d = await scoresRes.json()
                setScores(d.scores)
            }
            if (roadmapRes.ok) {
                const d = await roadmapRes.json()
                setRoadmap(d.roadmap)
            }
            if (actionRes.ok) {
                const d = await actionRes.json()
                setNextAction(d.action)
            }
        } catch { /* ignore */ } finally {
            setLoading(false)
        }
    }, [targetId])

    useEffect(() => { fetchAll() }, [fetchAll])

    const generateRoadmap = async () => {
        setGenerating(true)
        try {
            const res = await fetch(`/api/targets/${targetId}/roadmap`, { method: 'POST' })
            if (res.ok) {
                const d = await res.json()
                setRoadmap(d.roadmap)
                setTab('roadmap')
                fetchAll()
            }
        } catch { /* ignore */ } finally {
            setGenerating(false)
        }
    }

    const generateProjects = async () => {
        setGenerating(true)
        try {
            const res = await fetch(`/api/targets/${targetId}/projects`, { method: 'POST' })
            if (res.ok) {
                const d = await res.json()
                setProjectIdeas(d.projects)
            }
        } catch { /* ignore */ } finally {
            setGenerating(false)
        }
    }

    const updateItemStatus = async (itemId: string, status: string) => {
        try {
            const res = await fetch(`/api/roadmap-items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, selfReported: true }),
            })
            if (res.ok) {
                fetchAll()
            }
        } catch { /* ignore */ }
    }

    const handleDelete = async () => {
        if (!confirm('Delete this target?')) return
        try {
            const res = await fetch(`/api/targets/${targetId}`, { method: 'DELETE' })
            if (res.ok) router.push('/dashboard/targets')
        } catch { /* ignore */ }
    }

    if (loading) {
        return (
            <div>
                <div className="skeleton" style={{ width: '300px', height: '32px', marginBottom: '16px' }} />
                <div className="skeleton" style={{ width: '100%', height: '200px' }} />
            </div>
        )
    }

    if (!target) {
        return (
            <div className="card">
                <div className="empty-state">
                    <h3 className="empty-state-title">Target not found</h3>
                    <a href="/dashboard/targets" className="btn btn-primary">Back to Targets</a>
                </div>
            </div>
        )
    }

    const gapCounts = gaps.reduce((acc, g) => {
        acc[g.status] = (acc[g.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/targets')} style={{ marginBottom: '8px' }}>
                        ← Back to Targets
                    </button>
                    <h1 className="page-title">{target.title}</h1>
                    {target.company && <p className="page-description">{target.company}</p>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={generateRoadmap} disabled={generating}>
                        {generating ? <span className="spinner" /> : '🗺️ Generate Roadmap'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
                </div>
            </div>

            {/* Next Best Action Banner */}
            {nextAction && (
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>Next Best Action</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, fontSize: '16px' }}>{nextAction.task}</span>
                                <span className="badge badge-primary">{nextAction.skillName}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>💡 {nextAction.whyItMatters}</p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => setTab('roadmap')}>View Roadmap</button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'gaps' ? 'active' : ''}`} onClick={() => setTab('gaps')}>
                    Skill Gaps ({gaps.length})
                </button>
                <button className={`tab ${tab === 'scores' ? 'active' : ''}`} onClick={() => setTab('scores')}>
                    Readiness Scores
                </button>
                <button className={`tab ${tab === 'roadmap' ? 'active' : ''}`} onClick={() => setTab('roadmap')}>
                    Roadmap {roadmap ? `(${roadmap.roadmapItems.length})` : ''}
                </button>
                <button className={`tab ${tab === 'projects' ? 'active' : ''}`} onClick={() => setTab('projects')}>
                    Projects
                </button>
            </div>

            {/* Gaps Tab */}
            {tab === 'gaps' && (
                <div>
                    {/* Status Summary */}
                    <div className="grid-stats" style={{ marginBottom: '24px' }}>
                        {Object.entries(gapCounts).map(([status, count]) => (
                            <div key={status} className="card" style={{ padding: '16px' }}>
                                <span className={`badge ${statusColors[status]}`}>{statusLabels[status]}</span>
                                <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>{count}</div>
                            </div>
                        ))}
                    </div>

                    {gaps.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <p className="empty-state-text">
                                    No skill gaps found yet. The analysis may still be processing. Refresh in a few seconds.
                                </p>
                                <button className="btn btn-secondary" onClick={fetchAll}>Refresh</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {gaps.sort((a, b) => {
                                const order = ['missing', 'claimed_unproven', 'partial', 'low_priority', 'strong']
                                return order.indexOf(a.status) - order.indexOf(b.status)
                            }).map((gap) => (
                                <div key={gap.skillId} className="card" style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>{gap.skillName}</h4>
                                                <span className={`badge ${statusColors[gap.status]}`}>{statusLabels[gap.status]}</span>
                                                <span className="badge badge-info">{gap.importance}</span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                {gap.explanation}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'center', marginLeft: '16px', minWidth: '60px' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 700 }}>L{gap.evidenceLevel}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Evidence</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Scores Tab */}
            {tab === 'scores' && scores && (
                <div className="card" style={{ maxWidth: '600px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Readiness Breakdown</h3>
                    <ScoreBar label="Overall Readiness" value={scores.overallReadiness} />
                    <ScoreBar label="Job Match" value={scores.jobMatch} description="Skills you have vs. what's required" />
                    <ScoreBar label="Skill Coverage" value={scores.skillCoverage} description="Required skills with evidence" />
                    <ScoreBar label="Evidence Strength" value={scores.evidenceStrength} description="Average evidence quality" />
                    <ScoreBar label="Portfolio Strength" value={scores.portfolioStrength} description="GitHub repos + projects" />
                    <ScoreBar label="Production Readiness" value={scores.productionReadiness} description="Docker, CI/CD, tests, docs" />
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-muted)' }}>
                        📐 {scores.breakdown.formula}
                    </div>
                </div>
            )}

            {/* Roadmap Tab */}
            {tab === 'roadmap' && (
                <div>
                    {!roadmap ? (
                        <div className="card">
                            <div className="empty-state">
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                                <h3 className="empty-state-title">No roadmap yet</h3>
                                <p className="empty-state-text">Generate a personalized roadmap based on your skill gaps</p>
                                <button className="btn btn-primary" onClick={generateRoadmap} disabled={generating}>
                                    {generating ? <span className="spinner" /> : 'Generate Roadmap'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {roadmap.roadmapItems.map((item) => (
                                <div key={item.id} className="card" style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span className="badge badge-primary">{item.skill.name}</span>
                                                {item.milestone && <span className="badge badge-info">{item.milestone}</span>}
                                                {item.estimatedHours && (
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>~{item.estimatedHours}h</span>
                                                )}
                                            </div>
                                            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{item.task}</h4>
                                            {item.whyItMatters && (
                                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                                    💡 {item.whyItMatters}
                                                </p>
                                            )}
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                ✅ Done when: {item.definitionOfDone}
                                            </p>
                                        </div>
                                        <div style={{ minWidth: '140px' }}>
                                            <select
                                                value={item.status}
                                                onChange={(e) => updateItemStatus(item.id, e.target.value)}
                                                className="input"
                                                style={{ fontSize: '12px', padding: '6px 8px' }}
                                            >
                                                {Object.entries(itemStatusLabels).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Projects Tab */}
            {tab === 'projects' && (
                <div>
                    {!projectIdeas || projectIdeas.length === 0 ? (
                        <div className="card">
                            <div className="empty-state">
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
                                <h3 className="empty-state-title">No Projects Generated</h3>
                                <p className="empty-state-text">Generate comprehensive multi-skill projects tailored to cover your core gaps.</p>
                                <button className="btn btn-primary" onClick={generateProjects} disabled={generating}>
                                    {generating ? <span className="spinner" /> : 'Generate Projects'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {projectIdeas.map((proj, i) => (
                                <div key={i} className="card" style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{proj.title}</h4>
                                                <span className="badge badge-info">{proj.difficulty}</span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                {proj.description}
                                            </p>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {proj.skillsCovered.map((s: string) => (
                                                    <span key={s} className="badge badge-primary">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
