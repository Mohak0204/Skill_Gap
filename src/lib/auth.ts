import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            githubUsername?: string | null
        }
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/sign-in',
        newUser: '/onboarding',
    },
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const email = credentials.email as string
                const password = credentials.password as string

                const user = await prisma.user.findUnique({
                    where: { email },
                })

                if (!user?.passwordHash) return null

                const isValid = await bcrypt.compare(password, user.passwordHash)
                if (!isValid) return null

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                }
            },
        }),
        ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
            ? [
                GitHubProvider({
                    clientId: process.env.GITHUB_CLIENT_ID,
                    clientSecret: process.env.GITHUB_CLIENT_SECRET,
                    authorization: { params: { scope: 'read:user user:email public_repo' } },
                }),
            ]
            : []),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token?.id) {
                session.user.id = token.id as string
                // Fetch github username
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { githubUsername: true },
                })
                session.user.githubUsername = dbUser?.githubUsername || null
            }
            return session
        },
    },
})

/**
 * Get server session - convenience wrapper
 */
export async function getServerSession() {
    return auth()
}
