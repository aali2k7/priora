# Priora — AI Executive Email Assistant

Priora is an AI Executive Email Assistant designed for high-stress executives, founders, and leaders. It transforms raw email overload into calm, actionable clarity by answering a single question within 5 seconds of opening:

> **"What do I need to pay attention to today?"**

## Project Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **Primitives & Icons**: Radix UI Primitives, Lucide React
- **Forms & Validation**: React Hook Form, Zod

## Getting Started

### Prerequisites
- Node.js v20+
- npm v10+

### Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Installation & Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure
```
src/
├── app/                  # Next.js 16 App Router
│   ├── (auth)/           # Authentication route group
│   ├── (dashboard)/      # Dashboard route group
│   ├── globals.css       # Tailwind CSS v4 design tokens
│   └── layout.tsx        # Root layout
├── lib/                  # Utilities (cn helper)
└── types/                # Domain type declarations
```
