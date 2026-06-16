# ResearchAccelerantAgent

An AI-powered, full-stack academic literature review assistant. It searches peer-reviewed databases, synthesizes cross-study findings, generates problem statements, and exports polished LaTeX/PDF documents.

> **Repository:** [Macreat/ResearchAccelerantAgent](https://github.com/Macreat/ResearchAccelerantAgent)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Development Scripts](#development-scripts)
- [Project Structure](#project-structure)
- [LaTeX Prompt Template](#latex-prompt-template)
- [License](#license)

---

## Overview

**ResearchAccelerantAgent** automates the heavy lifting behind academic literature reviews. Users submit a research topic, and the system orchestrates a pipeline of intelligent agents:

1. **Search Agent** — Queries Semantic Scholar and OpenAlex for relevant, recent, highly-cited papers.
2. **Extraction Agent** — Parses metadata, abstracts, methodology, and key findings.
3. **Synthesis Agent (V2)** — Identifies overarching themes, recurring gaps, and methodological patterns across studies.
4. **Problem Statement Generator (V3)** — Crafts a formal research gap statement grounded in the synthesized evidence.
5. **LaTeX Engine** — Compiles everything into a publication-ready LaTeX document (and optional PDF).

The application is built as a modern type-safe monolith: a React SPA talking to a Hono/tRPC backend, backed by MySQL via Drizzle ORM.

---

## Features

| Version | Capability |
|---------|------------|
| **MVP** | Search academic APIs, retrieve papers, format citations (APA, MLA, Chicago, IEEE, BibTeX), and store results. |
| **V2** | Cross-study synthesis, gap analysis, impact assessment, and future directions. |
| **V3** | Structured problem statement generation with stakeholder analysis and consequences of inaction. |
| **All** | LaTeX/PDF export for literature reviews, syntheses, problem statements, and full pipeline reports. |

- **Real-time session tracking** — Monitor search progress from `pending` → `searching` → `extracting` → `synthesizing` → `drafting` → `completed`.
- **Human-in-the-loop review** — Review, approve, or reject generated problem statements before export.
- **Responsive UI** — Built with Tailwind CSS and 40+ shadcn/ui primitives.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite v7.2.4, Tailwind CSS v3.4.19, shadcn/ui, React Router v7 |
| **Backend** | Hono (Node.js), tRPC v11, SuperJSON |
| **Database** | MySQL, Drizzle ORM, drizzle-kit |
| **Search APIs** | Semantic Scholar, OpenAlex |
| **Build Tools** | Vite (frontend), esbuild (backend bundle) |
| **Dev Server** | `@hono/vite-dev-server` (unified frontend + API HMR) |
| **Testing** | Vitest |
| **Lint / Format** | ESLint, Prettier |

---

## Architecture

```
┌─────────────────┐
│   React SPA     │  (Vite, React Router, Tailwind, shadcn/ui)
│   src/pages/    │
└────────┬────────┘
         │ tRPC over HTTP (/api/trpc)
         ▼
┌─────────────────┐
│   Hono Server   │  (Node.js HTTP framework)
│   api/boot.ts   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  tRPC Router (api/router.ts)                │
│  ├── search      → academic-search.ts       │
│  ├── synthesis   → synthesis-engine.ts      │
│  ├── statement   → problem statement gen  │
│  └── latex       → latex-generator.ts       │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   MySQL DB      │  (Drizzle ORM)
│   db/schema.ts  │
└─────────────────┘
```

**Data Flow**
1. The browser loads the React SPA from Vite's dev server (port 3000).
2. Frontend calls tRPC procedures via `@trpc/react-query` over `/api/trpc`.
3. Hono intercepts the request and forwards it to the tRPC fetch adapter.
4. The tRPC router dispatches to domain routers (`search`, `synthesis`, `statement`, `latex`).
5. Services persist state in MySQL using Drizzle ORM and return typed responses back to the UI.

---

## Database Schema

The MySQL schema (managed by Drizzle ORM) centers on five core tables:

| Table | Purpose |
|-------|---------|
| `search_sessions` | Core entity for each literature review request (topic, filters, status, version). |
| `papers` | Individual papers retrieved from academic APIs (metadata, abstracts, findings, methodology). |
| `synthesis_results` | Cross-study synthesis and gap analysis output (V2). |
| `problem_statements` | Final problem statement with optional human feedback and LaTeX output (V3). |
| `latex_outputs` | Generated LaTeX documents and compiled PDF URLs. |

See [`app/db/schema.ts`](app/db/schema.ts) for full column definitions and relations.

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **MySQL** database (local or hosted)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Macreat/ResearchAccelerantAgent.git
   cd ResearchAccelerantAgent/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide:
   ```env
   APP_ID=your-app-id
   APP_SECRET=your-app-secret
   DATABASE_URL=mysql://user:password@host:port/database
   ```

4. **Push the database schema**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

---

## Development Scripts

All commands should be run from the `app/` directory.

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with unified frontend + Hono API HMR |
| `npm run build` | Build the frontend and bundle the backend for production |
| `npm run start` | Run the production server (`dist/boot.js`) |
| `npm run check` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier on all files |
| `npm run test` | Run Vitest test suite |
| `npm run db:push` | Push Drizzle schema changes to the database |
| `npm run db:generate` | Generate a new Drizzle migration |
| `npm run db:migrate` | Run pending Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio (visual database explorer) |

---

## Project Structure

```
ResearchAccelerantAgent/
├── app/                          # Full-stack web application
│   ├── src/                      # React frontend
│   │   ├── pages/                # Route pages (Home, Session, History)
│   │   ├── components/           # UI components (shadcn/ui + AppLayout)
│   │   ├── providers/            # tRPC & React Query providers
│   │   ├── hooks/                # Custom React hooks
│   │   └── lib/                  # Utility functions
│   ├── api/                      # Hono + tRPC backend
│   │   ├── boot.ts               # Server entry point
│   │   ├── router.ts             # tRPC app router
│   │   ├── middleware.ts         # tRPC initialization
│   │   ├── context.ts            # Request context
│   │   ├── routers/              # Domain routers (search, synthesis, latex, statement)
│   │   ├── services/             # Business logic (search, synthesis, memory, LaTeX)
│   │   └── lib/                  # Server utilities (env, http, static files)
│   ├── db/                       # Database layer
│   │   ├── schema.ts             # Drizzle ORM schema
│   │   ├── relations.ts          # Table relations
│   │   └── migrations/           # Migration files
│   ├── contracts/                # Shared types/errors (frontend ↔ backend)
│   ├── vite.config.ts            # Vite configuration
│   ├── drizzle.config.ts         # Drizzle Kit configuration
│   └── package.json
│
└── prompt_framebox_fixed.tex     # Standalone LaTeX literature-review prompt template
```

---

## LaTeX Prompt Template

The repository includes a standalone LaTeX file — `prompt_framebox_fixed.tex` — which renders a beautifully styled **literature review prompt template** using `tcolorbox`. It is useful for:

- Quickly scaffolding review instructions for LLMs.
- Academic documentation.
- Prompt engineering experiments.

Compile it with any standard LaTeX distribution:
```bash
pdflatex prompt_framebox_fixed.tex
```

---

## License

This project is proprietary and maintained by the repository owner. Please contact the owner for licensing inquiries.

---

*Built with React, Hono, tRPC, Drizzle, and Tailwind CSS.*
