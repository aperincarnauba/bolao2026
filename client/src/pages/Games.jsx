import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import GameCard from '../components/game/GameCard'
import GroupStandings from '../components/game/GroupStandings'

const STAGES = [
  { key: 'all', label: 'Todos' },
  { key: 'group', label: 'Grupos' },
  { key: 'r32', label: 'Oitavas' },
]

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

function dateKey(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function dateLabel(iso) {
  const d = new Date(iso)
  const weekday = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' })
  const date = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${date}`
}

function keyCmp(key) {
  const [d, m, y] = key.split('/')
  return `${y}${m}${d}` // YYYYMMDD — safe for string sort
}

function groupByDay(games) {
  const map = new Map()
  for (const g of games) {
    const key = dateKey(g.match_time)
    if (!map.has(key)) map.set(key, { label: dateLabel(g.match_time), key, games: [] })
    map.get(key).games.push(g)
  }
  return Array.from(map.values())
}

export default function Games() {
  const [stage, setStage] = useState('all')
  const [group, setGroup] = useState('A')
  const [collapsed, setCollapsed] = useState(new Set())

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then(r => r.data.games),
    refetchInterval: 10000,
  })

  const todayKey = dateKey(new Date().toISOString())
  const tomorrowKey = dateKey(new Date(Date.now() + 86400000).toISOString())

  const filtered = useMemo(() => {
    if (stage === 'group') return games.filter(g => g.stage === 'group' && g.group_name === group)
    if (stage === 'r32') return games.filter(g => g.stage === 'r32')
    return games
  }, [games, stage, group])

  const days = useMemo(() => groupByDay(filtered), [filtered])

  const todayCmp    = keyCmp(todayKey)
  const tomorrowCmp = keyCmp(tomorrowKey)

  const todayDay    = days.find(d => d.key === todayKey)
  const tomorrowDay = days.find(d => d.key === tomorrowKey)
  const pastDays    = days.filter(d => keyCmp(d.key) < todayCmp)
  const futureDays  = days.filter(d => keyCmp(d.key) > tomorrowCmp)

  // Live games pinned to top (2h window after kickoff)
  const now2 = new Date()
  const liveGames = useMemo(() => filtered.filter(g => {
    if (g.status === 'finished') return false
    const start = new Date(g.match_time)
    return now2 >= start && now2 <= new Date(start.getTime() + 2 * 60 * 60 * 1000)
  }), [filtered])

  const totalPastGames = pastDays.reduce((n, d) => n + d.games.length, 0)

  function toggleDay(key) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function DayBlock({ day }) {
    const open = !collapsed.has(day.key)
    return (
      <div>
        <button
          onClick={() => toggleDay(day.key)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-copa-blue/5 dark:bg-copa-blue/15 hover:bg-copa-blue/10 dark:hover:bg-copa-blue/20 transition-colors mb-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-copa-blue dark:text-blue-300">{day.label}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {day.games.length} jogo{day.games.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="space-y-3 mb-2">
            {day.games.map(g => <GameCard key={g.id} game={g} />)}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-copa-blue text-2xl animate-spin">⚽</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-copa-blue dark:text-blue-400">Jogos</h2>

      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap">
        {STAGES.map(s => (
          <button
            key={s.key}
            onClick={() => setStage(s.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              stage === s.key
                ? 'bg-copa-blue text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-copa-blue dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:border-copa-yellow'
            }`}
          >
            {s.label}
            {s.key === 'all' && <span className="ml-1 text-xs opacity-60">({games.length})</span>}
          </button>
        ))}
      </div>

      {/* Shortcut to results */}
      {pastDays.length > 0 && (
        <button
          onClick={() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-xs font-semibold text-copa-blue dark:text-blue-400 underline underline-offset-2 hover:opacity-70 transition-opacity self-start"
        >
          ✅ Ver resultados anteriores ↓
        </button>
      )}

      {/* Group filter */}
      {stage === 'group' && (
        <div className="flex gap-1 flex-wrap">
          {GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                group === g
                  ? 'bg-copa-yellow text-copa-blue shadow'
                  : 'bg-white text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {stage === 'group' && <GroupStandings games={games} groupName={group} />}

      {filtered.length === 0 ? (
        <div className="card p-6 text-center text-gray-500 dark:text-gray-400">Nenhum jogo encontrado</div>
      ) : (
        <div className="space-y-1">

          {/* ── EM ANDAMENTO (pinned) ── */}
          {liveGames.length > 0 && (
            <section className="mb-4">
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className="text-sm font-extrabold bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="live-pulse inline-block w-2 h-2 rounded-full bg-white shrink-0" />
                  EM ANDAMENTO
                </span>
              </div>
              <div className="space-y-3">
                {liveGames.map(g => <GameCard key={g.id} game={g} />)}
              </div>
            </section>
          )}

          {/* ── HOJE ── */}
          {todayDay && (
            <section className="mb-4">
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className="text-sm font-extrabold bg-copa-yellow text-copa-blue px-3 py-1 rounded-full">
                  📅 HOJE
                </span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {todayDay.label}
                </span>
              </div>
              <div className="space-y-3">
                {todayDay.games.map(g => <GameCard key={g.id} game={g} />)}
              </div>
            </section>
          )}

          {/* ── AMANHÃ ── */}
          {tomorrowDay && (
            <section className="mb-4">
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className="text-sm font-extrabold bg-blue-100 dark:bg-blue-900/40 text-copa-blue dark:text-blue-300 px-3 py-1 rounded-full">
                  📅 AMANHÃ
                </span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {tomorrowDay.label}
                </span>
              </div>
              <div className="space-y-3">
                {tomorrowDay.games.map(g => <GameCard key={g.id} game={g} />)}
              </div>
            </section>
          )}

          {/* ── PRÓXIMOS JOGOS ── */}
          {futureDays.length > 0 && (
            <section className="mb-4">
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className="text-sm font-extrabold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  📅 PRÓXIMOS JOGOS
                </span>
              </div>
              <div className="space-y-2">
                {futureDays.map(day => <DayBlock key={day.key} day={day} />)}
              </div>
            </section>
          )}

          {/* ── RESULTADOS (jogos anteriores) ── */}
          {pastDays.length > 0 && (
            <section id="resultados" className="mb-4">
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className="text-sm font-extrabold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  ✅ RESULTADOS
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{totalPastGames} jogos</span>
              </div>
              <div className="space-y-2">
                {[...pastDays].reverse().map(day => <DayBlock key={day.key} day={day} />)}
              </div>
            </section>
          )}

          {/* Fallback: no section matched (edge case — e.g. only past days today=past) */}
          {!todayDay && !tomorrowDay && futureDays.length === 0 && pastDays.length === 0 && (
            <div className="space-y-2">
              {days.map(day => <DayBlock key={day.key} day={day} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
