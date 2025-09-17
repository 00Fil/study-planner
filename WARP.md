# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Framework: Next.js (App Router) with TypeScript and Tailwind CSS
- Runtime targets: Node server (local/dev) and Vercel (serverless). Some scraping features are disabled on Vercel; see deployment notes.
- UI: Radix UI components, lucide-react icons, recharts, sonner notifications
- Data layer: browser localStorage via lib/storage.ts; no backend database

Common commands (PowerShell-friendly)
- Install deps: npm install
- Dev server: npm run dev
- Build: npm run build
- Start production build locally: $env:PORT=3000; npm run start
- Lint (flat config): npm run lint

Notes
- Type and ESLint errors are ignored during production builds (next.config.ts: ignoreBuildErrors, ignoreDuringBuilds). Do not rely on this in dev; run lint locally.
- Tailwind v4 is configured through postcss (@tailwindcss/postcss) and globals.css.

Running a single test
- There is no test framework configured in this repo (no jest/vitest/playwright config). If you add one, expose npm scripts (e.g., "test", "test:watch") and document here.

Repo structure (high level)
- app/: Next.js App Router pages and layout
  - layout.tsx: Global HTML structure, fonts, Toaster
  - page.tsx: Dashboard (client component) rendering schedule, exams, homework, smart plan
- components/: Reusable UI wrappers (e.g., AppLayout with Navigation)
- lib/: Core domain and utility logic
  - storage.ts: Single-source of truth using window.localStorage; exposes CRUD for exams, subjects, topics, homework, sessions, stats
  - schedule-helpers.ts: Static weekly schedule and helpers (current/next lesson, optimal study plan)
  - types.ts: TypeScript domain types for plans, exams, subjects, topics, homework, stats
  - classeviva-*.ts: Scraping stubs and alternatives for environments (edge vs. node)
  - utils.ts, auto-sync.ts: Supporting utilities for formatting and syncing (inspect as needed)

Big-picture architecture
- Client-first app. All persistent data is stored in browser localStorage. There is no server DB. Any “sync” or scraping features should either:
  1) run client-side, or
  2) run in a compatible environment (local Node with Puppeteer), or
  3) be replaced by manual import flows (CSV/JSON or copy-paste).
- Dashboard (app/page.tsx) aggregates:
  - Storage getters: getExams, getHomework, getStudyStats, getCurrentWeekPlan, getSubjects, getTopics
  - Schedule helpers: getCurrentLesson, getNextLesson, getTodayLessons, getOptimalStudyPlan
  - UI state derives from these sources; no global state manager is used.
- Subjects/Topics link: storage.saveTopic also updates the corresponding subject.topics to keep lists in sync.
- Stats derivation: getStudyStats integrates completed exam grades with utils.calculateAverageGrade at read-time.

Environment and deployment
- Vercel: Server-side scraping is not available (see VERCEL_DEPLOYMENT.md). Use copy-paste or file import for ClasseViva data. The edge scraper returns instructions instead of scraping.
- Alternative deployments (Railway/Render/Fly/etc.) can support Puppeteer if containerized; see render.yaml, railway.json, Dockerfile, and VERCEL_DEPLOYMENT.md notes.
- Devcontainer: .devcontainer/devcontainer.json provides a containerized dev setup if you use VS Code Dev Containers.

Data model essentials
- Exam: { id, date, subject, type, topics[], priority, status, grade? }
- Subject: { name, displayName?, color, topics?, averageGrade, ... }
- Topic: { id, subjectName, title, difficulty, importance, markedForExam?, examIds? }
- Homework: { id, subject, description, dueDate, status, priority }
- WeeklyPlan/StudySession/Task for planning the week

Working on features
- Reading/writing data: Always use functions from lib/storage.ts (they guard for window presence and keep related state in sync).
- Schedule features: Update lib/schedule-helpers.ts; keep timeSlots/days aligned with helpers expecting specific keys (LUN/MAR/MER/GIO/VEN/SAB).
- Dashboard behavior: app/page.tsx orchestrates data fetch, time-based updates, and renders cards; extend via lib functions and pass through AppLayout.

Linting/style
- ESLint: next/core-web-vitals and next/typescript via flat config (eslint.config.mjs). The legacy .eslintrc.json adds a few relaxed rules for TS and React; prefer the flat config.
- TypeScript: strict, noEmit, bundler resolution, path alias @/* to repo root.

Known limitations / gotchas
- localStorage-only persistence means data is per-browser; exporting/importing JSON can be provided via UI flows (some already exist).
- On Vercel, ClasseViva auto-sync is disabled; use manual import methods described in VERCEL_DEPLOYMENT.md.
- Production builds will succeed even with type/lint errors due to next.config.ts; ensure CI or local checks for quality.
