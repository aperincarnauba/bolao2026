import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { getGamePoints } from '../utils'
import FlagImg from '../components/FlagImg'

// ── Layout constants ──────────────────────────────────────────────────────────
const CW = 130       // card width
const CH = 76        // card height
const GAP = 36       // horizontal gap between columns (for connector lines)
const STRIDE = CW + GAP   // 166px per column step
const SLOT = { r32: 84, r16: 168, qf: 336, sf: 672, final: 672 }
const BH = 672       // bracket height (8 r32 slots × 84px)
const LABEL_H = 26   // round-label row height
const TW = STRIDE * 8 + CW  // 1458px total width

const CX = {
  r32L: 0,             // 0
  r16L: STRIDE,        // 166
  qfL:  STRIDE * 2,   // 332
  sfL:  STRIDE * 3,   // 498
  fin:  STRIDE * 4,   // 664
  sfR:  STRIDE * 5,   // 830
  qfR:  STRIDE * 6,   // 996
  r16R: STRIDE * 7,   // 1162
  r32R: STRIDE * 8,   // 1328
}

const COL_LABELS = [
  { key: 'r32L', label: '16-avos' },
  { key: 'r16L', label: 'Oitavas' },
  { key: 'qfL',  label: 'Quartas' },
  { key: 'sfL',  label: 'Semi' },
  { key: 'fin',  label: 'Final' },
  { key: 'sfR',  label: 'Semi' },
  { key: 'qfR',  label: 'Quartas' },
  { key: 'r16R', label: 'Oitavas' },
  { key: 'r32R', label: '16-avos' },
]

// ── R32 seeding ───────────────────────────────────────────────────────────────
const LEFT_R32 = [
  ['Alemanha', 'Paraguai'],
  ['França', 'Suécia'],
  ['África do Sul', 'Canadá'],
  ['Holanda', 'Marrocos'],
  ['Portugal', 'Croácia'],
  ['Espanha', 'Áustria'],
  ['Estados Unidos', 'Bósnia e Herzegovina'],
  ['Bélgica', 'Senegal'],
]

const RIGHT_R32 = [
  ['Brasil', 'Japão'],
  ['Costa do Marfim', 'Noruega'],
  ['México', 'Equador'],
  ['Inglaterra', 'RD Congo'],
  ['Argentina', 'Cabo Verde'],
  ['Austrália', 'Egito'],
  ['Suíça', 'Argélia'],
  ['Colômbia', 'Gana'],
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function slotY(stage, idx) {
  const s = SLOT[stage]
  return idx * s + (s - CH) / 2
}

function yMid(stage, idx) {
  const s = SLOT[stage]
  return idx * s + s / 2
}

function getWinner(game) {
  if (!game || game.status !== 'finished') return null
  if (game.penalty_home != null)
    return game.penalty_home > game.penalty_away ? game.home_team : game.away_team
  if (game.home_score > game.away_score) return game.home_team
  if (game.away_score > game.home_score) return game.away_team
  return null
}

const LINE_COLOR = '#94a3b8'

function hRect(x, y, w) {
  return { left: x, top: y - 1, width: w, height: 2 }
}
function vRect(x, y1, y2) {
  return { left: x - 1, top: Math.min(y1, y2), width: 2, height: Math.abs(y2 - y1) }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Knockout() {
  const queryClient = useQueryClient()

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then(r => r.data.games),
    refetchInterval: 30000,
  })

  const knockoutGames = games.filter(g => g.stage !== 'group')

  const gameMap = {}
  for (const g of knockoutGames) {
    gameMap[`${g.home_team}×${g.away_team}`] = g
    gameMap[`${g.away_team}×${g.home_team}`] = g
  }
  function findGame(t1, t2) {
    return (t1 && t2) ? (gameMap[`${t1}×${t2}`] ?? null) : null
  }

  function buildSide(r32Pairs) {
    const r32 = r32Pairs.map(([t1, t2]) => {
      const g = findGame(t1, t2)
      return { game: g, t1, t2, winner: getWinner(g) }
    })
    const r16 = Array.from({ length: 4 }, (_, i) => {
      const w1 = r32[i * 2].winner, w2 = r32[i * 2 + 1].winner
      const g = findGame(w1, w2)
      return { game: g, t1: w1, t2: w2, winner: getWinner(g) }
    })
    const qf = Array.from({ length: 2 }, (_, i) => {
      const w1 = r16[i * 2].winner, w2 = r16[i * 2 + 1].winner
      const g = findGame(w1, w2)
      return { game: g, t1: w1, t2: w2, winner: getWinner(g) }
    })
    const sfT1 = qf[0].winner, sfT2 = qf[1].winner
    const sfGame = findGame(sfT1, sfT2)
    const sf = { game: sfGame, t1: sfT1, t2: sfT2, winner: getWinner(sfGame) }
    return { r32, r16, qf, sf }
  }

  const L = buildSide(LEFT_R32)
  const R = buildSide(RIGHT_R32)
  const finalSlot = {
    game: findGame(L.sf.winner, R.sf.winner),
    t1: L.sf.winner,
    t2: R.sf.winner,
  }

  // ── Build connector lines ─────────────────────────────────────────────────
  const lines = []

  function leftConnectors(fromCX, toCX, fromStage, toStage, count) {
    const midX = fromCX + CW + GAP / 2
    for (let i = 0; i < count; i++) {
      const yA   = yMid(fromStage, i * 2)     + LABEL_H
      const yB   = yMid(fromStage, i * 2 + 1) + LABEL_H
      const yOut = yMid(toStage, i)            + LABEL_H
      lines.push(hRect(fromCX + CW, yA, GAP / 2))
      lines.push(hRect(fromCX + CW, yB, GAP / 2))
      lines.push(vRect(midX, yA, yB))
      lines.push(hRect(midX, yOut, toCX - midX))
    }
  }

  function rightConnectors(fromCX, toCX, fromStage, toStage, count) {
    const midX = fromCX - GAP / 2
    for (let i = 0; i < count; i++) {
      const yA   = yMid(fromStage, i * 2)     + LABEL_H
      const yB   = yMid(fromStage, i * 2 + 1) + LABEL_H
      const yOut = yMid(toStage, i)            + LABEL_H
      lines.push(hRect(midX, yA, fromCX - midX))
      lines.push(hRect(midX, yB, fromCX - midX))
      lines.push(vRect(midX, yA, yB))
      lines.push(hRect(toCX + CW, yOut, midX - (toCX + CW)))
    }
  }

  leftConnectors(CX.r32L, CX.r16L, 'r32', 'r16', 4)
  leftConnectors(CX.r16L, CX.qfL,  'r16', 'qf',  2)
  leftConnectors(CX.qfL,  CX.sfL,  'qf',  'sf',  1)

  rightConnectors(CX.r32R, CX.r16R, 'r32', 'r16', 4)
  rightConnectors(CX.r16R, CX.qfR,  'r16', 'qf',  2)
  rightConnectors(CX.qfR,  CX.sfR,  'qf',  'sf',  1)

  // sf → final: straight horizontal (both at ySF because sf and final share the same BH)
  const ySF = yMid('sf', 0) + LABEL_H
  lines.push(hRect(CX.sfL + CW, ySF, GAP))
  lines.push(hRect(CX.fin + CW, ySF, GAP))

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-copa-blue text-2xl animate-spin">⚽</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-copa-blue dark:text-blue-400">Mata-Mata</h2>

      {/* Bracket — free scroll in all directions on mobile */}
      <div className="-mx-4 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="relative mx-4" style={{ width: TW, height: BH + LABEL_H }}>

          {/* Round labels */}
          {COL_LABELS.map(({ key, label }) => (
            <div
              key={key}
              style={{ position: 'absolute', left: CX[key], top: 0, width: CW, textAlign: 'center' }}
            >
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {label}
              </span>
            </div>
          ))}

          {/* Connector lines */}
          {lines.map((rect, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                backgroundColor: LINE_COLOR,
                opacity: 0.5,
                pointerEvents: 'none',
                ...rect,
              }}
            />
          ))}

          {/* LEFT SIDE (Chave A) */}
          {L.r32.map((slot, i) => (
            <BracketSlot
              key={`r32L-${i}-${slot.game?.id ?? 'x'}`}
              slot={slot} queryClient={queryClient}
              style={{ position: 'absolute', left: CX.r32L, top: slotY('r32', i) + LABEL_H, width: CW, height: CH }}
            />
          ))}
          {L.r16.map((slot, i) => (
            <BracketSlot
              key={`r16L-${i}-${slot.game?.id ?? 'x'}`}
              slot={slot} queryClient={queryClient}
              style={{ position: 'absolute', left: CX.r16L, top: slotY('r16', i) + LABEL_H, width: CW, height: CH }}
            />
          ))}
          {L.qf.map((slot, i) => (
            <BracketSlot
              key={`qfL-${i}-${slot.game?.id ?? 'x'}`}
              slot={slot} queryClient={queryClient}
              style={{ position: 'absolute', left: CX.qfL, top: slotY('qf', i) + LABEL_H, width: CW, height: CH }}
            />
          ))}
          <BracketSlot
            key={`sfL-${L.sf.game?.id ?? 'x'}`}
            slot={L.sf} queryClient={queryClient}
            style={{ position: 'absolute', left: CX.sfL, top: slotY('sf', 0) + LABEL_H, width: CW, height: CH }}
          />

          {/* FINAL */}
          <BracketSlot
            key={`fin-${finalSlot.game?.id ?? 'x'}`}
            slot={finalSlot} queryClient={queryClient} isFinal
            style={{ position: 'absolute', left: CX.fin, top: slotY('final', 0) + LABEL_H, width: CW, height: CH }}
          />

          {/* RIGHT SIDE (Chave B 🇧🇷) */}
          {R.r32.map((slot, i) => (
            <BracketSlot
              key={`r32R-${i}-${slot.game?.id ?? 'x'}`}
              slot={slot} queryClient={queryClient}
              style={{ position: 'absolute', left: CX.r32R, top: slotY('r32', i) + LABEL_H, width: CW, height: CH }}
            />
          ))}
          {R.r16.map((slot, i) => (
            <BracketSlot
              key={`r16R-${i}-${slot.game?.id ?? 'x'}`}
              slot={slot} queryClient={queryClient}
              style={{ position: 'absolute', left: CX.r16R, top: slotY('r16', i) + LABEL_H, width: CW, height: CH }}
            />
          ))}
          {R.qf.map((slot, i) => (
            <BracketSlot
              key={`qfR-${i}-${slot.game?.id ?? 'x'}`}
              slot={slot} queryClient={queryClient}
              style={{ position: 'absolute', left: CX.qfR, top: slotY('qf', i) + LABEL_H, width: CW, height: CH }}
            />
          ))}
          <BracketSlot
            key={`sfR-${R.sf.game?.id ?? 'x'}`}
            slot={R.sf} queryClient={queryClient}
            style={{ position: 'absolute', left: CX.sfR, top: slotY('sf', 0) + LABEL_H, width: CW, height: CH }}
          />

        </div>
      </div>
    </div>
  )
}

// ── Bracket slot card ─────────────────────────────────────────────────────────
function BracketSlot({ slot, queryClient, style, isFinal }) {
  const { game, t1, t2 } = slot
  const pred = game?.user_prediction
  const [predH, setPredH] = useState(() => pred != null ? String(pred.home_score) : '')
  const [predA, setPredA] = useState(() => pred != null ? String(pred.away_score) : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isFinished = game?.status === 'finished'
  const isLocked   = game?.locked
  const showForm   = !!(game && !isFinished && !isLocked)

  const { exactPts } = game
    ? getGamePoints(game.stage, game.home_team, game.away_team)
    : { exactPts: isFinal ? 5 : 3 }
  const pts = pred?.points_awarded

  const home = game?.home_team ?? t1
  const away = game?.away_team ?? t2
  const isBrazil = home === 'Brasil' || away === 'Brasil'

  const now = new Date()
  const isLive = game && !isFinished && (() => {
    const start = new Date(game.match_time)
    return now >= start && now <= new Date(start.getTime() + 2 * 60 * 60 * 1000)
  })()

  async function autoSave() {
    if (predH === '' || predA === '' || !game || saving) return
    setSaving(true)
    try {
      await api.post(`/predictions/${game.id}`, {
        home_score: parseInt(predH),
        away_score: parseInt(predA),
      })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={style}
      className={[
        'rounded-lg border bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex flex-col',
        isLive
          ? 'border-red-500 dark:border-red-500'
          : isBrazil
          ? 'border-copa-yellow/70 dark:border-copa-yellow/50'
          : 'border-gray-200 dark:border-gray-700',
      ].join(' ')}
    >
      {/* Time / LIVE header strip */}
      {game && (
        <div className={[
          'flex items-center justify-between px-1.5 border-b shrink-0',
          isLive
            ? 'bg-red-500 border-red-500'
            : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-700',
        ].join(' ')} style={{ height: 14, lineHeight: '14px' }}>
          {isLive ? (
            <>
              <span className="live-pulse inline-block w-1.5 h-1.5 rounded-full bg-white shrink-0" />
              <span className="text-[9px] font-bold text-white tracking-wide">LIVE</span>
              <span className="w-1.5" />
            </>
          ) : (
            <>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate">
                {new Date(game.match_time).toLocaleString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                  day: '2-digit', month: '2-digit',
                  hour: '2-digit', minute: '2-digit',
                  hour12: false,
                })}
              </span>
              {!isFinished && (
                <span className="text-[9px] text-gray-400 dark:text-gray-500 shrink-0 ml-1">{exactPts}p</span>
              )}
            </>
          )}
        </div>
      )}

      {/* Home row */}
      <div className="flex-1 flex items-center px-1.5 gap-1 border-b border-gray-100 dark:border-gray-700/60 min-w-0">
        {home && <FlagImg name={home} size="sm" />}
        <span className="flex-1 truncate text-[10px] font-semibold dark:text-gray-200 min-w-0 leading-tight">
          {home ?? '?'}
        </span>
        {/* Home score / input */}
        <div className="shrink-0 flex items-center">
          {isFinished && (
            <span className="text-xs font-extrabold tabular-nums dark:text-white w-5 text-center">
              {game.home_score}
            </span>
          )}
          {isLocked && (
            <span className="text-[9px] text-gray-400 dark:text-gray-500 tabular-nums w-5 text-center">
              {pred ? pred.home_score : '🔒'}
            </span>
          )}
          {showForm && (
            <input
              type="number" min="0" max="20" value={predH}
              onChange={e => setPredH(e.target.value)}
              onBlur={autoSave}
              placeholder="─"
              className="w-7 h-6 text-center border border-gray-300 dark:border-gray-600 rounded text-xs font-bold dark:bg-gray-700 dark:text-white focus:outline-none focus:border-copa-blue"
            />
          )}
          {!game && <span className="text-gray-200 dark:text-gray-700 text-xs w-5 text-center">?</span>}
        </div>
      </div>

      {/* Away row */}
      <div className="flex-1 flex items-center px-1.5 gap-1 min-w-0">
        {away && <FlagImg name={away} size="sm" />}
        <span className="flex-1 truncate text-[10px] font-semibold dark:text-gray-200 min-w-0 leading-tight">
          {away ?? '?'}
        </span>
        {/* Away score / input + badge */}
        <div className="shrink-0 flex items-center gap-0.5">
          {isFinished && (
            <>
              <span className="text-xs font-extrabold tabular-nums dark:text-white w-5 text-center">
                {game.away_score}
              </span>
              {pts != null && (
                <span className={[
                  'text-[9px] font-bold px-1 py-px rounded-full leading-tight',
                  pts === exactPts
                    ? 'bg-copa-yellow text-copa-blue'
                    : pts > 0
                    ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    : 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400',
                ].join(' ')}>
                  {pts}p
                </span>
              )}
            </>
          )}
          {isLocked && (
            <span className="text-[9px] text-gray-400 dark:text-gray-500 tabular-nums w-5 text-center">
              {pred ? pred.away_score : ''}
            </span>
          )}
          {showForm && (
            <>
              <input
                type="number" min="0" max="20" value={predA}
                onChange={e => setPredA(e.target.value)}
                onBlur={autoSave}
                placeholder="─"
                className="w-7 h-6 text-center border border-gray-300 dark:border-gray-600 rounded text-xs font-bold dark:bg-gray-700 dark:text-white focus:outline-none focus:border-copa-blue"
              />
              {saving && <span className="text-[8px] text-gray-400 dark:text-gray-500">…</span>}
              {saved  && <span className="text-[8px] text-copa-green dark:text-green-400">✓</span>}
            </>
          )}
          {!game && <span className="text-gray-200 dark:text-gray-700 text-xs w-5 text-center">?</span>}
        </div>
      </div>

      {/* Penalty strip */}
      {isFinished && game.penalty_home !== null && (
        <div className="text-center text-[8px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/30 leading-none py-0.5">
          pên {game.penalty_home}×{game.penalty_away}
        </div>
      )}
    </div>
  )
}
