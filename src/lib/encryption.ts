import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'

function getKey(): Buffer {
    const key = process.env.TOKEN_ENCRYPTION_KEY
    if (!key) throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required')
    // Ensure key is 32 bytes (256 bits)
    return crypto.scryptSync(key, 'skillgap-salt', 32)
}

export function encrypt(text: string): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return {
        encrypted,
        iv: iv.toString('hex'),
    }
}

export function decrypt(encrypted: string, iv: string): string {
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        getKey(),
        Buffer.from(iv, 'hex')
    )
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}
