'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid var(--border-primary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'var(--gradient-primary)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '16px',
          }}>S</div>
          <span style={{
            fontSize: '20px',
            fontWeight: 700,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>SkillGap</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-ghost" onClick={() => router.push('/sign-in')}>
            Sign In
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/sign-up')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px',
        position: 'relative',
      }}>
        {/* Gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
          <div className="badge badge-primary" style={{ marginBottom: '24px', fontSize: '12px' }}>
            ✨ AI-Powered Career Analysis
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: '800px',
            marginBottom: '24px',
          }}>
            Close the Gap Between<br />
            <span style={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Where You Are</span> and<br />
            Where You Want to Be
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            marginBottom: '40px',
            lineHeight: 1.6,
          }}>
            Upload your resume, paste a job description, and get an evidence-based roadmap
            showing exactly which skills to build and how to prove them.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/sign-up')}>
              Start for Free →
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => router.push('/sign-in')}>
              Sign In
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          maxWidth: '960px',
          width: '100%',
          marginTop: '80px',
          position: 'relative',
          zIndex: 1,
        }}>
          {[
            {
              icon: '🎯',
              title: 'Smart Gap Analysis',
              desc: 'AI extracts requirements from job descriptions and maps them against your skills with evidence levels.',
            },
            {
              icon: '🔗',
              title: 'GitHub Evidence',
              desc: 'Connect GitHub to automatically detect technologies, testing patterns, CI/CD, and Docker usage.',
            },
            {
              icon: '🗺️',
              title: 'Actionable Roadmap',
              desc: 'Get prioritized tasks with definitions of done, project ideas, and progress tracking.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card animate-fade-in"
              style={{
                padding: '32px',
                animationDelay: `${i * 100}ms`,
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px 40px',
        borderTop: '1px solid var(--border-primary)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '13px',
      }}>
        Built with ♥ · SkillGap © 2024
      </footer>
    </div>
  )
}
