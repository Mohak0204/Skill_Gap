'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect } from 'react'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/targets', label: 'Targets', icon: '🎯' },
    { href: '/dashboard/skills', label: 'Skills', icon: '⚡' },
    { href: '/dashboard/resume', label: 'Resume', icon: '📄' },
    { href: '/dashboard/github', label: 'GitHub', icon: '🔗' },
    { href: '/dashboard/roadmap', label: 'Roadmap', icon: '🗺️' },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session, status } = useSession()

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/sign-in')
        }
    }, [status, router])

    if (status === 'loading') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div className="spinner spinner-lg" />
            </div>
        )
    }

    if (status === 'unauthenticated') return null

    const userName = session?.user?.name || 'User'
    const userEmail = session?.user?.email || ''

    return (
        <div className="layout-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">S</div>
                    <span className="sidebar-logo-text">SkillGap</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">Navigation</div>
                    {navItems.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault()
                                router.push(item.href)
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{item.icon}</span>
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="sidebar-user-name">{userName}</div>
                        <div className="sidebar-user-email">{userEmail}</div>
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => signOut({ callbackUrl: '/' })}
                        title="Sign Out"
                    >
                        ↩
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="main-content">
                {children}
            </main>
        </div>
    )
}
