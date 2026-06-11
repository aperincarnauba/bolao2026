import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatBRT, getFlagEmoji, stageLabel } from '../utils'

function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then(r => r.data.games),
    refetchInterval: 60000,
  })
}

function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/leaderboard').then(r => r.data.leaderboard),
    refetchInterval: 30000,
  })
}

export default function Home() {
  const { user } = useAuth()
  const { data: games = [] } = useGames()
  const { data: leaderboard = [] } = useLeaderboard()

  const upcoming = games
    .filter(g => !g.locked && g.status === 'scheduled')
    .slice(0, 3)

  const myRank = leaderboard.find(r => r.user_id === user?.id)
  const totalPoints = myRank?.total_points ?? 0
  const rank = myRank?.rank ?? '—'
  const predictionsMade = myRank?.predictions_made ?? 0

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="bg-copa-blue rounded-2xl p-5 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-200 text-sm">Olá,</p>
            <h2 className="text-2xl font-extrabold">{user?.name?.split(' ')[0]} 👋</h2>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Sua posição</p>
            <p className="text-3xl font-extrabold text-copa-yellow">#{rank}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="bg-white/10 rounded-xl px-4 py-2 flex-1 text-center">
            <p className="text-2xl font-extrabold text-copa-yellow">{totalPoints}</p>
            <p className="text-blue-200 text-xs">pontos</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 flex-1 text-center">
            <p className="text-2xl font-extrabold">{predictionsMade}</p>
            <p className="text-blue-200 text-xs">palpites</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 flex-1 text-center">
            <p className="text-2xl font-extrabold">{myRank?.exact_scores ?? 0}</p>
            <p className="text-blue-200 text-xs">placar certo</p>
          </div>
        </div>
      </div>

      {/* Next games */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg dark:text-gray-100">Próximos jogos</h3>
          <Link to="/games" className="text-copa-blue dark:text-blue-400 text-sm font-medium">Ver todos →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="card p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            Sem jogos disponíveis no momento
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(game => (
              <Link to="/games" key={game.id}>
                <div className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="bg-blue-100 text-copa-blue dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                      {stageLabel(game.stage, game.group_name)}
                    </span>
                    <span>{formatBRT(game.match_time)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getFlagEmoji(game.home_team)}</span>
                    <span className="font-semibold text-sm flex-1 dark:text-gray-200">{game.home_team}</span>
                    <span className="text-gray-400 dark:text-gray-600 font-bold">×</span>
                    <span className="font-semibold text-sm flex-1 text-right dark:text-gray-200">{game.away_team}</span>
                    <span className="text-xl">{getFlagEmoji(game.away_team)}</span>
                  </div>
                  {game.user_prediction ? (
                    <p className="text-xs text-copa-green mt-2 text-center">
                      ✓ Palpite: {game.user_prediction.home_score} × {game.user_prediction.away_score}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-500 mt-2 text-center">⚠ Sem palpite</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mini leaderboard */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg dark:text-gray-100">Ranking</h3>
          <Link to="/leaderboard" className="text-copa-blue dark:text-blue-400 text-sm font-medium">Ver completo →</Link>
        </div>
        <div className="card overflow-hidden">
          {leaderboard.slice(0, 5).map((entry, i) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < leaderboard.slice(0, 5).length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
              } ${entry.user_id === user?.id ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
            >
              <span className={`text-sm font-bold w-6 text-center ${
                i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank}`}
              </span>
              <span className="flex-1 font-medium text-sm truncate dark:text-gray-200">
                {entry.name} {entry.user_id === user?.id ? '(você)' : ''}
              </span>
              <span className="font-bold text-copa-blue dark:text-blue-400">{entry.total_points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
