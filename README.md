# Vigil — Live Global Monitoring Dashboard

> A real-time global monitoring dashboard, built as a portfolio project to demonstrate proficiency in modern frontend engineering: component architecture, real-time communication, consuming multiple public APIs, responsiveness, and performance.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)

---

## The Project

**Vigil** aggregates data from multiple global sources into one terminal-style screen: a single monospace font, a green/red/amber/cyan palette on near-black, bordered panels labelled `[n.m]`, text bars and sparklines instead of chart libraries, and dot-matrix canvases for maps and globes. The core idea is to integrate heterogeneous systems — WebSockets, server-sent events, polling REST APIs, geolocation — while keeping the interface fast, keyboard-driven and honest about where every number comes from and how old it is.

Six screens, each one key away:

| Key | Route | Screen |
|---|---|---|
| `1` | `/` | **Overview**: daily brief, source health and one card per screen |
| `2` | `/markets` | Crypto (live prices, 7-day chart, order book, trades), FX, Brazilian rates, fear & greed |
| `3` | `/planet` | Natural events globe, quake map, weather and air quality, rain radar |
| `4` | `/space` | ISS globe and orbit, launches, space weather, asteroids, space news |
| `5` | `/news` | Wikipedia headlines, live Wikipedia edits, Bluesky trends, random article |
| `6` | `/tech` | GitHub trending repositories, Hacker News front page |

`←/→` move between tabs, `enter` opens, `r` refreshes the current screen. Below 600 px the keybar turns into a bottom tab bar. The UI is translated into Portuguese and English.

---

## Features & Data Sources

| Panel | Source | Type |
|---|---|---|
| **Crypto** | CoinGecko (Binance REST fallback) + Binance streams | REST + WebSocket |
| **Economy** | Frankfurter (ECB rates), Banco Central do Brasil SGS, alternative.me Fear & Greed, Coinpaprika, mempool.space | REST |
| **ISS** | Where the ISS at (position, TLE), orbit propagated in the browser | REST + SGP4 |
| **Space** | Launch Library 2, NOAA SWPC, NASA NeoWs, Spaceflight News | REST |
| **Natural Events** | GDACS (UN/EU) event API | GeoJSON REST |
| **Seismic** | USGS Earthquake Catalog | REST |
| **News** | Wikimedia Feed API (headlines, most read, on this day — PT/EN) | REST |
| **Live pulse** | Wikimedia EventStreams (every Wikipedia edit), Bluesky trending topics | SSE + REST |
| **Weather** | Open-Meteo forecast, air quality and geocoding (city search) | REST |
| **Rain radar** | RainViewer radar tiles, sampled into the dot map | REST + tiles |
| **GitHub Trending** | GitHub Search API | REST |
| **Hacker News** | HN front page via the Algolia API | REST |
| **Wikipedia** | Wikipedia REST API | REST |

### Overview
- **Brief** — rule-based rows built from every source (quakes, air quality, weather, crypto, launches and geomagnetic storms, GitHub and HN, Wikipedia headlines, failing sources), sorted by severity, each timestamped and linking to its screen. Rows are stored as message codes plus parameters and translated on the client, so switching language needs no refetch. "since HH:MM" is the user's previous visit, kept in `localStorage`.
- **Alerts** — thresholds watched from any screen (quake ≥ M5 in the last 24 h, AQI ≥ 100, Kp ≥ 5, 24 h change ≥ 10%) feed the `[alerts n]` popover; dismissed alerts stay dismissed.
- **Sources** — one row per source: ok / degraded (serving cache) / error / reconnecting, latency of the last request, and data age ticking every second.

---

## Tech Stack

### Core
- **React 19** — `lazy()` + `Suspense` route-based code splitting
- **TypeScript 6** — strict typing; raw API payloads are typed at the boundary
- **Vite 8 (Rolldown)** — every screen is its own chunk
- **Tailwind CSS v4** — design tokens (colors, type sizes, breakpoints) in `@theme`; no radius, shadow or gradient anywhere

### State & Data
- **TanStack Query v5** — server cache, stale-while-revalidate, retries and request deduplication
- **Persisted cache** — `@tanstack/react-query-persist-client` keeps the query cache in `localStorage`, so a failing source shows "cache from 3 h ago" in dim text instead of an empty panel, even after a reload
- **Source health** — `fetchOk` times every request and records successes and failures (HTTP status, timeout, network) in a Zustand store; a source registry maps each source to its requests and query keys for the [1.2] panel, the brief and the keybar status
- **Zustand v5** — Binance tickers, stream status, source health, geolocation and alerts
- Each data domain lives in `src/features/<domain>/` with its API module, types, pure helpers and panels

### Real-Time Communication
- **Binance WebSocket** — live mini-ticker for the ticker strip, overview and markets, plus per-coin depth and trade streams
- **Wikimedia EventStreams (SSE)** — every Wikipedia edit, summarised per second
- Both share one reconnecting helper: backoff 1·2·4·8·16 s, an error state after 5 failed attempts, frozen values shown in dim while reconnecting, and closed while the tab is hidden

### Visualizations
- **Dot-matrix maps and globes** on `<canvas>` with **d3-geo** projections and the **world-atlas** land topology: the land mask is rasterized once per size, then drawn as 4 px dots with glyph markers, tracks and crosshair hit-testing
- **Dotted line charts** on canvas with a hover/tap cursor readout
- **satellite.js** — SGP4 propagation of the ISS TLE for the past and future ground track and its day/night segments
- **Text bars and sparklines** (`█`, `▁▂▃▄▅▆▇█`) for histograms, gauges and trends
- Canvases redraw only while on screen and the tab is visible; `prefers-reduced-motion` stops globe rotation and the cursor blink

### CORS
- Every source is called directly from the browser: each one was checked for `Access-Control-Allow-Origin`, so no proxy or backend is needed

---

## Architecture Decisions

### One panel, five states
Every data panel goes through `QueryPanel` (REST) or `StreamPanel` (WebSocket/SSE): loading draws rim-coloured dots shaped like the table to come and turns into an error after 10 s; an error names its cause (HTTP status, timeout, network) with a retry countdown; a failure with cached data shows the cache in dim with its age; a dropped stream shows the reconnect attempt and the downtime. Empty lists say what is empty and when it comes back.

### Terminal primitives
`Panel`, `Tabs` (real `role=tab` buttons with arrow-key navigation), CSS-grid `DataTable`, `StatLine`, `BlockBar`, `Sparkline` and `PromptInput` are shared by every screen. The dev-only `/__primitives` route renders all of them and every panel state.

### Responsiveness
Content spans the full viewport. The overview and space screens use a 12-column grid with spans at 600, 1024 and 1280 px; other rows auto-fit. Below 600 px the header wraps, source labels hide (status labels stay) and list + detail panels get a picker button.

---

## Project Structure

```
src/
├── features/              # One folder per data domain
│   ├── crypto/            # CoinGecko + Binance WebSocket
│   ├── iss/               # ISS position, orbit and TLE
│   ├── earthquakes/       # USGS
│   ├── natural-events/    # GDACS GeoJSON events
│   ├── weather/           # Open-Meteo forecast + air quality
│   ├── economy/  space/  pulse/  hacker-news/
│   ├── github/  news/  wikipedia/
│   ├── brief/             # Brief rules, alert thresholds, last visit
│   └── overview/          # Overview panels and cards
├── components/
│   ├── layout/            # Shell: prompt header, ticker, keybar, tab bar, alerts, shortcuts
│   ├── terminal/          # Panel, tabs, tables, text bars, panel states
│   ├── geo/               # Dot-matrix map and globe canvases
│   └── charts/            # Dotted line chart canvas
├── hooks/                 # Shared hooks (WebSocket, geolocation, clock, source rows)
├── lib/                   # Framework-free helpers (HTTP, query client, source registry, formatting, socket)
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
