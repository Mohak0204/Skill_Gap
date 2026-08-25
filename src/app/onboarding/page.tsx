'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 subtle-bg">
            <div className="glass-panel max-w-2xl w-full p-8 rounded-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
                    <div className="h-full bg-gradient-to-r from-[--color-primary] to-[--color-accent] transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>

                <h1 className="text-3xl font-bold mb-4 font-outfit">Welcome to SkillGap!</h1>
                <p className="text-white/70 mb-8">Let's set up your profile to start tracking your career readiness.</p>

                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-xl font-semibold mb-4 text-[--color-primary]">Step 1: Set Your First Target</h2>
                        <p className="text-sm text-white/50 mb-6">What role are you aiming for? You can edit this later.</p>
                        <form onSubmit={(e) => { e.preventDefault(); setStep(2) }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Target Title</label>
                                <input required type="text" placeholder="e.g. Senior Frontend Engineer" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[--color-primary]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Target Company (Optional)</label>
                                <input type="text" placeholder="e.g. Google" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[--color-primary]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Job Description</label>
                                <textarea required rows={4} placeholder="Paste the job description here..." className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[--color-primary]"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-[--color-primary] hover:bg-teal-500 text-black font-semibold rounded-lg p-3 transition-colors">
                                Analyze Target & Continue
                            </button>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-xl font-semibold mb-4 text-[--color-accent]">Step 2: Add Your Resume</h2>
                        <p className="text-sm text-white/50 mb-6">We will extract your existing skills to see what you already know.</p>
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-white/40 transition-colors cursor-pointer mb-6">
                            <span className="text-white/60">Drag and drop your PDF resume, or click to browse.</span>
                        </div>
                        <div className="flex justify-between">
                            <button onClick={() => setStep(3)} className="text-white/50 hover:text-white transition-colors">Skip for now</button>
                            <button onClick={() => setStep(3)} className="px-6 py-2 bg-[--color-primary]/20 text-[--color-primary] hover:bg-[--color-primary]/30 font-semibold rounded-lg transition-colors">
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-xl font-semibold mb-4 text-[#8a2be2]">Step 3: Connect GitHub</h2>
                        <p className="text-sm text-white/50 mb-6">Sync your repositories so we can detect evidence of your skills automatically.</p>

                        <div className="bg-white/5 rounded-xl p-6 text-center mb-8 border border-white/10">
                            <button className="flex items-center justify-center gap-3 w-full max-w-sm mx-auto bg-[#24292e] hover:bg-[#2f363d] text-white font-medium rounded-lg p-3 transition-colors">
                                <svg height="24" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="24" data-view-component="true" className="fill-white">
                                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                                </svg>
                                Connect GitHub Account
                            </button>
                        </div>

                        <div className="flex justify-between">
                            <button onClick={() => router.push('/dashboard')} className="text-white/50 hover:text-white transition-colors">Skip for now</button>
                            <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-gradient-to-r from-[#8a2be2] to-[#ff00ff] text-white font-semibold rounded-lg shadow-lg hover:shadow-[#8a2be2]/25 transition-all">
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
