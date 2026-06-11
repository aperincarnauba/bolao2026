import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import LeaderboardTable from '../components/leaderboard/LeaderboardTable'

export default function Leaderboard() {
  const { user } = useAuth()
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/leaderboard').then(r => r.data.leaderboard),
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-copa-blue text-2xl animate-spin">⚽</div>
      </div>
    )
  }

  const myEntry = leaderboard.find(e => e.user_id === user?.id)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-extrabold text-copa-blue dark:text-blue-400">Ranking</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">{leaderboard.length} participantes</span>
      </div>

      {myEntry && (
        <div className="bg-copa-blue text-white rounded-xl p-4 flex items-center gap-4">
          <div className="text-3xl font-extrabold text-copa-yellow">#{myEntry.rank}</div>
          <div className="flex-1">
            <p className="font-bold">{myEntry.name} (você)</p>
            <p className="text-blue-200 text-sm">{myEntry.predictions_made} palpites feitos</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-copa-yellow">{myEntry.total_points}</p>
            <p className="text-blue-200 text-xs">pontos</p>
          </div>
        </div>
      )}

      {/* Scoring legend */}
      <div className="card p-3 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <span className="bg-copa-yellow text-copa-blue px-1.5 py-0.5 rounded font-bold">2pts</span>
          <span>placar certo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded font-bold">1pt</span>
          <span>resultado certo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">0pts</span>
          <span>errou</span>
        </div>
      </div>

      <LeaderboardTable data={leaderboard} currentUserId={user?.id} />
    </div>
  )
}
