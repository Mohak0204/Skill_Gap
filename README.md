<div align="center">
  <h1>🎯 SkillGap</h1>
  <p><strong>A deterministic, AI-assisted career readiness tracking and skill-gap analysis application.</strong></p>
</div>

<details>
  <summary>Table of Contents</summary>

- [Overview](#overview)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [AI Architecture](#ai-architecture)
- [Database Overview](#database-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Command Scripts](#command-scripts)
- [Testing](#testing)
- [Code Quality & Validation](#code-quality--validation)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Current Project Status](#current-project-status)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
</details>

## Overview

**SkillGap** is a Next.js full-stack application (structured as a modular monolith) designed to help tech professionals track their skills against specific job requirements. Instead of relying solely on subjective, self-reported skills, SkillGap deterministically measures evidence from your connected resume and GitHub repositories, computes the quality of your portfolio, and calculates a holistic "Readiness Score."

It tells you not just *what* you need to know, but *how* to prove it, and helps you prioritize your learning with AI-generated roadmaps and project ideas.

## Key Features

- **Resume Parsing & Skill Extraction:** Automatically processes PDF/text resumes to extract foundational skills.
- **Job Description Analysis:** Extracts required and preferred skills directly from target job descriptions.
- **Evidence Engine:** Deterministically computes a 0-5 confidence level based on matched evidence (e.g., self-reported vs. verified by an active GitHub repository with CI/CD).
- **Skill Gap Computation:** Cross-references required skills against your proven evidence to categorize skills as *Missing*, *Claimed*, *Partial*, or *Strong*.
- **GitHub Repository Synchronization:** Seamlessly scans your linked GitHub account for signals indicating production readiness (e.g., test coverage, CI pipelines, Dockerfiles).
- **Readiness Scoring:** Computes an aggregate "Readiness Score" weighting Skill Coverage (40%), Evidence (30%), Portfolio (20%), and Production Readiness (10%).
- **AI-Powered Roadmaps & Projects:** Generates personalized, prioritized roadmaps and distinct project ideas explicitly tailored to cover your identified skill gaps.
- **Next Best Action:** Bubbles up the single most critical task for the user based on priority algorithms.

## How It Works

1. **Onboarding:** Create an account and add a **Target** (e.g., Frontend Engineer at "Company X") by pasting a job description.
2. **Evidence Collection:** Upload your resume and connect your GitHub account.
3. **Background Processing:** Background jobs handle interacting with LLMs and extracting data asynchronously without blocking the UI.
4. **Gap Analysis:** The dashboard displays your identified gaps, readiness metrics, and score breakdowns.
5. **Actionable Roadmap:** Review AI-generated project concepts and complete tasks directly linked to improving specific evidence levels for your gaps.

## Screenshots

*(Placeholder for Screenshots)*

- **Dashboard Overview:** `![Dashboard Screenshot](link)`
- **Target Analysis & Readiness Math:** `![Target Detail Screenshot](link)`
- **AI Project Ideas:** `![Project Generator Screenshot](link)`
- **Onboarding Flow:** `![Onboarding Flow](link)`

## Architecture

SkillGap is built using a **Route → Service → Repository** layered pattern within the Next.js App Router.

- **Frontend (App Router):** Client-side React components enriched with glassmorphism UI, centralized in modern Tailwind utility setups (`globals.css`). Fetch requests target the internal API layer.
- **API (Route Handlers):** Secure Next.js route handlers (`src/app/api`) enforce authentication and handle request validation (using Zod) via a centralized `apiHandler`.
- **Services (Business Logic):** Core deterministic engines (`evidenceEngine`, `skillGapEngine`, `scoringService`, `roadmapEngine`) execute validation without side effects, making them highly testable.
- **Repositories (Data Access):** Abstracts all Prisma database logic (`src/repositories`) ensuring isolation.
- **Background Jobs:** Long-running LLM logic and GitHub syncer execute via asynchronous state polling (`jobRunner.ts`).

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Next.js (v16.3.3)** | React Framework, App Router, API Routes, SSR/SSG. |
| **TypeScript** | Strict typings and static analysis. |
| **Prisma** | Fully typed Object-Relational Mapper (ORM) interacting with the DB. |
| **NextAuth.js (Auth.js)** | Session strategy, Credentials, and GitHub OAuth logic. |
| **Zod** | Run-time API payload and configuration schema validation. |
| **Tailwind CSS** | Custom Design System, layout, animations, components. |
| **Vitest** | Blazing fast ESM-native unit and integration testing platform. |

## Project Structure

```text
├── .agent/              # Agent operation metadata and workflows
├── prisma/
│   ├── schema.prisma    # Data models (User, Target, Skill, Evidence, etc.)
│   └── seed.ts          # Seed script utilizing ~80 canonical baseline skills
├── src/
│   ├── ai/              # AI adapter definitions and prompt schemas (Claude)
│   ├── app/             # Next.js App Router (Frontend Pages & API routes)
│   ├── jobs/            # DB-backed background-job processors and runners
│   ├── lib/             # Shared utilities (DB singleton, Validation, Auth)
│   ├── repositories/    # Isolated database access logic
│   └── services/        # Core deterministic engines and logic paths
├── tests/               # Unit testing directories for all engines
├── ARCHITECTURE.md      # Detailed system constraints
└── IMPLEMENTATION_PLAN.md # Roadmap of delivery steps
```

## AI Architecture

- **Adapter Pattern:** Exposes a unified `AIProvider` defining Zod payload shapes. Currently implemented over **Anthropic Claude API** (via `claudeAdapter.ts`). Can be easily swapped for OpenAI by implementing the same interface.
- **Boundaries:** AI is *exclusively* used for unstructured data transformations (e.g. converting a Resume string to a JSON Skill map). It is **explicitly blocked** from determining "Evidence Levels" or "Scores"—which are handled strictly via deterministic, testable TS algorithms to guarantee fairness.

## Database Overview

SkillGap uses an SQL-compliant schema (configured generally for SQLite in local development for quick setup, easily swappable to PostgreSQL). 

- **Core:** `User`, `Account` (OAuth mapping).
- **Entities:** `Target` (Job Role), `Skill` (Canonical/Global skill dictionary), `Evidence` (Tracking artifacts per user).
- **Join/Metrics:** `SkillGap` (Virtual mapping representing current delta), `ReadinessSnapshot` (Historical audit log of calculated scores).
- **Progression:** `Roadmap`, `RoadmapItem`, `Project`.
- **Infrastructure:** `BackgroundJob` (Queue tracking).

> See `prisma/schema.prisma` for relationships.

## Getting Started

### Prerequisites
- Node.js `v18+`
- NPM `v9+`
- (Optional but Recommended) An Anthropic Claude API Key for the AI portions.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/SkillGap.git
cd SkillGap
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file:
```bash
cp .env.example .env.local
```
Fill out `.env.local` accurately (see next section).

### 4. Database Setup & Seed
If using SQLite locally, the default configuration will quickly generate the `.db` file:
```bash
npm run db:push
npm run db:generate
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

## Environment Variables

The application relies on these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Database connection string (e.g. `file:./dev.db` for local SQLite, or PostgreSQL URL) |
| `NEXTAUTH_URL` | Yes | Usually `http://localhost:3000` locally. |
| `NEXTAUTH_SECRET` | Yes | Random string used for hashing sessions/tokens. |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth ID (Required for GitHub Sign-In/Sync). |
| `GITHUB_CLIENT_SECRET`| Optional| GitHub OAuth Secret. |
| `TOKEN_ENCRYPTION_KEY`| Optional| 32-byte string for encrypting user tokens (e.g., GitHub access tokens) resting in DB. |
| `AI_PROVIDER_API_KEY` | Optional | Key for Anthropic SDK (`claudeAdapter.ts`). Extraction pipelines fail gracefully without it. |
| `AI_PROVIDER_BASE_URL` | Unused | Stubbed in `.env.example`, currently unused by Claude Adapter. |
| `FILE_STORAGE_BUCKET_URL` | Unused | Stubbed in `.env.example`. PDFs are parsed in-memory automatically using `pdf-parse`. |
| `SENTRY_DSN` | Unused | Stubbed in `.env.example` for future integrations. |
| `SENTRY_AUTH_TOKEN` | Unused | Stubbed in `.env.example` for future integrations. |

> ⚠️ Never commit `.env.local` to version control.

## Command Scripts

- `npm run dev`: Boots Next.js utilizing Turbopack.
- `npm run build`: Generates optimized production build.
- `npm run start`: Serves the compiled production build locally.
- `npm run db:push`: Synchronizes Prisma schema with exactly what's in the DB.
- `npm run db:generate`: Generates Prisma strictly-typed client.
- `npm run db:seed`: Injects foundational skills.
- `npm run db:studio`: Boots visual database explorer.

## Testing

The project uses `vitest` for extremely fast execution speed.

- **Unit Tests:** Execute pure algorithmic logic tests (e.g. checking exactly how a `Target` interacts with an `EvidenceLevel`). Tests are grouped natively in `/tests/unit`.
  ```bash
  npm run test:unit
  ```
- **Integration Tests:** Execute logic spanning the repository layers. 
  ```bash
  npm run test:integration
  ```
- **General Test:** `npm run test`

## Code Quality & Validation

No build can legitimately succeed without passing type validations:

- **Type Checking:** Validates the entire codebase without generating output files:
  ```bash
  npm run type-check
  ```
- **Linting:** Validates standard code semantics via ESLint:
  ```bash
  npm run lint
  ```

## Deployment Considerations

SkillGap is structurally built for stateless deployment across standard PaaS providers, specifically **Vercel** or **Heroku**:

1. Setup the respective environment variables securely in your deployment dashboard via `Settings -> Variables`.
2. Ensure you have deployed a persistent database (e.g., Supabase Postgres, Neon, or Railway) and set `DATABASE_URL`.
3. Use the build command: `npm run build` and start command `npm run start`.
4. Ensure `github` OAuth apps are updated with the correct domain redirects (`https://your-domain.com/api/auth/callback/github`).

## Security Considerations

- **Authentication:** Controlled by standard `next-auth` best practices securely utilizing server/client sessions.
- **Route Protections:** `apiHandler` seamlessly abstracts token decoding natively blocking unauthenticated requests across all sensitive `/api/*` interactions. 
- **Encryption-at-Rest:** Any keys aggregated (E.g. GitHub repos) undergo AES-256-CBC encryption internally via `src/lib/encryption.ts` prior to hitting Prisma persistence.
- **Database Limits:** Rate limiting constraints explicitly block unverified large injections ensuring the `BackgroundJob` tables can't be maliciously spun out.

## Current Project Status

- ✅ **Authentication:** Complete (Credentials + GitHub provider).
- ✅ **Target Identification & Extraction:** Complete. 
- ✅ **Resume Pipeline:** Complete (Polling uploads vs AI parsers).
- ✅ **Deterministic Rules (Coverage/Gaps):** Complete. 
- ✅ **Roadmaps & Next Best Action:** Complete.
- ✅ **Dashboard Visualization:** Complete.
- ⏳ *Future (Not Implemented): Extension plugins (LinkedIn scrape syncs), Real-time WebSocket Job Notifications, Team metrics.*

## Roadmap

- **Browser Extensions:** Allow users to import job descriptions instantly from LinkedIn/Indeed.
- **Mock Interviews:** Inject LLM text or audio based purely off *Missing Skills*.
- **Community Templates:** Allow roadmap sharing.
- **Real-Time WebSockets:** Eradicate client polling against background LLM extraction statuses.

## Contributing

1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: added real-time job sync'`
4. Validate tests locally: `npm run type-check` && `npm run test`
5. Push your feature branch: `git push -u origin feature/your-feature-name`
6. Submit a Pull Request targeting `main`.

## License

No explicit license is currently specified for this repository. All rights reserved. 
