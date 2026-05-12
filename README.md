# Hack-Flow: Mission Control Engine

![License](https://img.shields.io/badge/License-MIT-emerald.svg) ![Next.js](https://img.shields.io/badge/Next.js-15-black.svg) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue.svg) ![AI](https://img.shields.io/badge/AI-Gemini_3.1-orange.svg)

**Hack-Flow** is an automated infrastructure engine for engineering competitions, transforming passive events into proactive experiences using AI-driven technical guidance and real-time spectator dashboards.

---

## ?? Key Features
- **Global War Room**: Spectator dashboard showing live fleet status, commits, and a scrolling achievement ticker.
- **Proactive AI Architect**: An AI technical lead that analyzes commits and broadcasts high-impact advice.
- **Proof of Work Verification**: Task completion is tied directly to GitHub commit hashes.

## ?? Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Realtime)
- **AI & Auth**: Gemini 3.1, NextAuth.js

## ?? Architecture
- /war-room: Live spectator engine for event halls.
- /lab: Student-facing "Mission Control" terminal.
- /dashboard: Organizer Command Center.
- /admin/fleet-cmd: System override controls.

## ?? Setup & Installation

`ash
git clone https://github.com/your-repo/hack-flow.git
cd hack-flow
npm install

# Configure .env.local with:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, NEXTAUTH_SECRET

npm run dev
`

**Engineered for the 1%. Mission Control Secured.**
© 2026 Hack-Flow Protocol.
