'use client'

import { useState } from 'react'

export default function ResumePage() {
    const [resumeText, setResumeText] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [jobId, setJobId] = useState<string | null>(null)
    const [result, setResult] = useState<{
        skills: Array<{ name: string; category: string; proficiency?: string }>
        projects: Array<{ title: string; description: string; technologies: string[] }>
    } | null>(null)
    const [confirmed, setConfirmed] = useState(false)
    const [error, setError] = useState('')

    const handleUpload = async () => {
        setUploading(true)
        setError('')

        try {
            let res: Response

            if (file) {
                const formData = new FormData()
                formData.append('resume', file)
                res = await fetch('/api/resume', { method: 'POST', body: formData })
            } else {
                res = await fetch('/api/resume', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resumeText }),
                })
            }

            if (res.ok) {
                const data = await res.json()
                setJobId(data.jobId)
                // Poll for results
                pollResults(data.jobId)
            } else {
                const data = await res.json()
                setError(data.error?.message || 'Upload failed')
                setUploading(false)
            }
        } catch {
            setError('Upload error')
            setUploading(false)
        }
    }

    const pollResults = async (jId: string) => {
        for (let i = 0; i < 30; i++) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            try {
                const res = await fetch(`/api/jobs/${jId}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.job.status === 'complete') {
                        setResult(data.job.result)
                        setUploading(false)
                        return
                    }
                    if (data.job.status === 'failed') {
                        setError(data.job.error || 'Extraction failed')
                        setUploading(false)
                        return
                    }
                }
            } catch { /* keep polling */ }
        }
        setError('Extraction timed out')
        setUploading(false)
    }

    const handleConfirm = async () => {
        if (!result || !jobId) return

        try {
            const res = await fetch('/api/resume', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId,
                    skillIds: result.skills.map((s) => s.name),
                    projectIds: result.projects.map((p) => p.title),
                }),
            })

            if (res.ok) {
                setConfirmed(true)
            }
        } catch {
            setError('Failed to confirm')
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Resume Upload</h1>
                <p className="page-description">Upload your resume to extract skills and projects automatically</p>
            </div>

            {confirmed ? (
                <div className="card animate-fade-in">
                    <div className="empty-state">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h3 className="empty-state-title">Resume imported successfully!</h3>
                        <p className="empty-state-text">
                            Your skills and projects have been added to your profile.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <a href="/dashboard/skills" className="btn btn-primary">View Skills</a>
                            <button className="btn btn-secondary" onClick={() => { setConfirmed(false); setResult(null); setJobId(null) }}>
                                Upload Another
                            </button>
                        </div>
                    </div>
                </div>
            ) : result ? (
                <div className="animate-fade-in">
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                            Extracted Skills ({result.skills.length})
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {result.skills.map((s, i) => (
                                <span key={i} className="badge badge-primary" style={{ fontSize: '12px' }}>
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                            Extracted Projects ({result.projects.length})
                        </h3>
                        {result.projects.map((p, i) => (
                            <div key={i} style={{
                                padding: '12px',
                                borderBottom: i < result.projects.length - 1 ? '1px solid var(--border-primary)' : 'none',
                            }}>
                                <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{p.title}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{p.description}</p>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {p.technologies.map((t, j) => (
                                        <span key={j} className="badge badge-info" style={{ fontSize: '10px' }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-primary" onClick={handleConfirm}>
                            ✅ Confirm & Import All
                        </button>
                        <button className="btn btn-secondary" onClick={() => { setResult(null); setJobId(null) }}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    {/* Upload Options */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="card">
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📁 Upload File</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                Supports .txt, .md, and .pdf files (max 5MB)
                            </p>
                            <input
                                type="file"
                                accept=".txt,.md,.pdf"
                                className="input"
                                onChange={(e) => {
                                    setFile(e.target.files?.[0] || null)
                                    setResumeText('')
                                }}
                            />
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>📝 Paste Text</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                Copy and paste your resume content
                            </p>
                            <textarea
                                className="input"
                                placeholder="Paste your resume text here..."
                                value={resumeText}
                                onChange={(e) => { setResumeText(e.target.value); setFile(null) }}
                                style={{ minHeight: '120px' }}
                            />
                        </div>
                    </div>

                    {error && <p className="error-text" style={{ marginTop: '16px' }}>{error}</p>}

                    <button
                        className="btn btn-primary btn-lg"
                        style={{ marginTop: '24px' }}
                        onClick={handleUpload}
                        disabled={(!file && !resumeText) || uploading}
                    >
                        {uploading ? (
                            <>
                                <span className="spinner" />
                                Analyzing Resume...
                            </>
                        ) : (
                            '🔍 Extract Skills'
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}
