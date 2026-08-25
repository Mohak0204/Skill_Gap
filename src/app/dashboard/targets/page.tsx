'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Target {
    id: string
    title: string
    company: string | null
    createdAt: string
    _count: { jobRequirements: number }
}

export default function TargetsPage() {
    const router = useRouter()
    const [targets, setTargets] = useState<Target[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ title: '', company: '', jobDescription: '', experienceLevel: '' })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const fetchTargets = useCallback(async () => {
        try {
            const res = await fetch('/api/targets')
            if (res.ok) {
                const data = await res.json()
                setTargets(data.targets)
            }
        } catch { /* ignore */ } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchTargets() }, [fetchTargets])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        try {
            const res = await fetch('/api/targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            if (res.ok) {
                const data = await res.json()
                setShowModal(false)
                setForm({ title: '', company: '', jobDescription: '', experienceLevel: '' })
                router.push(`/dashboard/targets/${data.target.id}`)
            } else {
                const data = await res.json()
                setError(data.error?.message || 'Failed to create target')
            }
        } catch {
            setError('Network error')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Target Roles</h1>
                    <p className="page-description">Add job descriptions to analyze skill gaps</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + Add Target
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton" style={{ height: '100px' }} />
                    ))}
                </div>
            ) : targets.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                        <h3 className="empty-state-title">No targets yet</h3>
                        <p className="empty-state-text">
                            Paste a job description to analyze what skills you need and what gaps to close.
                        </p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Add Your First Target
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {targets.map((target, i) => (
                        <div
                            key={target.id}
                            className="card animate-fade-in"
                            style={{ cursor: 'pointer', animationDelay: `${i * 50}ms` }}
                            onClick={() => router.push(`/dashboard/targets/${target.id}`)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                                        {target.title}
                                    </h3>
                                    {target.company && (
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                            {target.company}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span className="badge badge-info">
                                            {target._count.jobRequirements} requirements
                                        </span>
                                        <span className="badge badge-primary">
                                            {new Date(target.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <span style={{ fontSize: '24px', color: 'var(--text-muted)' }}>→</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Target Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <h2 className="modal-title">Add Target Role</h2>
                        <p className="modal-description">Paste the job description to analyze skill requirements</p>

                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="input-label">Job Title *</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Senior Full-Stack Developer"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Company (optional)</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Google"
                                    value={form.company}
                                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Experience Level (optional)</label>
                                <input
                                    className="input"
                                    placeholder="e.g. Senior, 5+ years"
                                    value={form.experienceLevel}
                                    onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="input-label">Job Description *</label>
                                <textarea
                                    className="input"
                                    placeholder="Paste the full job description here..."
                                    value={form.jobDescription}
                                    onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                                    required
                                    style={{ minHeight: '200px' }}
                                />
                            </div>

                            {error && <p className="error-text">{error}</p>}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? <span className="spinner" /> : 'Create & Analyze'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
