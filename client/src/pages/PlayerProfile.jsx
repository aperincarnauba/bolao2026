import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatBRT, stageLabel, getGamePoints } from '../utils'
import FlagImg from '../components/FlagImg'

export default function PlayerProfile() {
  const { userId } = useParams()
  const { user: me } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['player-profile', userId],
    queryFn: () => api.get(`/users/${userId}/profile`).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-copa-blue text-2xl animate-spin">⚽</div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="card p-6 text-center text-gray-500 dark:text-gray-400">
        <p>Jogador não encontrado.</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-copa-blue text-sm">Voltar</button>
      </div>
    )
  }

  const { user, stats, games } = data
  const isMe = me?.id === Number(userId)

  const finished = games.filter(g => g.status === 'finished')
  const pending = games.filter(g => g.status !== 'finished')

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-copa-blue transition-colors">
        ← Voltar ao ranking
      </button>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-copa-blue flex items-center justify-center text-2xl text-white font-bold">
            {user.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="font-extrabold text-lg dark:text-gray-100">
              {user.name}
              {isMe && <span className="ml-2 text-sm text-copa-blue dark:text-blue-400 font-normal">(você)</span>}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{stats.predictions_made} palpites feitos</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Pontos', value: stats.total_points, color: 'text-copa-blue dark:text-blue-400' },
            { label: 'Placar certo', value: stats.exact_scores, color: 'text-copa-yellow' },
            { label: 'Resultado certo', value: stats.correct_results, color: 'text-copa-green' },
            { label: 'Azarão', value: stats.underdog_score > 0 ? `+${stats.underdog_score.toFixed(2)}` : '—', color: 'text-amber-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2 text-center">
              <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Finished games */}
      {finished.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-3 dark:text-gray-100">Jogos finalizados ({finished.length})</h3>
          <div className="space-y-2">
            {finished.map(g => <GameRow key={g.id} game={g} />)}
          </div>
        </div>
      )}

      {/* Pending/locked games */}
      {pending.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-3 dark:text-gray-100">Em andamento / aguardando ({pending.length})</h3>
          <div className="space-y-2">
            {pending.map(g => <GameRow key={g.id} game={g} />)}
          </div>
        </div>
      )}

      {games.length === 0 && (
        <div className="card p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          Nenhum jogo iniciado ainda.
        </div>
      )}
    </div>
  )
}

function GameRow({ game }) {
  const isFinished = game.status === 'finished'
  const hasPred = game.pred_home !== null

  let pointsBadge = null
  if (isFinished && hasPred) {
    const { exactPts } = getGamePoints(game.stage, game.home_team, game.away_team)
    const pts = game.points_awarded
    pointsBadge = (
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
        pts === exactPts ? 'bg-copa-yellow text-copa-blue' :
        pts > 0 ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
        'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
      }`}>
        {pts}
      </div>
    )
  }

  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{stageLabel(game.stage, game.group_name)} · {formatBRT(game.match_time)}</p>
        <p className="text-sm font-medium truncate dark:text-gray-200 flex items-center gap-1">
          <FlagImg name={game.home_team} size="sm" /> {game.home_team} × <FlagImg name={game.away_team} size="sm" /> {game.away_team}
        </p>
      </div>

      <div className="text-center text-sm shrink-0">
        {hasPred ? (
          <>
            <p className="font-bold dark:text-gray-200">{game.pred_home} × {game.pred_away}</p>
            {isFinished && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{game.actual_home} × {game.actual_away}</p>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">sem palpite</p>
        )}
      </div>

      {pointsBadge}

      {!isFinished && hasPred && (
        <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-copa-blue dark:bg-copa-blue/20 dark:text-blue-400 shrink-0">
          aguardando
        </div>
      )}
    </div>
  )
}
