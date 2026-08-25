'use client'

import { useState, useEffect, useCallback } from 'react'

interface Target {
    id: string
    title: string
    company: string | null
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
    not_started: 'badge-low',
    in_progress: 'badge-partial',
    blocked: 'badge-missing',
    completed: 'badge-strong',
    verified: 'badge-primary',
}

const statusLabels: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    completed: 'Completed',
    verified: 'Verified',
}

export default function RoadmapPage() {
    const [targets, setTargets] = useState<Target[]>([])
    const [selectedTarget, setSelectedTarget] = useState<string>('')
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')

    const fetchTargets = useCallback(async () => {
        try {
            const res = await fetch('/api/targets')
            if (res.ok) {
                const data = await res.json()
                setTargets(data.targets)
                if (data.targets.length > 0) {
                    setSelectedTarget(data.targets[0].id)
                }
            }
        } catch { /* ignore */ } finally {
            setLoading(false)
        }
    }, [])

    const fetchRoadmap = useCallback(async () => {
        if (!selectedTarget) return
        try {
            const res = await fetch(`/api/targets/${selectedTarget}/roadmap`)
            if (res.ok) {
                const data = await res.json()
                setRoadmap(data.roadmap)
            }
        } catch { /* ignore */ }
    }, [selectedTarget])

    useEffect(() => { fetchTargets() }, [fetchTargets])
    useEffect(() => { fetchRoadmap() }, [fetchRoadmap])

    const updateItemStatus = async (itemId: string, status: string) => {
        try {
            await fetch(`/api/roadmap-items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, selfReported: true }),
            })
            fetchRoadmap()
        } catch { /* ignore */ }
    }

    const filtered = roadmap?.roadmapItems.filter(
        (item) => filter === 'all' || item.status === filter
    ) || []

    const completedCount = roadmap?.roadmapItems.filter(
        (i) => i.status === 'completed' || i.status === 'verified'
    ).length || 0
    const totalCount = roadmap?.roadmapItems.length || 0
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Roadmap</h1>
                <p className="page-description">Your personalized learning roadmap</p>
            </div>

            {/* Target Selector */}
            {targets.length > 1 && (
                <div style={{ marginBottom: '24px' }}>
                    <select
                        className="input"
                        value={selectedTarget}
                        onChange={(e) => setSelectedTarget(e.target.value)}
                        style={{ maxWidth: '400px' }}
                    >
                        {targets.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title} {t.company ? `- ${t.company}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {loading ? (
                <div className="skeleton" style={{ height: '300px' }} />
            ) : !roadmap ? (
                <div className="card">
                    <div className="empty-state">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                        <h3 className="empty-state-title">No roadmap generated</h3>
                        <p className="empty-state-text">
                            {targets.length === 0
                                ? 'Add a target role first, then generate a roadmap'
                                : 'Go to your target page to generate a roadmap'}
                        </p>
                        <a href="/dashboard/targets" className="btn btn-primary">Go to Targets</a>
                    </div>
                </div>
            ) : (
                <div>
                    {/* Progress */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Progress</h3>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>
                                {completedCount}/{totalCount} completed ({progress}%)
                            </span>
                        </div>
                        <div className="progress-bar" style={{ height: '12px' }}>
                            <div className="progress-fill progress-fill-primary" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {['all', 'not_started', 'in_progress', 'blocked', 'completed', 'verified'].map((f) => (
                            <button
                                key={f}
                                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' ? 'All' : statusLabels[f]}
                            </button>
                        ))}
                    </div>

                    {/* Items */}
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {filtered.map((item) => (
                            <div key={item.id} className="card" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1, marginRight: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span className="badge badge-primary">{item.skill.name}</span>
                                            <span className={`badge ${statusColors[item.status]}`}>{statusLabels[item.status]}</span>
                                            {item.milestone && <span className="badge badge-info">{item.milestone}</span>}
                                        </div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>{item.task}</h4>
                                        {item.whyItMatters && (
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                                💡 {item.whyItMatters}
                                            </p>
                                        )}
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            ✅ {item.definitionOfDone}
                                        </p>
                                        {item.estimatedHours && (
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                ⏱️ ~{item.estimatedHours} hours
                                            </p>
                                        )}
                                    </div>
                                    <select
                                        value={item.status}
                                        onChange={(e) => updateItemStatus(item.id, e.target.value)}
                                        className="input"
                                        style={{ width: '140px', fontSize: '12px', padding: '6px 8px' }}
                                    >
                                        {Object.entries(statusLabels).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
