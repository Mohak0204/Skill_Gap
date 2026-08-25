'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function SignInPage() {
    const router = useRouter()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email: form.email,
                password: form.password,
            })

            if (result?.ok) {
                router.push('/dashboard')
            } else {
                setError('Invalid email or password')
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
                right: '30%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
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
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Sign in to continue your journey
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
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
                            placeholder="Your password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                    </div>

                    {error && <p className="error-text" style={{ marginBottom: '16px' }}>{error}</p>}

                    <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        {loading ? <span className="spinner" /> : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Don&apos;t have an account?{' '}
                    <a href="/sign-up" style={{ color: 'var(--text-accent)' }}>Create one</a>
                </p>
            </div>
        </div>
    )
}
