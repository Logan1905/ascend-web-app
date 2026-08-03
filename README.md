# Fitness Application

A private fitness and nutrition web application for a small group of internal
users. This repository currently contains **only the technical foundation** —
no application features are implemented yet.

The app is designed as a responsive browser application, primarily for desktop
and mobile browsers.

## Technology Stack

- **[Next.js](https://nextjs.org/)** (App Router) with **React** and **TypeScript**
- **[Tailwind CSS](https://tailwindcss.com/)** for styling
- **[shadcn/ui](https://ui.shadcn.com/)** for UI components
- **[Supabase](https://supabase.com/)** for the database, authentication, and storage (client foundation only)
- **[React Hook Form](https://react-hook-form.com/)** + **[Zod](https://zod.dev/)** for forms and validation
- **[Recharts](https://recharts.org/)** for charts
- **[date-fns](https://date-fns.org/)** for date utilities
- **[Lucide React](https://lucide.dev/)** for icons
- **ESLint** + **Prettier** for linting and formatting

## Prerequisites

- **Node.js 20.9+** (required by Next.js 16)
- **npm** (ships with Node.js)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

Then set the following variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

These values are found in your Supabase project under
**Project Settings → API**. The `.env.local` file is git-ignored and must never
be committed.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Available Scripts

| Script                 | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start the development server.             |
| `npm run build`        | Create a production build.                |
| `npm run start`        | Run the production build.                 |
| `npm run lint`         | Run ESLint.                               |
| `npm run type-check`   | Run the TypeScript compiler (no emit).    |
| `npm run format`       | Format the codebase with Prettier.        |
| `npm run format:check` | Check formatting without writing changes. |

## Project Structure

```
src/
├── app/           # Next.js App Router entry (layout, pages, global styles)
├── components/
│   ├── ui/        # shadcn/ui components
│   └── shared/    # Shared, reusable components
├── lib/
│   ├── supabase/  # Supabase client configuration (browser + server)
│   └── utils/     # Utility helpers (e.g. `cn`)
├── hooks/         # Reusable React hooks
├── types/         # Shared TypeScript types
├── schemas/       # Shared Zod validation schemas
└── config/        # App-wide, non-secret configuration
```

## How Supabase Is Connected

The Supabase client foundation is configured but no tables, authentication
flows, Row Level Security policies, or storage buckets exist yet.

- `src/lib/supabase/client.ts` — creates a browser client for use in Client
  Components.
- `src/lib/supabase/server.ts` — creates a server client for Server Components,
  Route Handlers, and Server Actions (uses the async `cookies()` API).

Both read from the `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables. Database schema,
authentication, and storage will be added later as features are built.

## Adding shadcn/ui Components

shadcn/ui is initialized. Add components as needed, for example:

```bash
npx shadcn@latest add card
```
