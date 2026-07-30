# Vigil — Live Global Monitoring Dashboard

> A real-time global monitoring dashboard, built as a portfolio project to demonstrate proficiency in modern frontend engineering: component architecture, real-time communication, consuming multiple public APIs, responsiveness, and performance.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)

---
<img width="1719" height="1255" alt="image" src="https://github.com/user-attachments/assets/7ae00ab8-7c9c-4083-bb29-beebf9f15b7b" />

## The Project

**Vigil** aggregates data from multiple global sources into a single, compact and responsive dashboard. The core idea is to demonstrate the ability to integrate heterogeneous systems — WebSockets, polling REST APIs, XML feeds, geolocation services — while keeping the interface fluid, lightweight, and informative.

The dashboard is split into a **summary view** (home page with all widgets in miniature) and **individual pages** per data domain, where the experience expands with more detail, interactivity, and dedicated visualizations.

---

## Features & Data Sources

| Widget | Source | Type |
|---|---|---|
| **Crypto** | CoinGecko + Binance | REST + WebSocket |
| **ISS** | Open-Notify + WhereTheISS | REST polling |
| **Natural Events** | GDACS (UN/EU) | RSS/XML via proxy |
| **Seismic** | USGS Earthquake Catalog | REST |
| **News** | The Guardian Open API | REST |
| **Weather** | Open-Meteo + OpenAQ | REST |
| **GitHub Trending** | GitHub Search API | REST |
| **Wikipedia** | Wikipedia REST API | REST |

---

## Tech Stack

### Core
- **React 19** — with `lazy()` + `Suspense` for route-based code splitting
- **TypeScript 6** — strict typing across the codebase; zero implicit `any`
- **Vite 8 (Rolldown)** — build with `manualChunks` to split heavy vendors (globe, leaflet, recharts, framer-motion)
- **Tailwind CSS v4** — utility-first with a design system based on CSS variables and opacity tokens

### State & Data
- **TanStack Query v5** — server cache, stale-while-revalidate, automatic retry and request deduplication
- **Zustand v5** — minimal global state for: selected crypto IDs, Binance tickers (WebSocket), geolocation, alerts, and preferences
- **Separation of concerns**: each API has its own module in `src/api/`, returning TanStack Query hooks with explicit types

### Real-Time Communication
- **Binance WebSocket** (`wss://stream.binance.com`) — real-time mini-ticker for crypto prices, with a Zustand store as buffer. Connects only on the `/crypto` page to save resources
- **Price flash** — each crypto row detects the direction of change (`up/down`) and applies a transient color for 500ms using `useRef` + `useEffect`

### Routing
- **React Router v7** — lazy routes with `Suspense`, every page is an independent chunk
- Pattern: dashboard as global summary → dedicated pages per domain (`/crypto`, `/iss`, `/earthquakes`, etc.)

### Visualizations
- **react-globe.gl** — 3D WebGL globe for ISS tracking with trajectory trail
- **Recharts** — area charts (sparklines, 7-day history) and order book depth
- **Leaflet + react-leaflet** — interactive maps for seismic and natural events
- **Native Canvas** — animated background particles via `requestAnimationFrame` with no extra dependency

### Proxy & CORS
- **Vite dev proxy** — works around GDACS's CORS (self-signed certificate) with `secure: false`
- **Vercel Rewrites** (`vercel.json`) + **Netlify `_redirects`** — production proxy to the same endpoint
- Documented strategy: the frontend always calls `/api/gdacs/...`, the environment resolves the target

---

## Architecture Decisions

### Widget Shell
All widgets share a `WidgetShell` that encapsulates: header with title/icon, LIVE indicator, loading/error state with retry, and a navigation link to the dedicated page. This ensures visual consistency and avoids duplicating UI state logic.

### Aggressive Code Splitting
Heavy widgets (3D globe, Leaflet maps) are fully isolated into separate chunks via `React.lazy()`. The dashboard only loads the Dashboard chunk — the rest load on demand. The Three.js/Globe vendor (~476KB gz) never blocks the initial load.

### Dashboard Performance
- Binance WebSocket disconnected on the dashboard (only active on `/crypto`)
- `React.memo` on list components that receive frequent updates (`CompactCoinRow`)
- `useMemo` for expensive derived calculations (chart domain, seismic sorting, brief insights)
- Widgets loaded with `Suspense` + animated skeleton, without blocking the main thread

### Responsiveness
Three-tier layout:
- **Mobile** (`< md`): single column, natural scroll, compact header
- **Tablet** (`md`): 2-column grid, stacked side panels
- **Desktop** (`lg+`): fixed `h-screen overflow-hidden` layout, 3/5-column grids, no scroll

### Gestalt & Visual Hierarchy
The `DailyBrief` (insights panel) explicitly applies visual design principles: critical alerts get larger cards, a thicker highlight bar, a pulsing dot, and a colored gradient. Informational items recede visually. Sort order is `alert → warning → info`.

---

## Project Structure

```
src/
├── api/              # Data hooks (one file per service)
│   ├── types/        # TypeScript types for API responses
│   ├── binance.ts    # Binance WebSocket
│   ├── coingecko.ts  # Crypto market
│   ├── gdacs.ts      # Global natural events (XML parser)
│   ├── guardian.ts   # The Guardian news
│   ├── iss.ts        # ISS tracking
│   ├── openmeteo.ts  # Weather
│   └── usgs.ts       # Seismic activity
├── components/
│   ├── layout/       # Header, DailyBrief, PageLayout, WidgetShell
│   └── ui/           # LiveTickerBar, WidgetSkeleton, ParticleBackground
├── engine/
│   └── brief.ts      # Vigil Brief insight generator
├── pages/            # One page per route (lazy loaded)
├── store/            # Zustand stores (app, binance, geo, alerts)
└── widgets/          # One directory per data domain
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server (with GDACS proxy)
npm run dev

# Production build
npm run build
```

> **Optional environment variables:**
> ```
> VITE_GUARDIAN_API_KEY=your_key   # default: The Guardian's "test" demo key
> ```

---

## Deployment

The project is configured for **Vercel** (rewrites in `vercel.json`) and **Netlify** (`public/_redirects`), both resolving the GDACS proxy in production.

---

*Portfolio project — Miguel Guerreiro*
