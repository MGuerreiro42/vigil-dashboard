import { useState, type ReactNode } from 'react'
import { Panel, PanelDivider } from '@/components/terminal/panel'
import { QueryPanel } from '@/components/terminal/query-panel'
import { StreamPanel } from '@/components/terminal/stream-panel'
import { Tabs } from '@/components/terminal/tabs'
import { Cell, DataTable, SelectableRow, TableRow } from '@/components/terminal/data-table'
import { Stat, StatLine } from '@/components/terminal/stat-line'
import { ChartLegend } from '@/components/terminal/chart-legend'
import { PickerButton } from '@/components/terminal/picker-button'
import { PromptInput } from '@/components/terminal/prompt-input'
import { GRID_12, OVERVIEW_SPAN } from '@/components/terminal/grid'
import { BlockBar, BracketButton, EmptyState, ExternalLink, Level, PollutantBar, Sparkline, ToneText } from '@/components/terminal/text'
import type { PanelQuery } from '@/components/terminal/panel-state'
import { useNow } from '@/hooks/use-now'
import { HttpError } from '@/lib/http'
import { changeTone, formatPrice, formatSigned } from '@/lib/terminal-format'
import type { StreamHealth } from '@/store/source-health-store'

// Dev-only reference sheet, laid out like "Vigil States.dc.html"; copy is fixed pt on purpose

interface Asteroid {
  name: string
  distanceLd: number
  diameterM: number
}

const ASTEROIDS: Asteroid[] = [
  { name: '2026 TX3', distanceLd: 4.7, diameterM: 38 },
  { name: '2026 TJ', distanceLd: 22.9, diameterM: 21 },
]

const COINS = [
  { symbol: 'ETH', rank: 2, price: 2418, change: -1.82 },
  { symbol: 'BNB', rank: 4, price: 722.09, change: -1.31 },
]

const COIN_COLUMNS = '48px 34px minmax(0,1fr) 64px'

/** A fake failing query whose retry restarts its own countdown. */
function useFailingQuery(error: Error, data: Asteroid[] | undefined, elapsedMs: number): PanelQuery<Asteroid[]> {
  const [errorUpdatedAt, setErrorUpdatedAt] = useState(() => Date.now() - elapsedMs)
  const [dataUpdatedAt] = useState(() => Date.now() - 3 * 3_600_000)
  return { data, error, isError: true, dataUpdatedAt, errorUpdatedAt, refetch: () => setErrorUpdatedAt(Date.now()) }
}

function Example({ caption, note, children }: { caption: string; note?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-dim">{caption}</span>
      {children}
      {note && <span className="text-dim">{note}</span>}
    </div>
  )
}

function AsteroidRows({ rows }: { rows: Asteroid[] }) {
  return (
    <DataTable columns="minmax(0,1fr) 80px 64px" gap="2px 12px">
      {rows.map((row) => (
        <TableRow key={row.name}>
          <Cell>{row.name}</Cell><Cell right>{row.distanceLd} LD</Cell><Cell right>{row.diameterM} m</Cell>
        </TableRow>
      ))}
    </DataTable>
  )
}

export function PrimitivesPage() {
  const now = useNow(1_000)
  const [cryptoTab, setCryptoTab] = useState<'chart' | 'market' | 'trades'>('chart')
  const [sort, setSort] = useState<'rank' | 'up' | 'down' | 'cap'>('rank')
  const [selectedCoin, setSelectedCoin] = useState('BNB')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [city, setCity] = useState('')
  const [startedAt] = useState(() => Date.now())

  const errorQuery = useFailingQuery(new HttpError('nasa neows', 503), undefined, 18_000)
  const degradedQuery = useFailingQuery(new HttpError('nasa neows', 429), ASTEROIDS, 48_000)
  const loadingQuery: PanelQuery<Asteroid[]> = { data: undefined, error: null, isError: false, dataUpdatedAt: 0, errorUpdatedAt: 0, refetch: () => {} }

  // Restarted every 8 s so the loading example never reaches its 10 s timeout
  const loadingCycle = Math.floor((now - startedAt) / 8_000)
  const reconnecting: StreamHealth = { state: 'reconnecting', attempt: 2, lostAt: now - 4_000, nextRetryAt: now + 2_000, recoveredAfterMs: null, recoveredAt: null }
  const recovered: StreamHealth = { state: 'live', attempt: 0, lostAt: null, nextRetryAt: null, recoveredAfterMs: 2_000, recoveredAt: now - ((now - startedAt) % 5_000) }

  return (
    <div className="flex max-w-[1360px] flex-col gap-[28px]">
      <div className="flex flex-col gap-[4px]">
        <span className="text-ok">vigil terminal · estados v1</span>
        <span className="text-dim">referência para implementação · um exemplo por estado, no mesmo painel usado no protótipo</span>
      </div>

      <div className="grid gap-x-[24px] gap-y-[36px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))' }}>
        <Example caption="01 · foco por teclado" note="contorno 1px #7ee08a + fundo #151a15 em abas e linhas · links ganham sublinhado · só com :focus-visible, nunca no clique">
          <Panel id="2.1" title="crypto" gap={12}>
            <Tabs
              label="visões"
              value={cryptoTab}
              onChange={setCryptoTab}
              items={[{ id: 'chart', label: 'gráfico 7d' }, { id: 'market', label: 'mercado' }, { id: 'trades', label: 'negociações' }]}
            />
            <div className="flex flex-col">
              {COINS.map((coin) => (
                <SelectableRow key={coin.symbol} columns={COIN_COLUMNS} selected={coin.symbol === selectedCoin} onSelect={() => setSelectedCoin(coin.symbol)}>
                  <span>{coin.symbol}</span>
                  <span className="text-dim">#{coin.rank}</span>
                  <span className="text-right">{formatPrice(coin.price)}</span>
                  <ToneText tone={changeTone(coin.change)} className="text-right">{formatSigned(coin.change)}</ToneText>
                </SelectableRow>
              ))}
            </div>
            <span><ExternalLink href="https://pt.wikipedia.org">ler artigo completo ↗</ExternalLink></span>
          </Panel>
        </Example>

        <Example caption="02 · cursor no gráfico (desktop) · seleção por toque (mobile)">
          <Panel id="2.2" title="câmbio">
            <div className="flex flex-col gap-[2px]">
              <span>repouso · <ChartLegend readout={null} /></span>
              <span>hover · <ChartLegend readout="14/09 · USD/BRL 5,1342" /></span>
              <span>mobile · <ChartLegend readout={null} touch /></span>
              <span>toque · <ChartLegend readout="14/09 · USD/BRL 5,1342" touch /> <span className="text-dim">(fica até o próximo toque)</span></span>
            </div>
            <span className="text-dim">no gráfico: linha vertical pontilhada em #c8d3c5 + marcador 6px na cor da série · em 2 eixos, um marcador por série</span>
            <span className="text-dim">sismos: o ponto e a linha da lista ficam em #7fd4e0; no mobile a seleção persiste sem hover</span>
          </Panel>
        </Example>

        <Example caption="03 · carregando (antes do primeiro dado)" note="o cursor ▌ pisca 1 s (opacidade 1→0, sem pulsação em outros elementos) · linhas de · no formato da tabela final, sem skeleton cinza">
          <QueryPanel key={loadingCycle} id="3.2" title="atividade sísmica" source="usgs" query={loadingQuery}>
            {(rows) => <AsteroidRows rows={rows} />}
          </QueryPanel>
        </Example>

        <Example caption="04 · erro sem nenhum dado anterior" note="diferente de degradado: não há tabela, o painel encolhe à altura do texto · causa sempre nomeada (http, timeout, chave, rede)">
          <QueryPanel id="4.4" title="asteroides hoje" source="nasa neows" query={errorQuery}>
            {(rows) => <AsteroidRows rows={rows} />}
          </QueryPanel>
        </Example>

        <Example caption="05 · degradado, servindo cache" note="dados do cache em #8d998a (não em texto cheio) para sinalizar que não são ao vivo · idade sempre visível no rótulo">
          <QueryPanel id="4.4" title="asteroides hoje" source="nasa neows" query={degradedQuery} retryMs={10 * 60_000}>
            {(rows) => <AsteroidRows rows={rows} />}
          </QueryPanel>
        </Example>

        <Example caption="06 · stream reconectando (binance ws, wikimedia)" note="backoff 1·2·4·8·16 s · após 5 falhas vira erro (04) com o último valor congelado · o ● ao vivo do topo vira ↻">
          <StreamPanel id="2.1" title="crypto" source="binance ws" stream={reconnecting} frozenNote="preços congelados às 19:03:07">
            <DataTable columns="48px minmax(0,1fr) 64px" gap="2px 12px">
              <TableRow><Cell>BTC</Cell><Cell right>81,692</Cell><Cell right>{formatSigned(-0.9)}</Cell></TableRow>
              <TableRow><Cell>ETH</Cell><Cell right>2,418</Cell><Cell right>{formatSigned(-1.82)}</Cell></TableRow>
            </DataTable>
          </StreamPanel>
          <StreamPanel id="2.1" title="crypto" source="binance ws" stream={recovered} meta="binance ws · coingecko · 1s" gap={6}>
            <span className="text-dim">depois de reconectar (some após 3 s)</span>
          </StreamPanel>
        </Example>

        <Example caption="07 · listas vazias" note="formato: o que está vazio · por que ou quando volta a ter dados · nunca só “sem dados”">
          <div className="flex flex-col gap-[14px] border border-line p-[16px]">
            <div className="flex flex-col gap-[2px]"><span className="text-dim">[alertas 0]</span><EmptyState title="nenhum alerta ativo" hint="um alerta aparece aqui quando uma fonte cruza um limiar: sismo ≥ M5, iqa ≥ 100, kp ≥ 5, variação ≥ 10% em 24 h" /></div>
            <div className="flex flex-col gap-[2px]"><span className="text-dim">[4.2] lançamentos</span><EmptyState title="nenhum lançamento nos próximos 14 dias" hint="launch library 2 · atualizado há 5 min" /></div>
            <div className="flex flex-col gap-[2px]"><span className="text-dim">[3.3] / xyz</span><EmptyState title="nenhuma cidade encontrada para “xyz”" hint="tente o nome sem acento ou só o início: “sao”, “rio”, “cur”" /></div>
          </div>
        </Example>

        <Example caption="08 · status das fontes [1.2]" note="ok #7ee08a · degradado #f2c46d (com dados, idade = do cache) · erro #ff7a6e (sem dados, idade —) · reconectando #7fd4e0 · forma + texto além da cor">
          <div className="border border-line p-[16px]">
            <DataTable columns="14px minmax(0,1fr) auto 52px 40px" gap="2px 10px">
              <TableRow><Cell className="text-ok">●</Cell><Cell truncate>usgs</Cell><Cell className="text-ok">ok</Cell><Cell right className="text-dim">180ms</Cell><Cell right className="text-dim">17s</Cell></TableRow>
              <TableRow><Cell className="text-warn">◐</Cell><Cell truncate className="text-warn">nasa neows</Cell><Cell className="text-warn">degradado</Cell><Cell right className="text-dim">429</Cell><Cell right className="text-dim">3h</Cell></TableRow>
              <TableRow><Cell className="text-err">✕</Cell><Cell truncate className="text-err">launch library</Cell><Cell className="text-err">erro</Cell><Cell right className="text-dim">timeout</Cell><Cell right className="text-dim">—</Cell></TableRow>
              <TableRow><Cell className="text-info">↻</Cell><Cell truncate className="text-info">binance ws</Cell><Cell className="text-info">reconect.</Cell><Cell right className="text-dim">—</Cell><Cell right className="text-dim">4s</Cell></TableRow>
            </DataTable>
          </div>
        </Example>

        <Example caption="09 · poluentes · limite oms na barra" note="a barra vai de 0 a 2× o limite; | marca o limite (caractere 12 de 24) · acima dele a barra inteira fica vermelha · rótulo do limite sempre ao lado do valor">
          <div className="flex flex-col gap-[6px] border border-line p-[16px]">
            <span className="text-dim">0 ······ limite ······ 2×</span>
            <DataTable columns="56px max-content auto auto" gap="2px 12px">
              <TableRow><Cell>PM2.5</Cell><Cell><PollutantBar value={11.1} limit={15} /></Cell><Cell right className="text-ok">11,1 µg/m³</Cell><Cell className="text-dim">oms 24 h 15</Cell></TableRow>
              <TableRow><Cell>NO₂</Cell><Cell><PollutantBar value={42.3} limit={25} /></Cell><Cell right className="text-err">42,3 µg/m³</Cell><Cell className="text-dim">oms 24 h 25</Cell></TableRow>
              <TableRow><Cell>O₃</Cell><Cell><PollutantBar value={33} limit={100} /></Cell><Cell right className="text-ok">33,0 µg/m³</Cell><Cell className="text-dim">oms 8 h 100</Cell></TableRow>
            </DataTable>
          </div>
        </Example>

        <Example caption="10 · primitivos de texto" note="badges são texto colorido · botões entre colchetes · links em #7fd4e0 com ↗ quando saem do app">
          <Panel id="0.1" title="primitivos" meta="fonte · 12s" gap={10}>
            <StatLine>
              <Stat label="ativos">15</Stat>
              <Stat label="maior alta">XMR <ToneText tone="ok">{formatSigned(2.27)}%</ToneText></Stat>
              <Stat label="maior queda">NEAR <ToneText tone="err">{formatSigned(-6.3)}%</ToneText></Stat>
            </StatLine>
            <Tabs variant="text" label="ordenar" value={sort} onChange={setSort}
              items={[{ id: 'rank', label: 'posição' }, { id: 'up', label: 'alta↓' }, { id: 'down', label: 'baixa↑' }, { id: 'cap', label: 'cap↓' }]} />
            <DataTable columns="48px minmax(0,1fr) 64px" gap="2px 12px" header={[{ label: 'ATIVO' }, { label: 'CAP. DE MERCADO' }, { label: 'CAP', right: true }]}>
              <TableRow><Cell>BTC</Cell><Cell truncate><BlockBar value={1.64} max={1.64} width={40} tone="text" /></Cell><Cell right>$1.64T</Cell></TableRow>
              <TableRow><Cell>ETH</Cell><Cell truncate><BlockBar value={0.29} max={1.64} width={40} tone="text" /></Cell><Cell right>$292B</Cell></TableRow>
            </DataTable>
            <PanelDivider>
              <span>Rafael Câmara <Sparkline values={[1, 1, 1, 1, 5]} /></span>
            </PanelDivider>
            <span><Level severity="critical" /> · <Level severity="warning" /> · <Level severity="info" /> · <ToneText tone="ok">CONF.</ToneText> · <ToneText tone="dim">A CONF.</ToneText></span>
            <span className="flex flex-wrap gap-x-[16px]">
              <BracketButton>[dispensar]</BracketButton>
              <BracketButton>[p] anterior</BracketButton>
              <BracketButton tone="ok">[espaço] reproduzir</BracketButton>
              <ExternalLink href="https://github.com">abrir no github ↗</ExternalLink>
            </span>
            <PromptInput placeholder="buscar cidade" value={city} onChange={(event) => setCity(event.target.value)} aria-label="buscar cidade" />
            <PickerButton open={pickerOpen} onToggle={() => setPickerOpen((isOpen) => !isOpen)} controls="primitives-picker">BTC · 81,671 · 15 ativos</PickerButton>
            {pickerOpen && <span id="primitives-picker" className="text-dim">lista aberta</span>}
          </Panel>
        </Example>
      </div>

      <span className="text-dim">grade da visão geral · ≥1280 / 1024–1279 / 600–1023 / &lt;600</span>
      <div className={GRID_12}>
        {Object.entries(OVERVIEW_SPAN).map(([name, span]) => (
          <Panel key={name} id={name} title="" className={span} onOpen={() => {}}>
            <span className="text-dim">{span}</span>
          </Panel>
        ))}
      </div>
    </div>
  )
}
