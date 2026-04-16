# Vigil — Live Global Monitoring Dashboard

> Um painel de monitoramento global em tempo real, construído como projeto de portfólio para demonstrar proficiência em frontend moderno: arquitetura de componentes, comunicação em tempo real, consumo de múltiplas APIs públicas, responsividade e performance.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)

---
<img width="1719" height="1255" alt="image" src="https://github.com/user-attachments/assets/7ae00ab8-7c9c-4083-bb29-beebf9f15b7b" />

## O Projeto

O **Vigil** agrega dados de múltiplas fontes globais num único painel compacto e responsivo. A ideia central é demonstrar a capacidade de integrar sistemas heterogêneos — WebSockets, APIs REST com polling, feeds XML, serviços de geolocalização — mantendo a interface fluida, leve e informativa.

O dashboard é dividido em uma **visão resumida** (página inicial com todos os widgets em miniatura) e **páginas individuais** para cada domínio de dados, onde a experiência é expandida com mais detalhes, interatividade e visualizações dedicadas.

---

## Funcionalidades & Fontes de Dados

| Widget | Fonte | Tipo |
|---|---|---|
| **Crypto** | CoinGecko + Binance | REST + WebSocket |
| **ISS** | Open-Notify + WhereTheISS | REST polling |
| **Eventos Naturais** | GDACS (UN/EU) | RSS/XML via proxy |
| **Sismica** | USGS Earthquake Catalog | REST |
| **Notícias** | The Guardian Open API | REST |
| **Clima** | Open-Meteo + OpenAQ | REST |
| **GitHub Trending** | GitHub Search API | REST |
| **Wikipedia** | Wikipedia REST API | REST |

---

## Stack Técnica

### Core
- **React 19** — com `lazy()` + `Suspense` para code splitting por rota
- **TypeScript 6** — tipagem estrita em toda a base; zero `any` implícito
- **Vite 8 (Rolldown)** — build com `manualChunks` para separar vendors pesados (globe, leaflet, recharts, framer-motion)
- **Tailwind CSS v4** — utility-first com sistema de design baseado em variáveis CSS e tokens de opacidade

### Estado & Dados
- **TanStack Query v5** — cache de servidor, stale-while-revalidate, retry automático e deduplicação de requests
- **Zustand v5** — estado global mínimo para: IDs de crypto selecionados, tickers Binance (WebSocket), geolocalização, alertas e preferências
- **Separação de concerns**: cada API tem seu próprio módulo em `src/api/`, retornando hooks do TanStack Query com tipos explícitos

### Comunicação em Tempo Real
- **Binance WebSocket** (`wss://stream.binance.com`) — mini-ticker em tempo real para preços de crypto, com store Zustand como buffer. Conecta apenas na página `/crypto` para economizar recursos
- **Flash de preço** — cada linha de crypto detecta direção da mudança (`up/down`) e aplica cor transitória por 500ms usando `useRef` + `useEffect`

### Roteamento
- **React Router v7** — rotas lazy com `Suspense`, todas as páginas são chunks independentes
- Padrão: dashboard como resumo global → páginas dedicadas por domínio (`/crypto`, `/iss`, `/earthquakes`, etc.)

### Visualizações
- **react-globe.gl** — globo 3D WebGL para rastreamento da ISS com rastro de trajetória
- **Recharts** — gráficos de área (sparklines, histórico 7d) e profundidade de order book
- **Leaflet + react-leaflet** — mapas interativos para eventos sísmicos e naturais
- **Canvas nativo** — partículas de fundo animadas via `requestAnimationFrame` sem dependência extra

### Proxy & CORS
- **Vite dev proxy** — contorna CORS do GDACS (certificado self-signed) com `secure: false`
- **Vercel Rewrites** (`vercel.json`) + **Netlify `_redirects`** — proxy de produção para o mesmo endpoint
- Estratégia documentada: o frontend sempre chama `/api/gdacs/...`, o ambiente resolve o destino

---

## Decisões de Arquitetura

### Widget Shell
Todos os widgets compartilham um `WidgetShell` que encapsula: header com título/ícone, indicador LIVE, estado de loading/erro com retry, e link de navegação para a página dedicada. Isso garante consistência visual e evita duplicação de lógica de estado de UI.

### Code Splitting Agressivo
Widgets pesados (globo 3D, mapas Leaflet) são completamente isolados em chunks separados via `React.lazy()`. O dashboard carrega apenas o chunk do Dashboard — os demais carregam sob demanda. O vendor do Three.js/Globe (~476KB gz) nunca bloqueia o carregamento inicial.

### Performance no Dashboard
- WebSocket da Binance desconectado no dashboard (só ativo em `/crypto`)
- `React.memo` nos componentes de lista que recebem atualizações frequentes (`CompactCoinRow`)
- `useMemo` para cálculos derivados pesados (domínio do gráfico, ordenação de sismos, insights do brief)
- Widgets carregados com `Suspense` + skeleton animado, sem travar o thread principal

### Responsividade
Layout em três camadas:
- **Mobile** (`< md`): coluna única, scroll natural, header compacto
- **Tablet** (`md`): grid de 2 colunas, painéis laterais empilhados
- **Desktop** (`lg+`): layout fixo `h-screen overflow-hidden`, grids 3/5 colunas, sem scroll

### Gestalt & Hierarquia Visual
O `DailyBrief` (painel de insights) aplica princípios de design visual explicitamente: alertas críticos têm cards maiores, barra de destaque mais espessa, dot pulsante e gradiente colorido. Itens informacionais ficam em segundo plano visualmente. A ordenação é `alert → warning → info`.

---

## Estrutura do Projeto

```
src/
├── api/              # Hooks de dados (um arquivo por serviço)
│   ├── types/        # Tipos TypeScript das respostas de API
│   ├── binance.ts    # WebSocket Binance
│   ├── coingecko.ts  # Mercado crypto
│   ├── gdacs.ts      # Eventos naturais globais (XML parser)
│   ├── guardian.ts   # Notícias The Guardian
│   ├── iss.ts        # Rastreamento ISS
│   ├── openmeteo.ts  # Clima
│   └── usgs.ts       # Atividade sísmica
├── components/
│   ├── layout/       # Header, DailyBrief, PageLayout, WidgetShell
│   └── ui/           # LiveTickerBar, WidgetSkeleton, ParticleBackground
├── engine/
│   └── brief.ts      # Gerador de insights do Vigil Brief
├── pages/            # Uma página por rota (lazy loaded)
├── store/            # Zustand stores (app, binance, geo, alerts)
└── widgets/          # Um diretório por domínio de dados
```

---

## Rodando Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (com proxy GDACS)
npm run dev

# Build de produção
npm run build
```

> **Variáveis de ambiente opcionais:**
> ```
> VITE_GUARDIAN_API_KEY=sua_chave   # padrão: chave demo "test" do The Guardian
> ```

---

## Deploy

O projeto está configurado para **Vercel** (rewrites em `vercel.json`) e **Netlify** (`public/_redirects`), ambos resolvendo o proxy do GDACS em produção.

---

*Projeto de portfólio — Miguel Guerreiro*

