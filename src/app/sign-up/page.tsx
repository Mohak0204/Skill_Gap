'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
    const router = useRouter()
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error?.message || 'Something went wrong')
                return
            }

            // Auto sign-in after registration
            const { signIn } = await import('next-auth/react')
            const result = await signIn('credentials', {
                redirect: false,
                email: form.email,
                password: form.password,
            })

            if (result?.ok) {
                router.push('/dashboard')
            } else {
                router.push('/sign-in')
            }
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
        }}>
            <div style={{
                position: 'absolute',
                top: '30%',
                left: '40%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                pointerEvents: 'none',
            }} />

            <div className="glass-card animate-fade-in" style={{ padding: '40px', width: '100%', maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--gradient-primary)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '20px',
                        margin: '0 auto 16px',
                    }}>S</div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Start closing your skill gap today
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="input-label">Name</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="Your name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Email</label>
                        <input
                            className="input"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Password</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="At least 8 characters"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            minLength={8}
                        />
                    </div>

                    {error && <p className="error-text" style={{ marginBottom: '16px' }}>{error}</p>}

                    <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        {loading ? <span className="spinner" /> : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <a href="/sign-in" style={{ color: 'var(--text-accent)' }}>Sign in</a>
                </p>
            </div>
        </div>
    )
}
