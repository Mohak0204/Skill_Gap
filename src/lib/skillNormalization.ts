import { prisma } from './db'

/**
 * Skill Normalization Module
 * Maps raw extracted terms to canonical Skill entities via alias/fuzzy match.
 * Used by Job Description Analysis, Resume Extraction, and GitHub Sync.
 */

// Cache skill data in memory for performance
let skillCache: { name: string; id: string; aliases: string[]; category: string }[] | null = null

async function loadSkillCache() {
    if (skillCache) return skillCache
    const skills = await prisma.skill.findMany()
    skillCache = skills.map((s: any) => ({
        id: s.id,
        name: s.name.toLowerCase(),
        aliases: s.aliases ? s.aliases.split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean) : [],
        category: s.category,
    }))
    return skillCache
}

export function invalidateSkillCache() {
    skillCache = null
}

/**
 * Normalize a raw skill name to a canonical Skill entity.
 * Returns the matched Skill id and name, or creates/flags an unmapped entry.
 */
export async function normalizeSkill(rawName: string): Promise<{
    skillId: string
    skillName: string
    matched: boolean
}> {
    const cache = await loadSkillCache()
    const normalized = rawName.trim().toLowerCase()

    // Exact name match
    const exactMatch = cache!.find((s) => s.name === normalized)
    if (exactMatch) {
        return { skillId: exactMatch.id, skillName: exactMatch.name, matched: true }
    }

    // Alias match
    const aliasMatch = cache!.find((s) => s.aliases.includes(normalized))
    if (aliasMatch) {
        return { skillId: aliasMatch.id, skillName: aliasMatch.name, matched: true }
    }

    // Fuzzy match - check for common variations
    const fuzzyNormalized = normalized
        .replace(/[.\-_]/g, '')
        .replace(/\s+/g, '')

    const fuzzyMatch = cache!.find((s) => {
        const sNorm = s.name.replace(/[.\-_]/g, '').replace(/\s+/g, '')
        if (sNorm === fuzzyNormalized) return true
        // Check aliases too
        return s.aliases.some((a) => {
            const aNorm = a.replace(/[.\-_]/g, '').replace(/\s+/g, '')
            return aNorm === fuzzyNormalized
        })
    })

    if (fuzzyMatch) {
        return { skillId: fuzzyMatch.id, skillName: fuzzyMatch.name, matched: true }
    }

    // No match found - create as unmapped
    const unmapped = await prisma.skill.create({
        data: {
            name: rawName.trim(),
            category: 'unmapped',
            aliases: '',
        },
    })

    // Invalidate cache since we added a new skill
    invalidateSkillCache()

    return { skillId: unmapped.id, skillName: unmapped.name, matched: false }
}

/**
 * Normalize multiple skills at once and return the results.
 */
export async function normalizeSkills(
    rawNames: string[]
): Promise<Array<{ rawName: string; skillId: string; skillName: string; matched: boolean }>> {
    const results = []
    for (const rawName of rawNames) {
        const result = await normalizeSkill(rawName)
        results.push({ rawName, ...result })
    }
    return results
}
