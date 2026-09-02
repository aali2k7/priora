<div align="center">

# ⚡ Priora

**The AI Executive Email Assistant for High-Leverage Leaders**

*Transform inbox overload into calm, prioritized executive clarity in under 5 seconds.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.9-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-v1.6-purple?style=flat-square)](https://better-auth.com/)
[![Neon Postgres](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=flat-square&logo=postgresql)](https://neon.tech/)
[![License](https://img.shields.io/badge/License-Private-slate?style=flat-square)](#)

</div>

---

## 🎯 Overview

Priora is an executive-grade email command center built for founders, executives, and high-velocity teams who receive hundreds of complex communications daily. Instead of drowning in endless threads, Priora delivers instantaneous clarity by answering a single question within five seconds of opening:

> **"What do I need to pay attention to today?"**

By orchestrating low-latency AI inference with real-time Gmail synchronization, Priora parses, categorizes, extracts decisions, and drafts context-aware responses—keeping you strictly in control while saving hours of cognitive overhead every day.

---

## ✨ Key Features

### 🌅 1. 5-Second Executive Briefing
- **Daily Digest**: Instant morning briefing summarizing urgent deadlines, active discussions, and items awaiting your input.
- **Cognitive Metric**: Tracks estimated reading time saved (e.g., *Original read: 4m 12s → AI brief: 12s*).
- **Executive Task Extraction**: Automatically converts buried thread commitments into actionable, prioritized checklist items.

### 🖥️ 2. High-Density 3-Pane Workspace
- **Smart Categorization**: Segment threads into `Action Required`, `Deadline Today`, `VIP`, `FYI`, and `Newsletter`.
- **Urgency & Importance Matrix**: Real-time 0–100 scoring and sentiment detection to surface high-stakes emails first.
- **Executive Brief Banners**: 2-sentence tl;dr pinned directly above every thread with extracted key parameters (dates, approval requirements, parent/student context, and confidence ratings).

### ✍️ 3. Context-Aware AI Draft Composer
- **Multi-Tone Modulation**: Generate 1-click tailored responses adapting to your preferred tone:
  - `Concise` — Crisp 1-2 sentence executive directives.
  - `Formal` — Polite, structured corporate correspondence.
  - `Direct Refusal` — Firm, respectful boundary setting.
  - `Request Call` — Frictionless calendar scheduling proposals.
  - `Friendly` — Warm, collaborative team communication.
- **Custom Revision Prompts**: Refine generated drafts on the fly with targeted instructions (e.g., *"Ask for the deck by 3 PM instead"*).

### 🔒 4. Executive Privacy & Zero-Risk Architecture
- **Human-in-the-Loop Guarantee**: Priora operates in read-and-draft mode. No outgoing message is ever dispatched without explicit human review and confirmation.
- **Plaintext-Only Storage**: Strips tracking pixels, intrusive HTML, and executable binary attachments. Only sanitized text and structured metadata are cached.
- **Zero AI Training Retention**: Inference calls adhere strictly to enterprise zero-retention policies.

### ⚡ 5. Real-Time Gmail Engine & Live Sync
- **Incremental History Sync**: Uses Gmail API history IDs to fetch and reconcile delta changes in milliseconds.
- **Live Server-Sent Events (SSE)**: Streams instant updates to the client interface as new emails arrive.
- **Dual AI Engine**: Primary ultra-fast Groq LLM inference with automated Gemini fallback for 99.9% uptime and sub-second generation.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | Server Components, Route Handlers, Turbopack support |
| **Frontend UI** | [React 19](https://react.dev/) + [Tailwind CSS v4](https://tailwindcss.com/) | Modern slate/warm executive design system with Light/Dark/System themes |
| **Icons & UI** | [Lucide React](https://lucide.dev/) + [Radix UI](https://www.radix-ui.com/) | Accessible primitives and high-precision executive iconography |
| **Database & ORM** | [Prisma v7](https://www.prisma.io/) + [Neon PostgreSQL](https://neon.tech/) | Serverless PostgreSQL serving as an AI synthesis & metadata cache |
| **Authentication** | [Better Auth v1.6](https://better-auth.com/) | Google OAuth 2.0 multi-scope flow with secure session management |
| **AI Inference** | [Google Gemini 2.0 / 1.5](https://ai.google.dev/) & [Groq](https://groq.com/) | High-speed structured JSON output parsing with multi-model failover |
| **State & Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Type-safe form validation and runtime schema parsing |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.0.0` or later (or **Bun** `v1.1+`)
- **Package Manager**: `npm`, `pnpm`, or `bun`
- **PostgreSQL Database**: [Neon Serverless Postgres](https://neon.tech) (recommended) or any PostgreSQL instance
- **Google Cloud Console Project**: OAuth 2.0 client credentials with Gmail API scopes enabled
- **API Keys**: Google Gemini API key and/or Groq API key

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/priora.git
cd priora

# Install dependencies (npm, pnpm, or bun)
npm install
# or: bun install
```

---

### 2. Configure Environment Variables

Create a local environment configuration file:

```bash
cp .env.example .env.local
```

Populate the required environment variables in `.env.local`:

```env
# Database Connection (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require&uselibpqcompat=true"

# Better Auth & Application URLs
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Secret Key (Generate with: openssl rand -hex 32)
BETTER_AUTH_SECRET="your_generated_random_secret_string"

# Google OAuth 2.0 Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Inference Providers (At least one required)
GEMINI_API_KEY="your-gemini-api-key"
GROQ_API_KEY="your-groq-api-key" # Optional high-speed inference
```

> **Google OAuth Configuration**: Ensure `http://localhost:3000/api/auth/callback/google` is added under **Authorized redirect URIs** in your Google Cloud Console project with `https://www.googleapis.com/auth/gmail.modify` scope.

---

### 3. Initialize Database & Prisma

Push the database schema to your PostgreSQL instance:

```bash
npx prisma db push
# or: bunx prisma db push
```

*(Optional)* Open Prisma Studio to inspect cached metadata:
```bash
npx prisma studio
```

---

### 4. Run the Development Server

```bash
npm run dev
# or: bun run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to open Priora.

---

## 📂 Project Structure

```
priora/
├── prisma/
│   └── schema.prisma              # Neon Postgres schema (User, Thread, Email, SyncState, Labels)
├── public/                        # Static assets & icons
└── src/
    ├── app/
    │   ├── (auth)/                # Authentication routes (Login, OAuth callbacks)
    │   ├── (dashboard)/           # Protected executive dashboard routes
    │   │   ├── briefing/          # Morning executive digest view
    │   │   ├── inbox/             # Primary 3-pane email workspace
    │   │   ├── settings/          # Account sync & appearance preferences
    │   │   └── layout.tsx         # Executive shell layout & sidebar navigation
    │   ├── api/
    │   │   ├── ai/                # AI endpoints (analyze, briefing, draft, summary)
    │   │   ├── auth/              # Better Auth route handler
    │   │   ├── events/            # SSE live update stream
    │   │   ├── gmail/             # Gmail API integration (sync, send, action, threads)
    │   │   └── webhooks/          # Gmail Pub/Sub push notification listener
    │   ├── globals.css            # Tailwind CSS v4 design tokens & theme variables
    │   ├── layout.tsx             # Root layout with theme provider
    │   └── page.tsx               # Product landing page & feature showcase
    ├── components/
    │   ├── common/                # Shared layout components (Header, Sidebar)
    │   ├── dashboard/             # Executive briefing & high-priority feed components
    │   ├── inbox/                 # 3-pane workspace, thread reader, AI draft composer
    │   ├── ui/                    # Reusable UI primitives (Card, Badge, Button, Input)
    │   └── theme-provider.tsx     # Light / Dark / System theme state provider
    ├── lib/
    │   ├── ai-service.ts          # Core AI analysis orchestrator
    │   ├── auth.ts                # Better Auth server configuration
    │   ├── auth-client.ts         # Better Auth client hooks
    │   ├── gemini.ts              # Gemini API client & schema wrappers
    │   ├── gmail-service.ts       # Gmail REST API communication layer
    │   ├── gmail-sync.ts          # Incremental sync & delta reconciliation engine
    │   ├── groq.ts                # High-speed Groq inference client with failover
    │   ├── mock-data.ts           # Executive demonstration datasets
    │   └── prisma.ts              # Prisma Client singleton with connection pooling
    └── types/
        ├── ai.ts                  # Structured AI schemas & tone modifiers
        ├── email.ts               # Domain email & thread interfaces
        └── user.ts                # Executive profile types
```

---

## 🔌 API Overview

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/[...all]` | `*` | Better Auth endpoint handling Google OAuth authentication. |
| `/api/gmail/sync` | `POST` | Triggers incremental or forced delta synchronization with Gmail. |
| `/api/gmail/threads` | `GET` | Fetches prioritized, categorized threads with cached AI summaries. |
| `/api/gmail/action` | `POST` | Executes inbox actions (archive, snooze, mark as read, label modification). |
| `/api/gmail/send` | `POST` | Dispatches approved reply or new email via Gmail REST API. |
| `/api/ai/analyze` | `POST` | Generates deep thread analysis, scoring, and extracted decisions. |
| `/api/ai/draft` | `POST` | Generates tone-modulated contextual replies with optional revisions. |
| `/api/ai/briefing` | `GET` | Computes the morning executive briefing and top priorities. |
| `/api/events` | `GET` | Server-Sent Events (SSE) stream for instant real-time client reactivity. |

---

## 🛡️ Security & Privacy Guardrails

- **Zero-Storage of Raw Binaries**: Binary email attachments are never saved on application servers; only non-sensitive metadata (file name, MIME type, size) is parsed.
- **Token Security**: OAuth access and refresh tokens are encrypted and managed securely via Better Auth.
- **Sandboxed AI Context**: Email content sent to AI providers is strictly scoped to the active thread context and stripped of sensitive tracking headers.
- **Strict User Intent**: Destructive operations (permanent deletion, outgoing sends) require explicit executive confirmation.

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` / `bun run dev` | Starts the Next.js local development server with Turbopack. |
| `npm run build` / `bun run build` | Compiles the production build. |
| `npm run start` / `bun run start` | Runs the production server. |
| `npm run lint` | Runs ESLint 9 to ensure code quality. |
| `npm run format` | Runs Prettier to enforce consistent code styling. |
| `npx prisma db push` | Synchronizes the Prisma schema with your database. |
| `npx prisma studio` | Launches Prisma Studio for visual database inspection. |

---

## 📄 License

This project is proprietary and confidential. All rights reserved.
