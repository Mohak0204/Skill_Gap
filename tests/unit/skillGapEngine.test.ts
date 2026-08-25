import { describe, it, expect } from 'vitest'
import { computeSkillStatus } from '../../src/services/skillGapEngine'

describe('Skill Gap Engine', () => {
    it('returns strong for required skill with level 3+ evidence', () => {
        expect(computeSkillStatus({ hasUserSkill: true, evidenceLevel: 3, importance: 'required' }).status).toBe('strong')
        expect(computeSkillStatus({ hasUserSkill: true, evidenceLevel: 4, importance: 'preferred' }).status).toBe('strong')
    })

    it('returns partial for skill with level 1-2 evidence', () => {
        expect(computeSkillStatus({ hasUserSkill: true, evidenceLevel: 1, importance: 'required' }).status).toBe('partial')
        expect(computeSkillStatus({ hasUserSkill: true, evidenceLevel: 2, importance: 'preferred' }).status).toBe('partial')
    })

    it('returns claimed_unproven for skill with level 0 evidence', () => {
        expect(computeSkillStatus({ hasUserSkill: true, evidenceLevel: 0, importance: 'required' }).status).toBe('claimed_unproven')
    })

    it('returns missing for required skill not possessed by user', () => {
        expect(computeSkillStatus({ hasUserSkill: false, evidenceLevel: 0, importance: 'required' }).status).toBe('missing')
    })

    it('returns low_priority for preferred skill not possessed by user', () => {
        expect(computeSkillStatus({ hasUserSkill: false, evidenceLevel: 0, importance: 'preferred' }).status).toBe('low_priority')
    })
})
