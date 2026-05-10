# Hack-Flow: The Mission Control Engine

![License](https://img.shields.io/badge/License-MIT-emerald.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue.svg)
![AI](https://img.shields.io/badge/AI-Gemini_3.1-orange.svg)

**Hack-Flow** is a high-octane, automated infrastructure engine for engineering competitions. Unlike traditional hackathon platforms, Hack-Flow moves beyond passive data storage to become a proactive, living participant in the event. It uses AI-driven engineering pulses to verify progress, coach teams, and turn technical development into a spectator sport.

---

## 🚀 The X-Factor: What Makes Us Different?

### 1. The Global War Room
A high-immersion spectator dashboard designed for large event-hall screens. 
- **Live Fleet Status**: Reactive grid of all teams. Nodes glow **Emerald** on fresh commits and turn **Dim Red** during inactivity.
- **Meme Pulse**: Real-time AI "vibe detection" of GitHub commits. When a team pushes code, a snarky or hype meme flashes across the screen based on the technical complexity of the change.
- **Global Ticker**: A scrolling marquee of real-time achievements across the entire fleet.

### 2. The Proactive Architect (AI Agent)
The AI doesn't wait for a judge; it acts as an elite Technical Lead.
- **Tactical Broadcasts**: Every 15-30 minutes, the Architect analyzes team commits and Kanban status to push blunt, high-impact technical advice directly to the student's terminal.
- **Engineering Pulse**: Automated scoring based on actual GitHub evidence (Proof of Work), not just user input.

### 3. Neural Link Handshake
Task verification is tied directly to GitHub commit hashes. You don't just "move a card"—you prove the logic exists.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), Framer Motion, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime Handshake)
- **AI Engine**: Google Gemini 3.1 (Flash & Pro)
- **Auth**: NextAuth.js (Credential-to-OAuth linking)
- **Visuals**: HTML5 Canvas Particle Engine (UI UX Pro Max Standards)

---

## 📁 Core Architecture

- **`/war-room`**: The live spectator engine for event halls.
- **`/lab`**: The student-facing "Mission Control" terminal and Kanban.
- **`/dashboard`**: The Organizer Command Center for fleet management.
- **`/admin/fleet-cmd`**: Global override and system integrity controls.

---

## 📅 Roadmap: Upcoming Features

### 🤖 The Organizer Fleet Agent (Next Update)
A dedicated AI agent for event managers to handle high-volume support.
- **Fleet Summaries**: Ask "Which teams are struggling with Auth?" and get instant technical triage.
- **Automated Announcements**: AI-scheduled mission updates based on overall fleet velocity.
- **Resource Allocation**: Predicts which teams need physical mentor intervention before they even ask.

### 🧬 Technical DNA Fingerprinting
At the end of the mission, every student receives a unique, data-driven SVG "Fingerprint" of their project's complexity (Logic vs UI vs Security) to share on professional networks.

### 🌐 Cross-Node Networking
Allow teams to "broadcast" technical questions to other active nodes, fostering a global engineering community.

---

## 🛠 Installation & Setup

1. **Clone the Repo**
   ```bash
   git clone https://github.com/your-repo/hack-flow.git
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` with the following:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `NEXTAUTH_SECRET`
   - `SMTP_...` (for credential dispatch)

4. **Initialize Registry**
   Run the SQL provided in the `AGENTS.md` file within your Supabase SQL Editor.

5. **Launch Node**
   ```bash
   npm run dev
   ```

---

## 🔒 Security Protocol
- **End-to-End Encryption**: Lab sessions are secured via signed JWTs using `SUPABASE_JWT_SECRET`.
- **Identity Protection**: 6-digit numeric IDs and PINs generated via `crypto.randomInt`.
- **Admin Lockout**: Root credentials strictly gated behind `SUPER_ADMIN` protocol.

---

**Engineered for the 1%. Mission Control Secured.**
© 2026 Hack-Flow Protocol.
