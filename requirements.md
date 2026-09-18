# Frontend Requirements & Stack

This document outlines the technical requirements, dependencies, and environment specifics for the EventEase Frontend application.

## Core Stack

- **Framework:** Next.js `16.3.5` (App Router)
- **Library:** React `19.2.8` and React DOM `19.2.8`
- **Language:** TypeScript `^5`
- **Node.js Environment:** `v20.x` or higher recommended

## Styling & UI Libraries

- **Styling Engine:** Tailwind CSS `^4` (with `@tailwindcss/postcss`)
- **Animation:** 
  - `framer-motion` `^13.4.0` (used for smooth entry/exit animations, hover effects)
  - `tw-animate-css` `^1.4.0`
- **UI Components & Utilities:**
  - `shadcn/ui` based components (`shadcn` `^4.21.0`)
  - `lightswind` `^3.2.5` (advanced glowing and layout components)
  - `@base-ui/react` `^1.8.0`
- **Icons:** `lucide-react` `^1.47.0`
- **Class Merging:** 
  - `clsx` `^2.1.1`
  - `tailwind-merge` `^3.7.0`
  - `class-variance-authority` `^0.7.1` (CVA for component variants)

## Development & Build Tools

- **Linter:** ESLint `^9` with `eslint-config-next`
- **Type Checking:** TypeScript compiler (`tsc`)

## Environment Variables

The application requires a `.env.local` file at the root to function correctly against the backend API.

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

*Note: Ensure `NEXT_PUBLIC_API_URL` points to the local or deployed instance of the EventEase FastAPI backend.*

## Key Features

1. **Role-Based Interfaces:**
   - **Attendees:** Can browse events, view personalized accessibility match scores, and submit accommodation requests.
   - **Organizers:** Can access the global dashboard, manage events, and review/respond to incoming accessibility requests.
2. **Server-Side Rendering & App Router:**
   Leverages Next.js App Router for optimal rendering strategies, improving SEO and initial load times.
3. **Rich Interactions:**
   Utilizes highly polished animated components (e.g., Magic Card, Interactive Grid Pattern, Shine Border) to deliver a premium user experience.

## Minimum Hardware Requirements for Development
- **RAM:** Minimum 4GB (8GB recommended for comfortable Next.js compilation)
- **Disk Space:** ~500MB for dependencies (`node_modules`)
