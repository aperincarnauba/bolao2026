import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { formatBRT, getGamePoints } from '../utils'
import FlagImg from '../components/FlagImg'

// Chave A (esquerda do bracket)
const CHAVE_A = [
  // Top → QF-A (09/jul · 17h)
  [
    { label: 'Oitavas A1 · 04/jul 18h', games: [['Alemanha', 'Paraguai'], ['França', 'Suécia']] },
    { label: 'Oitavas A2 · 04/jul 14h', games: [['África do Sul', 'Canadá'], ['Holanda', 'Marrocos']] },
  ],
  // Bottom → QF-B (10/jul · 16h)
  [
    { label: 'Oitavas A3 · 06/jul 16h', games: [['Portugal', 'Croácia'], ['Espanha', 'Áustria']] },
    { label: 'Oitavas A4 · 06/jul 21h', games: [['Estados Unidos', 'Bósnia e Herzegovina'], ['Bélgica', 'Senegal']] },
  ],
]

// Chave B (direita do bracket — lado do Brasil)
const CHAVE_B = [
  // Top → QF-C (11/jul · 18h)
  [
    { label: 'Oitavas B1 · 05/jul 17h', games: [['Brasil', 'Japão'], ['Costa do Marfim', 'Noruega']] },
    { label: 'Oitavas B2 · 05/jul 21h', games: [['México', 'Equador'], ['Inglaterra', 'RD Congo']] },
  ],
  // Bottom → QF-D (11/jul · 22h)
  [
    { label: 'Oitavas B3 · 07/jul',     games: [['Argentina', 'Cabo Verde'], ['Austrália', 'Egito']] },
    { label: 'Oitavas B4 · 07/jul 17h', games: [['Suíça', 'Argélia'], ['Colômbia', 'Gana']] },
  ],
]

const STAGE_ORDER = { r32: 0, r16: 1, qf: 2, sf: 3, final: 4 }
const STAGE_LABELS = { r16: 'Oitavas de Final', qf: 'Quartas de Final', sf: 'Semifinal', final: 'Final' }

export default function Knockout() {
  const [chave, setChave] = useState('B')
  const queryClient = useQueryClient()

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then(r => r.data.games),
    refetchInterval: 30000,
  })

  const knockoutGames = games.filter(g => g.stage !== 'group')

  // Lookup map: "TeamA×TeamB" → game (both orders)
  const gameMap = {}
  for (const g of knockoutGames) {
    gameMap[`${g.home_team}×${g.away_team}`] = g
    gameMap[`${g.away_team}×${g.home_team}`] = g
  }
  function findGame(t1, t2) { return gameMap[`${t1}×${t2}`] || null }

  // Advanced rounds (r16, qf, sf, final) grouped by stage
  const advancedByStage = {}
  for (const g of knockoutGames) {
    if (g.stage === 'r32') continue
    if (!advancedByStage[g.stage]) advancedByStage[g.stage] = []
    advancedByStage[g.stage].push(g)
  }
  const advancedStages = Object.keys(advancedByStage).sort((a, b) => STAGE_ORDER[a] - STAGE_ORDER[b])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-copa-blue text-2xl animate-spin">⚽</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-extrabold text-copa-blue dark:text-blue-400">Mata-Mata</h2>

      {/* 16-avos */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base dark:text-gray-100">16-avos de Final</h3>
          {/* Mobile tab */}
          <div className="md:hidden flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
            {['A', 'B'].map(c => (
              <button key={c} onClick={() => setChave(c)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${chave === c ? 'bg-copa-blue text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Chave {c}{c === 'B' ? ' 🇧🇷' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[{ key: 'A', pods: CHAVE_A }, { key: 'B', pods: CHAVE_B }].map(({ key, pods }) => (
            <div key={key} className={key === chave ? 'block' : 'hidden md:block'}>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 text-center">
                Chave {key}{key === 'B' ? ' 🇧🇷' : ''}
              </p>
              <div className="space-y-3">
                {pods.map((halfPods, halfIdx) => (
                  <div key={halfIdx} className="space-y-2">
                    {halfPods.map((pod, podIdx) => (
                      <div key={podIdx} className="space-y-1">
                        {pod.games.map(([t1, t2]) => {
                          const g = findGame(t1, t2)
                          return (
                            <BracketGame
                              key={`${t1}×${t2}`}
                              game={g}
                              team1={t1}
                              team2={t2}
                              queryClient={queryClient}
                            />
                          )
                        })}
                        {/* R16 connector */}
                        <div className="flex items-center gap-2 pl-3 py-0.5">
                          <div className="text-gray-300 dark:text-gray-600 text-sm">↳</div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">{pod.label}</span>
                        </div>
                      </div>
                    ))}
                    {halfIdx === 0 && (
                      <div className="border-t border-dashed border-gray-200 dark:border-gray-700 my-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rounds avançados (Oitavas, Quartas, Semi, Final) — aparecem conforme jogos são adicionados ao banco */}
      {advancedStages.map(stage => (
        <section key={stage}>
          <h3 className="font-bold text-base mb-3 dark:text-gray-100">{STAGE_LABELS[stage] || stage}</h3>
          <div className="space-y-3">
            {advancedByStage[stage]
              .sort((a, b) => new Date(a.match_time) - new Date(b.match_time))
              .map(g => (
                <BracketGame key={g.id} game={g} team1={g.home_team} team2={g.away_team} queryClient={queryClient} />
              ))}
          </div>
        </section>
      ))}

      {/* Final placeholder se ainda não estiver no banco */}
      {!advancedByStage['final'] && (
        <div className="card p-4 text-center border-dashed border-2 border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Final · 19 de julho · MetLife Stadium, Nova York</p>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500">A definir</p>
        </div>
      )}
    </div>
  )
}

function BracketGame({ game, team1, team2, queryClient }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [predH, setPredH] = useState('')
  const [predA, setPredA] = useState('')

  const isFinished = game?.status === 'finished'
  const isLocked = game?.locked
  const pred = game?.user_prediction
  const { exactPts } = game
    ? getGamePoints(game.stage, game.home_team, game.away_team)
    : { exactPts: 3 }
  const pts = pred?.points_awarded
  const isBrazil = team1 === 'Brasil' || team2 === 'Brasil'

  const home = game?.home_team || team1
  const away = game?.away_team || team2

  async function submit(e) {
    e.preventDefault()
    if (predH === '' || predA === '' || !game) return
    setSaving(true)
    try {
      await api.post(`/predictions/${game.id}`, { home_score: parseInt(predH), away_score: parseInt(predA) })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (!game) {
    return (
      <div className="card p-2 flex items-center gap-2 opacity-50">
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <FlagImg name={team1} size="sm" />
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{team1}</span>
        </div>
        <span className="text-xs text-gray-300 dark:text-gray-600 shrink-0">×</span>
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate text-right">{team2}</span>
          <FlagImg name={team2} size="sm" />
        </div>
      </div>
    )
  }

  return (
    <div className={`card p-2.5 ${isBrazil ? 'ring-1 ring-copa-yellow/60 dark:ring-copa-yellow/40' : ''}`}>
      <div className="flex items-center gap-1 mb-1.5">
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-1">{formatBRT(game.match_time)}</span>
        {game.cidade && <span className="text-xs text-gray-300 dark:text-gray-600">{game.cidade}</span>}
        <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
          isBrazil ? 'bg-green-100 text-copa-green dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
        }`}>até {exactPts}pts</span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Home */}
        <div className="flex-1 flex items-center gap-1 min-w-0">
          <FlagImg name={home} size="sm" />
          <span className="text-xs font-semibold dark:text-gray-200 truncate leading-tight">{home}</span>
        </div>

        {/* Center */}
        <div className="shrink-0 text-center px-1">
          {isFinished ? (
            <div>
              <p className="text-base font-extrabold dark:text-white tabular-nums">
                {game.home_score}×{game.away_score}
              </p>
              {game.penalty_home !== null && (
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                  ({game.penalty_home}×{game.penalty_away} pên)
                </p>
              )}
              {pred && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${
                  pts === exactPts ? 'bg-copa-yellow text-copa-blue' :
                  pts > 0 ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                  'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                }`}>{pts}pt{pts !== 1 ? 's' : ''}</span>
              )}
              {!pred && <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">sem palpite</p>}
            </div>
          ) : isLocked ? (
            <div className="text-center">
              <p className="text-xs text-red-400 dark:text-red-500">🔒</p>
              {pred && (
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                  {pred.home_score}×{pred.away_score}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="flex items-center gap-1">
              <input type="number" min="0" max="20" value={predH} onChange={e => setPredH(e.target.value)}
                placeholder="—"
                className="w-8 h-8 text-center border border-gray-300 dark:border-gray-600 rounded text-xs font-bold dark:bg-gray-700 dark:text-white focus:outline-none focus:border-copa-blue" />
              <span className="text-gray-300 dark:text-gray-600 text-xs">×</span>
              <input type="number" min="0" max="20" value={predA} onChange={e => setPredA(e.target.value)}
                placeholder="—"
                className="w-8 h-8 text-center border border-gray-300 dark:border-gray-600 rounded text-xs font-bold dark:bg-gray-700 dark:text-white focus:outline-none focus:border-copa-blue" />
              <button type="submit" disabled={saving || predH === '' || predA === ''}
                className="w-8 h-8 bg-copa-blue text-white rounded text-xs font-bold hover:opacity-80 disabled:opacity-40 transition-opacity">
                {saved ? '✓' : saving ? '…' : '→'}
              </button>
            </form>
          )}
          {!isLocked && !isFinished && pred && (
            <p className="text-xs text-copa-green dark:text-green-400 text-center mt-0.5 font-semibold">
              {pred.home_score}×{pred.away_score} ✓
            </p>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center justify-end gap-1 min-w-0">
          <span className="text-xs font-semibold dark:text-gray-200 truncate leading-tight text-right">{away}</span>
          <FlagImg name={away} size="sm" />
        </div>
      </div>
    </div>
  )
}
