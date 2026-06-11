import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import GameCard from '../components/game/GameCard'

const STAGES = [
  { key: 'all', label: 'Todos' },
  { key: 'group', label: 'Grupos' },
  { key: 'r32', label: 'Oitavas' },
]

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export default function Games() {
  const [stage, setStage] = useState('all')
  const [group, setGroup] = useState('A')

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

      {/* Game list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-6 text-center text-gray-500 dark:text-gray-400">Nenhum jogo encontrado</div>
        ) : (
          filtered.map(game => <GameCard key={game.id} game={game} />)
        )}
      </div>
    </div>
  )
}
