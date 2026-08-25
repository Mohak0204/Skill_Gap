'use client'

import { useState, useEffect, useCallback } from 'react'

interface Skill {
    id: string
    name: string
    category: string
}

interface UserSkillItem {
    skillId: string
    confidence: number
    source: string
    skill: Skill
}

export default function SkillsPage() {
    const [userSkills, setUserSkills] = useState<UserSkillItem[]>([])
    const [allSkills, setAllSkills] = useState<Skill[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showAdd, setShowAdd] = useState(false)

    const fetchSkills = useCallback(async () => {
        try {
            const [userRes, allRes] = await Promise.all([
                fetch('/api/skills/user'),
                fetch('/api/skills'),
            ])
            if (userRes.ok) {
                const d = await userRes.json()
                setUserSkills(d.skills || [])
            }
            if (allRes.ok) {
                const d = await allRes.json()
                setAllSkills(d.skills || [])
            }
        } catch { /* ignore */ } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchSkills() }, [fetchSkills])

    const addSkill = async (skillId: string) => {
        try {
            await fetch('/api/skills/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skillId, confidence: 50 }),
            })
            fetchSkills()
        } catch { /* ignore */ }
    }

    const grouped = userSkills.reduce((acc, us) => {
        const cat = us.skill.category
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(us)
        return acc
    }, {} as Record<string, UserSkillItem[]>)

    const filteredAllSkills = allSkills.filter(
        (s) =>
            !userSkills.some((us) => us.skillId === s.id) &&
            s.name.toLowerCase().includes(search.toLowerCase())
    )

    const categoryLabels: Record<string, string> = {
        programming_language: '💻 Languages',
        framework: '⚙️ Frameworks',
        database: '🗄️ Databases',
        cloud: '☁️ Cloud',
        devops: '🔧 DevOps',
        testing: '🧪 Testing',
        architecture: '🏗️ Architecture',
        soft_skill: '🤝 Soft Skills',
        other: '📦 Other',
        unmapped: '❓ Other',
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="page-title">Your Skills</h1>
                    <p className="page-description">Track your skills and evidence levels</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
                    {showAdd ? 'Close' : '+ Add Skill'}
                </button>
            </div>

            {showAdd && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <input
                        className="input"
                        placeholder="Search skills to add..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ marginBottom: '12px' }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '200px', overflow: 'auto' }}>
                        {filteredAllSkills.slice(0, 30).map((skill) => (
                            <button
                                key={skill.id}
                                className="btn btn-secondary btn-sm"
                                onClick={() => addSkill(skill.id)}
                            >
                                + {skill.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="skeleton" style={{ height: '200px' }} />
            ) : Object.keys(grouped).length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
                        <h3 className="empty-state-title">No skills tracked yet</h3>
                        <p className="empty-state-text">
                            Add skills manually or upload your resume to auto-detect them.
                        </p>
                    </div>
                </div>
            ) : (
                Object.entries(grouped).map(([category, skills]) => (
                    <div key={category} style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
                            {categoryLabels[category] || category}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {skills.map((us) => (
                                <div key={us.skillId} className="card" style={{ padding: '12px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{us.skill.name}</span>
                                    <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                                        {us.source}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
