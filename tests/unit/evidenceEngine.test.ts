import { describe, it, expect } from 'vitest'
import { computeEvidenceLevel } from '../../src/services/evidenceEngine'

describe('Evidence Engine', () => {
    it('returns level 0 when no evidence', () => {
        expect(computeEvidenceLevel([])).toBe(0)
    })

    it('returns level 1 for resume mention', () => {
        const evidence = [
            { sourceType: 'resume', strength: 1, description: 'Added from resume' }
        ]
        expect(computeEvidenceLevel(evidence)).toBe(1)
    })

    it('returns level 2 for github and resume mention (max strength 1)', () => {
        const evidence = [
            { sourceType: 'resume', strength: 1, description: 'Resume' },
            { sourceType: 'github', strength: 1, description: 'Repo Language' }
        ]
        expect(computeEvidenceLevel(evidence)).toBe(2)
    })

    it('returns level 3 for github with strength 2', () => {
        const evidence = [
            { sourceType: 'github', strength: 2, description: 'Has tests' }
        ]
        expect(computeEvidenceLevel(evidence)).toBe(3)
    })

    it('returns level 4 for max strength 4', () => {
        const evidence = [
            { sourceType: 'manual', strength: 4, description: 'Deployed app' }
        ]
        expect(computeEvidenceLevel(evidence)).toBe(4)
    })

    it('returns level 4 for github max strength 3', () => {
        const evidence = [
            { sourceType: 'github', strength: 3, description: 'Has tests and CI' }
        ]
        expect(computeEvidenceLevel(evidence)).toBe(4)
    })

    it('returns level 5 ONLY if github + resume/manual + strength 5', () => {
        // Only one source, not enough
        expect(computeEvidenceLevel([{ sourceType: 'manual', strength: 5, description: '' }])).toBe(4)
        expect(computeEvidenceLevel([{ sourceType: 'github', strength: 5, description: '' }])).toBe(4)

        // Multiple sources, reached highest level
        const evidence = [
            { sourceType: 'github', strength: 5, description: '' },
            { sourceType: 'resume', strength: 2, description: '' }
        ]
        expect(computeEvidenceLevel(evidence)).toBe(5)
    })
})
