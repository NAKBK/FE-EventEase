<div align="center">

# EventEase — Frontend Web Application

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<p align="center">
  EventEase is an inclusive platform that empowers individuals with mobility access needs—such as wheelchair users, crutch users, seniors, pregnant people, and stroller users—to make confident, informed decisions when attending public events.
</p>

</div>

## Problem and Solution

Generic accessibility labels like "Accessible" vs "Not Accessible" omit critical venue details. They fail to communicate whether a step-free entrance exists, if accessible restrooms are available, or how far attendees must walk from a drop-off point to the main venue area.

EventEase solves this gap by bridging personalized attendee needs with organizer venue claims across seven physical accessibility dimensions. The frontend provides a seamless, highly-accessible, and visually rich interface for:
1. **Attendees** to view transparent 0–100% match scores and submit accessibility requests.
2. **Organizers** to manage their events, review incoming accessibility requests, and monitor their reliability scores.

## Technical Architecture & Tech Stack

```text
       ┌────────────────┐
       │   Frontend     │
       │ (Next.js / FE) │
       │  ├── App Router│
       │  ├── Tailwind  │
       │  └── Framer    │
       └───────┬────────┘
               │ HTTP / REST API (Fetch)
               ▼
 ┌────────────────────────────┐
 │  BE-EventEase (FastAPI)    │
 └────────────────────────────┘
```

- **Framework:** Next.js 16.3.5 (App Router)
- **UI & Styling:** Tailwind CSS v4, `shadcn/ui`, `lightswind`, and `@base-ui/react`
- **Animations:** Framer Motion (`framer-motion`) & `tw-animate-css`
- **Language:** TypeScript
- **Icons:** Lucide React

## Key Frontend Decisions

- **Server and Client Components:** The application aggressively uses Server Components where possible for fast initial loads and SEO, only dropping into `"use client"` for interactive elements (like the Magic Card UI, Animated Text, and forms).
- **Role-Based Routing via State:** Since this is a hackathon/MVP build, role parsing (`attendee` vs `organizer`) relies on `localStorage` tokens upon login to dynamically adjust Navbar layouts and restrict access to specific views (e.g., Organizer Dashboard vs Attendee Request History).
- **Rich, Premium UI with Custom Animations:** Instead of standard generic UI kits, the frontend integrates complex micro-animations (like `ShineBorder`, `InteractiveGridPattern`, and `TextRoll`) to provide an emotional, premium, and trustworthy user experience.
- **Form Controls:** Registration, Login, and Event Creation utilize controlled React state coupled with native HTML5 validation constraints before submitting JSON payloads to the FastAPI backend.

## Quick Start Guide

### 1. System Requirements
- Node.js `>= 20.x`
- npm (or pnpm/yarn)

### 2. Dependency Setup

Install the required packages:
```bash
npm install
```

### 3. Environment Configuration (`.env.local`)
Create a `.env.local` file at the root of your project:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Run Local Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```text
FE-EventEase/
├── src/
│   ├── app/                   # Next.js App Router Pages
│   │   ├── dashboard/         # Organizer Dashboard
│   │   ├── event/             # Event Management (Organizer)
│   │   ├── login/             # Auth Login Route
│   │   ├── profile/           # User/Organizer Profiles
│   │   ├── register/          # Auth Registration Route
│   │   ├── globals.css        # Global CSS & Tailwind Entry
│   │   └── page.tsx           # Main Landing Page
│   ├── components/            # Reusable UI Components
│   │   ├── lightswind/        # Complex animated UI blocks
│   │   ├── ui/                # Core base components (Buttons, Inputs, etc.)
│   │   └── Navbar, Footer     # Global layout components
│   └── lib/                   # Utility functions (e.g. `cn` for class merging)
├── public/                    # Static assets (images, logos)
├── requirements.md            # Detailed dependencies & tech stack list
├── package.json               # NPM Dependencies & Scripts
├── tailwind.config.ts         # Tailwind configuration
└── next.config.mjs            # Next.js compiler configuration
```

## Documentation & Further Reading

1. Check out `requirements.md` for a comprehensive list of all UI libraries and dependencies used in this project.
2. For details on the Backend API contracts that this frontend consumes, please refer to the backend repository documentation.
