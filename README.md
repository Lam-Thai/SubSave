# SubSave

SubSave is a modern subscription finance app that helps users track recurring costs, avoid hidden charges, and make better keep-or-cancel decisions.

It combines a clean dashboard, practical insights, and an AI assistant to make subscription management feel simple and actionable.

---

# Key Features

## 1) Smart Dashboard

- Total monthly subscription cost with animated count-up
- KPI cards for active subscriptions, average cost, trial risk, and spending outlook
- Upcoming billing timeline sorted by nearest charge date

## 2) Subscription Management

- Add, edit, and delete subscriptions
- Track these fields:
  - Name
  - Category
  - Monthly cost
  - Billing day
  - Trial end date
  - Monthly usage count

## 3) Usage Value Analytics

- Recharts-powered Usage Value Meter
- Dual-view chart toggle:
  - Cost per use
  - Monthly cost vs usage count
- Updates immediately after subscription changes (no page reload required)

## 4) Trial Trap Detector

- Highlights trials ending soon so users can cancel before paid renewal

## 5) Sharing Optimizer

- Create circles and members
- Detect duplicate subscriptions across people
- Suggest consolidation opportunities

## 6) In-App AI Assistant (Gemini)

- Ask questions directly inside dashboard chatbox
- Answers are scoped to SubSave features and subscription workflow
- Server-side Gemini integration with authenticated route
- Graceful fallback behavior when provider quota is unavailable
- Error handling via popup modal (not mixed into assistant answers)

## 7) Premium UI and Motion

- Staggered section reveal animations
- Hover lift effects for key cards
- Animated brand accents in header
- Responsive layout for desktop/tablet/mobile
- Reduced-motion support for accessibility

## 8) Reliability & Production Readiness

- Request tracing with `x-request-id` on API responses for easier debugging
- Built-in rate limiting for AI chat and subscription-create endpoints
- Runtime health endpoint at `/api/health` with database check, latency, uptime, and version metadata
- Live system health card on dashboard that auto-refreshes every 30 seconds

---

# Current Tech Stack

## Frontend

- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS
- Recharts (analytics charts)
- Lucide React (icons)
- shadcn/ui style component architecture
- Radix UI primitives:
  - @radix-ui/react-dialog
  - @radix-ui/react-label
  - @radix-ui/react-select
  - @radix-ui/react-slot

## Backend / API

- Next.js Route Handlers (App Router API)
- Zod (request validation)
- NextAuth.js (auth + session)

## Database / ORM

- PostgreSQL
- Prisma ORM
- @prisma/client

## Authentication

- NextAuth.js + Prisma Adapter
- Google OAuth (optional by env)
- Email magic-link (optional by env)
- Dev credentials provider for local development

## Styling / UI Utilities

- class-variance-authority
- clsx
- tailwind-merge

---

# Environment Variables

Create a `.env` file and configure:

Required:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (usually `http://localhost:3000`)
- `GEMINI_API_KEY` (for AI assistant)

Optional auth providers:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Optional email magic-link:

- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

---

# Installation

## 1) Clone and install

```bash
git clone https://github.com/yourusername/subsave.git
cd subsave
npm install
```

## 2) Configure env

```bash
cp .env.example .env
```

Set values listed above.

## 3) Setup database

```bash
npx prisma db push
```

or

```bash
npx prisma migrate dev --name init
```

## 4) Run app

```bash
npm run dev
```

Open: http://localhost:3000

---

# Available Scripts

| Script               | Description                                |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Start development server                   |
| `npm run dev:clean`  | Clear `.next` and start dev server         |
| `npm run build`      | Generate Prisma client and build app       |
| `npm run start`      | Start production server                    |
| `npm run lint`       | Run ESLint                                 |
| `npm run db:push`    | Push Prisma schema to database             |
| `npm run db:migrate` | Create/apply development migrations        |
| `npm run db:studio`  | Open Prisma Studio                         |

---

# Recent Updates

- Added AI chatbox powered by Gemini via `/api/chat`
- Added popup-based error handling for chat provider failures
- Added Recharts dual-view Usage Value analytics
- Fixed live refresh so usage chart updates immediately after CRUD actions
- Added dashboard hero section with product spotlight image
- Added KPI summary cards and upcoming billing timeline
- Added modern motion system (page reveal, staggered cards, hover lift, animated brand accents)
- Added smooth scroll CTA interactions in dashboard
- Added API request ID tracing (`x-request-id`) for faster production debugging
- Added route-level rate limiting for `/api/chat` and subscription writes
- Added `/api/health` endpoint with Prisma connectivity checks and latency reporting
- Added dashboard system-health KPI card with periodic health polling

---

# Project Goal

Help people gain visibility into recurring expenses, avoid unwanted renewals, and optimize subscription value with data-driven insights.

---

# Future Improvements

- Automated subscription detection from transaction data
- Better budget forecasting and savings goals
- AI-generated monthly optimization reports
- Export/share dashboard snapshots
- Mobile app companion


