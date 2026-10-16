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
| **Crypto** | CoinGecko (Binance REST fallback) + Binance streams | REST + WebSocket |
| **Economy** | Frankfurter (ECB rates), Banco Central do Brasil SGS, alternative.me Fear & Greed, Coinpaprika, mempool.space | REST |
| **ISS** | Where the ISS at | REST polling |
| **Space** | Launch Library 2, NOAA SWPC, NASA NeoWs, Spaceflight News | REST |
| **Natural Events** | GDACS (UN/EU) event API | GeoJSON REST |
| **Seismic** | USGS Earthquake Catalog | REST |
| **News** | Wikimedia Feed API (headlines, most read, on this day — PT/EN) | REST |
| **Weather** | Open-Meteo forecast, air quality and geocoding (city search) | REST |
| **Rain radar** | RainViewer radar tiles on an Esri dark basemap | REST + map tiles |
| **GitHub Trending** | GitHub Search API | REST |
| **Wikipedia** | Wikipedia REST API | REST |

---

## Tech Stack

### Core
- **React 19** — with `lazy()` + `Suspense` for route-based code splitting
- **TypeScript 6** — strict typing across the codebase; zero implicit `any`
- **Vite 8 (Rolldown)** — routes, widgets, the globe and Leaflet are split on dynamic `import()`, so each page downloads only what it renders
- **Tailwind CSS v4** — utility-first with a design system based on CSS variables and opacity tokens

### State & Data
- **TanStack Query v5** — server cache, stale-while-revalidate, automatic retry and request deduplication
- **Zustand v5** — minimal global state for: selected crypto IDs, Binance tickers (WebSocket), geolocation, alerts, and preferences
- **Separation of concerns**: each data domain lives in `src/features/<domain>/` with its own API module, types and components

### Real-Time Communication
- **Binance WebSocket** (`wss://stream.binance.com`) — real-time mini-ticker for crypto prices, with a Zustand store as buffer. Shared by the dashboard and `/crypto`, reconnects with exponential backoff and closes while the tab is hidden
- **Price flash** — each crypto row detects the direction of change (`up/down`) and applies a transient color for 500ms using `useRef` + `useEffect`

### Routing
- **React Router v7** — lazy routes with `Suspense`, every page is an independent chunk
- Pattern: dashboard as global summary → dedicated pages per domain (`/crypto`, `/iss`, `/earthquakes`, etc.)

### Visualizations
- **react-globe.gl** — 3D WebGL globe for ISS tracking with trajectory trail
- **Recharts** — area charts (sparklines, 7-day history) and order book depth
- **Leaflet + react-leaflet** — interactive maps for seismic and natural events
- **Native Canvas** — animated background particles via `requestAnimationFrame` with no extra dependency

### CORS
- Every source is called directly from the browser: each one was checked for `Access-Control-Allow-Origin`, so no proxy or backend is needed (GDACS moved from its RSS feed, which needed a proxy, to its CORS-enabled GeoJSON API)

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
├── features/              # One folder per data domain
│   ├── crypto/            # CoinGecko + Binance WebSocket (api, components, hooks, store)
│   ├── iss/               # ISS position, orbit and TLE
│   ├── earthquakes/       # USGS
│   ├── natural-events/    # GDACS GeoJSON events
│   ├── weather/           # Open-Meteo forecast + air quality
│   ├── github/  news/  wikipedia/
│   └── brief/             # Vigil Brief insight generator
├── components/            # Shared layout and UI (header, widget shell, skeletons)
├── hooks/                 # Shared hooks (WebSocket, globe, geolocation, auto-advance)
├── lib/                   # Framework-free helpers (HTTP, query client and keys, reconnecting socket)
├── pages/                 # One page per route (lazy loaded)
└── store/                 # Zustand stores shared across features (app, geo, alerts)
```

---

## Running Locally

```bash
# Install dependencies (Node 24, pnpm)
pnpm install

# Start dev server
pnpm dev

# Tests, lint and production build
pnpm test
pnpm lint
pnpm build
```

No API keys are needed: every source is free. NASA's asteroid feed runs on its shared `DEMO_KEY`
(about 10 requests/hour per IP); for a deploy, set a free key from [api.nasa.gov](https://api.nasa.gov):

```
VITE_NASA_API_KEY=your_key
```

---

## Deployment

Deployed on **Vercel**: `vercel.json` only rewrites client routes to `index.html` for the SPA. Every API is called directly from the browser.

---

*Portfolio project — Miguel Guerreiro*
