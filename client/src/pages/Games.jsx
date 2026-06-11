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

function getDateKey(isoString) {
  return new Date(isoString).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function getDateLabel(isoString) {
  const d = new Date(isoString)
  const weekday = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' })
  const date = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${date}`
}

function groupByDay(games) {
  const map = new Map()
  for (const g of games) {
    const key = getDateKey(g.match_time)
    if (!map.has(key)) map.set(key, { label: getDateLabel(g.match_time), key, games: [] })
    map.get(key).games.push(g)
  }
  return Array.from(map.values())
}

function todayKey() {
  return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export default function Games() {
  const [stage, setStage] = useState('all')
  const [group, setGroup] = useState('A')
  const [collapsed, setCollapsed] = useState(new Set())

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then(r => r.data.games),
    refetchInterval: 60000,
  })

  const filtered = games.filter(g => {
    if (stage === 'group') return g.stage === 'group' && g.group_name === group
    if (stage === 'r32') return g.stage === 'r32'
    return true
  })

  const days = useMemo(() => groupByDay(filtered), [filtered])
  const allCollapsed = collapsed.size === days.length && days.length > 0

  function toggleDay(key) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleAll() {
    if (allCollapsed) setCollapsed(new Set())
    else setCollapsed(new Set(days.map(d => d.key)))
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

      {/* Group filter (A–L) */}
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

      {/* Group standings table */}
      {stage === 'group' && (
        <GroupStandings games={games} groupName={group} />
      )}

      {/* Expand/collapse all */}
      {days.length > 1 && (
        <div className="flex justify-end">
          <button onClick={toggleAll}
            className="text-xs text-copa-blue dark:text-blue-400 font-semibold hover:opacity-70 transition-opacity">
            {allCollapsed ? 'Abrir todos' : 'Fechar todos'}
          </button>
        </div>
      )}

      {/* Games grouped by day */}
      {filtered.length === 0 ? (
        <div className="card p-6 text-center text-gray-500 dark:text-gray-400">Nenhum jogo encontrado</div>
      ) : (
        <div className="space-y-3">
          {days.map(day => {
            const isOpen = !collapsed.has(day.key)
            const isToday = day.key === todayKey()
            return (
              <div key={day.key}>
                {/* Day header */}
                <button
                  onClick={() => toggleDay(day.key)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-copa-blue/5 dark:bg-copa-blue/15 hover:bg-copa-blue/10 dark:hover:bg-copa-blue/20 transition-colors mb-2"
                >
                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span className="text-xs bg-copa-yellow text-copa-blue font-bold px-2 py-0.5 rounded-full">Hoje</span>
                    )}
                    <span className="text-sm font-bold text-copa-blue dark:text-blue-300">{day.label}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{day.games.length} jogo{day.games.length !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-gray-400 dark:text-gray-500 text-xs">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="space-y-3">
                    {day.games.map(game => <GameCard key={game.id} game={game} />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
