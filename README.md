<div align="center">

# EventEase - Frontend Web Application

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<p align="center">
  EventEase is an inclusive platform that empowers individuals with mobility access needs - such as wheelchair users, crutch users, seniors, pregnant people, and stroller users - to make confident, informed decisions when attending public events.
</p>

</div>

## Problem and Solution

Generic accessibility labels like "Accessible" vs "Not Accessible" omit critical venue details. They fail to communicate whether a step-free entrance exists, if accessible restrooms are available, or how far attendees must walk from a drop-off point to the main venue area.

EventEase solves this gap by bridging personalized attendee needs with organizer venue claims across seven physical accessibility dimensions. This repository is the web interface for that journey:

1. **Attendees** set their needs, browse events with a personal 0-100 match score, send accessibility requests, accept the organizer's answer, and verify the result after the event.
2. **Organizers** publish events with their accessibility claims, answer incoming requests, and follow their reliability score.

The scoring and data live in the backend. See [BE-EventEase](https://github.com/NAKBK/BE-EventEase).

## Technical Architecture & Tech Stack

```text
       ┌────────────────────┐
       │ Frontend (this)    │
       │ Next.js App Router │
       │ Tailwind CSS       │
       └─────────┬──────────┘
                 │ HTTP / REST API
                 ▼
 ┌────────────────────────────┐
 │  BE-EventEase (FastAPI)    │
 │  Match score, requests,    │
 │  verification, reliability │
 └────────────────────────────┘
```

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, `shadcn/ui`, `lightswind`, `@base-ui/react`
- **Animation:** Framer Motion, `tw-animate-css`
- **Maps:** Leaflet with React Leaflet
- **Icons:** Lucide React

Exact versions are listed in `package.json`.

## Key Justification

Short version of the choices a reviewer might question. The full list of differences from the proposal, with reasons, is in [`docs/PERUBAHAN.md`](docs/PERUBAHAN.md).

- **The frontend never calculates the match score or the reliability score.** It displays what the backend returns, including the per-attribute breakdown, the list of unknown claims, and the weight version. This keeps one source of truth and avoids two screens showing different numbers.
- **Unknown information is shown as unknown.** If an organizer has not stated a claim, the app says so and explains that it counts as not fulfilled, instead of quietly assuming the venue is accessible.
- **Scores are labeled as provisional.** The match weights are not yet derived from a user panel study, so the app shows the weight version next to the score. See [entry 1](docs/PERUBAHAN.md).
- **Needs are entered as a checklist, not as a diagnosis.** Six required or not-required choices and a walking distance tolerance describe what a person needs without any medical label.
- **A commitment requires the attendee's acceptance.** An organizer's response only becomes a saved commitment after the attendee accepts it, and only accepted commitments can be verified after the event.
- **Routes and in-venue navigation are not shown.** No verified venue map data exists, so the app does not guess. See [entry 3](docs/PERUBAHAN.md).

## Prerequisites

- Node.js 20 or newer
- npm (bundled with Node.js)
- An internet connection in the browser, for Google Fonts and OpenStreetMap map tiles
- A running EventEase backend. Either run [BE-EventEase](https://github.com/NAKBK/BE-EventEase) locally (default `http://localhost:8000`), or point the frontend to a hosted instance.

## How to Build and Run

### 1. Install dependencies

```bash
npm install
```

The repository includes an `.npmrc` with `legacy-peer-deps=true`, so no extra flags are needed.

### 2. Configure the backend address

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Use the address of your backend without a trailing slash. If you run the backend locally, its `CORS_ORIGINS` setting must include `http://localhost:3000`, which is the default in the backend's `.env.example`.

### 3. Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build and run for production

```bash
npm run build
npm run start
```

`npm run lint` runs the linter.

## Trying the Full Journey

The backend ships with seeded Jakarta events, so no data entry is needed to start. There is no demo login in the frontend. Register two accounts on the Daftar page, one per role, using two browsers or a private window for the second:

1. **Attendee:** open Profil and save your needs, then browse events on the home page and compare scores. Open an event, read the breakdown, and send an accessibility request.
2. **Organizer:** on the dashboard, open the new request and respond with a decision and a note. Under Acara you can also register a new event with its seven accessibility claims.
3. **Attendee:** open Permintaan, read the response, and accept it. Then open a finished event under Verifikasi and rate each of the seven attributes.
4. **Organizer:** the reliability score on the dashboard and profile now reflects the verification.

The same journey is described step by step at the API level in the backend's [demo flow](https://github.com/NAKBK/BE-EventEase/blob/main/docs/flows.md).

## Pages

| Route | Who | Purpose |
| --- | --- | --- |
| `/` | Everyone | Landing page for visitors, event discovery for attendees |
| `/login`, `/register` | Visitors | Sign in or create an account with a role |
| `/profile` | Both | Attendees edit their needs. Organizers see their score and event history |
| `/events/[id]` | Attendee | Event details, match breakdown, request form |
| `/history` | Attendee | All accessibility requests, with accept or decline |
| `/request` | Attendee | Send a request for a chosen event |
| `/verification` | Attendee | Post-event verification |
| `/dashboard` | Organizer | Request counters, reliability score, respond to requests |
| `/event` | Organizer | List and register events, with photos and venue location |

## Project Structure

```text
FE-EventEase/
├── src/
│   ├── app/                   # Pages (Next.js App Router)
│   ├── components/
│   │   ├── attendee/          # Home, filters, map, requests, profile
│   │   ├── organizer/         # Venue location picker
│   │   ├── lightswind/        # Animated UI blocks
│   │   └── ui/                # Base components (buttons, cards, etc.)
│   ├── hooks/                 # Shared React hooks
│   └── lib/
│       ├── api.ts             # Backend calls, types, session handling
│       └── attendee-ui.ts     # Labels and formatting for attendee screens
├── public/                    # Static assets
├── docs/                      # Project documentation
├── .npmrc                     # npm settings
└── package.json               # Dependencies and scripts
```

## Documentation

This README is the quick tour. For anything deeper, see [`docs/`](docs/):

1. [Changes from the Proposal (PERUBAHAN.md)](docs/PERUBAHAN.md)
2. [Backend repository and its docs](https://github.com/NAKBK/BE-EventEase)
