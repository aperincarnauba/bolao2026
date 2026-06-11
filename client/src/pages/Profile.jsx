import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatBRT, getFlagEmoji, stageLabel } from '../utils'

export default function Profile() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [adminGame, setAdminGame] = useState(null)
  const [adminScore, setAdminScore] = useState({ home: '', away: '' })
  const [adminMsg, setAdminMsg] = useState('')

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then(r => r.data.games),
  })

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/leaderboard').then(r => r.data.leaderboard),
  })

  const myEntry = leaderboard.find(e => e.user_id === user?.id)
  const myGames = games.filter(g => g.user_prediction !== null)

  async function submitResult(e) {
    e.preventDefault()
    setAdminMsg('')
    try {
      await api.post(`/games/${adminGame.id}/result`, {
        home_score: parseInt(adminScore.home),
        away_score: parseInt(adminScore.away),
      })
      setAdminMsg('Resultado salvo!')
      setAdminGame(null)
      queryClient.invalidateQueries(['games'])
      queryClient.invalidateQueries(['leaderboard'])
    } catch (err) {
      setAdminMsg(err.response?.data?.error || 'Erro ao salvar')
    }
  }

  return (
    <div className="space-y-5">
      {/* User header */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-copa-blue flex items-center justify-center text-2xl text-white font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="font-extrabold text-lg">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            {user?.is_admin && (
              <span className="text-xs bg-copa-yellow text-copa-blue px-2 py-0.5 rounded-full font-bold">Admin</span>
            )}
          </div>
          <button onClick={logout} className="text-red-400 text-sm hover:text-red-600">Sair</button>
        </div>

        {myEntry && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: 'Posição', value: `#${myEntry.rank}`, color: 'text-copa-yellow' },
              { label: 'Pontos', value: myEntry.total_points, color: 'text-copa-blue' },
              { label: 'Placar certo', value: myEntry.exact_scores, color: 'text-copa-green' },
              { label: 'Resultado certo', value: myEntry.correct_results, color: 'text-gray-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 rounded-xl p-2 text-center">
                <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 leading-tight mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin panel */}
      {user?.is_admin && (
        <div className="card p-4">
          <h3 className="font-bold text-copa-blue mb-3">Painel Admin — Inserir Resultados</h3>
          {adminMsg && (
            <div className={`text-sm rounded-lg px-3 py-2 mb-3 ${
              adminMsg.includes('Erro') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-copa-green'
            }`}>{adminMsg}</div>
          )}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {games.filter(g => g.status !== 'finished').map(g => (
              <button
                key={g.id}
                onClick={() => { setAdminGame(g); setAdminScore({ home: '', away: '' }); setAdminMsg('') }}
                className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm"
              >
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{stageLabel(g.stage, g.group_name)}</span>
                <span className="flex-1 truncate">{g.home_team} × {g.away_team}</span>
                <span className="text-xs text-gray-400">{formatBRT(g.match_time)}</span>
              </button>
            ))}
          </div>

          {adminGame && (
            <form onSubmit={submitResult} className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="font-semibold text-sm mb-3">{adminGame.home_team} × {adminGame.away_team}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="30" required
                  value={adminScore.home}
                  onChange={e => setAdminScore(s => ({ ...s, home: e.target.value }))}
                  className="w-16 h-12 text-center border-2 border-gray-300 rounded-lg font-bold text-xl focus:border-copa-blue focus:outline-none"
                />
                <span className="font-bold text-gray-400">×</span>
                <input
                  type="number" min="0" max="30" required
                  value={adminScore.away}
                  onChange={e => setAdminScore(s => ({ ...s, away: e.target.value }))}
                  className="w-16 h-12 text-center border-2 border-gray-300 rounded-lg font-bold text-xl focus:border-copa-blue focus:outline-none"
                />
                <button type="submit" className="btn-primary ml-2 py-2.5 px-4">Salvar</button>
                <button type="button" onClick={() => setAdminGame(null)} className="text-gray-400 text-sm ml-1">Cancelar</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Prediction history */}
      <div>
        <h3 className="font-bold text-lg mb-3">Meus palpites ({myGames.length})</h3>
        {myGames.length === 0 ? (
          <div className="card p-4 text-center text-gray-500 text-sm">Nenhum palpite ainda</div>
        ) : (
          <div className="space-y-2">
            {myGames.map(game => {
              const pred = game.user_prediction
              const isFinished = game.status === 'finished'
              return (
                <div key={game.id} className="card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">{stageLabel(game.stage, game.group_name)} · {formatBRT(game.match_time)}</p>
                    <p className="text-sm font-medium truncate">{game.home_team} × {game.away_team}</p>
                  </div>
                  <div className="text-center text-sm">
                    <p className="font-bold">{pred.home_score} × {pred.away_score}</p>
                    {isFinished && (
                      <p className="text-xs text-gray-400">{game.home_score} × {game.away_score}</p>
                    )}
                  </div>
                  {isFinished && (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      pred.points_awarded === 2 ? 'bg-copa-yellow text-copa-blue' :
                      pred.points_awarded === 1 ? 'bg-gray-200 text-gray-700' :
                      'bg-red-100 text-red-500'
                    }`}>
                      {pred.points_awarded}
                    </div>
                  )}
                  {!isFinished && (
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      game.locked ? 'bg-red-100 text-red-500' : 'bg-green-100 text-copa-green'
                    }`}>
                      {game.locked ? '🔒' : '✓'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
