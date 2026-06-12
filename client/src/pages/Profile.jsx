import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatBRT, stageLabel } from '../utils'
import FlagImg from '../components/FlagImg'

function SyncStatusBadge({ status }) {
  if (status === 'never' || !status) return <span className="text-gray-400 dark:text-gray-500 text-xs">Nunca sincronizado</span>
  if (status === 'no_key') return <span className="text-orange-500 text-xs">Chave de API não configurada</span>
  if (status === 'forbidden') return <span className="text-red-500 text-xs">Chave de API inválida</span>
  if (status === 'not_found') return <span className="text-yellow-600 text-xs">Competição não disponível na API ainda</span>
  if (status === 'ok') return <span className="text-copa-green text-xs">OK</span>
  return <span className="text-red-500 text-xs">Erro na sincronização</span>
}

export default function Profile() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const [adminTab, setAdminTab] = useState('resultado') // 'resultado' | 'palpites' | 'usuarios'
  const [adminGame, setAdminGame] = useState(null)
  const [adminScore, setAdminScore] = useState({ home: '', away: '' })
  const [adminMsg, setAdminMsg] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [predsGame, setPredsGame] = useState(null)
  const [predsData, setPredsData] = useState(null)
  const [predsEdits, setPredsEdits] = useState({})
  const [predsMsg, setPredsMsg] = useState('')
  const [usersList, setUsersList] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)

  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: () => api.get('/games').then(r => r.data.games),
  })

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/leaderboard').then(r => r.data.leaderboard),
  })

  const { data: syncInfo, refetch: refetchSyncInfo } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => api.get('/admin/sync-status').then(r => r.data),
    enabled: !!user?.is_admin,
    refetchInterval: 30000,
  })

  const myEntry = leaderboard.find(e => e.user_id === user?.id)
  const myGames = games.filter(g => g.user_prediction !== null)

  async function loadPreds(game) {
    setPredsGame(game)
    setPredsData(null)
    setPredsEdits({})
    setPredsMsg('')
    const res = await api.get(`/admin/game-predictions/${game.id}`)
    const rows = res.data.predictions
    setPredsData(rows)
    const edits = {}
    for (const r of rows) {
      edits[r.user_id] = { home: r.home_score ?? '', away: r.away_score ?? '' }
    }
    setPredsEdits(edits)
  }

  async function savePred(userId) {
    const e = predsEdits[userId]
    if (e.home === '' || e.away === '') return
    try {
      await api.put(`/admin/game-predictions/${predsGame.id}/${userId}`, {
        home_score: parseInt(e.home), away_score: parseInt(e.away),
      })
      setPredsMsg('Salvo!')
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    } catch (err) {
      setPredsMsg(err.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function loadUsers() {
    setUsersList(null)
    const res = await api.get('/admin/users')
    setUsersList(res.data.users)
  }

  async function deleteUser(u) {
    if (!window.confirm(`Apagar "${u.name}" (${u.email})?\n\nTodos os palpites desta pessoa serão removidos.`)) return
    if (!window.confirm(`Confirme: apagar definitivamente o usuário "${u.name}"?`)) return
    setDeletingUser(u.id)
    try {
      await api.delete(`/admin/users/${u.id}`)
      setUsersList(prev => prev.filter(x => x.id !== u.id))
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    } catch (err) {
      setAdminMsg(err.response?.data?.error || 'Erro ao apagar usuário')
    } finally {
      setDeletingUser(null)
    }
  }

  async function resetUsers() {
    if (!window.confirm('Apagar TODOS os usuários e palpites? Jogos ficam intactos. Não tem como desfazer.')) return
    setResetting(true)
    setAdminMsg('')
    try {
      await api.post('/admin/reset-users')
      setAdminMsg('Todos os usuários e palpites foram apagados.')
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      queryClient.invalidateQueries({ queryKey: ['games'] })
    } catch (err) {
      setAdminMsg(err.response?.data?.error || 'Erro ao resetar')
    } finally {
      setResetting(false)
    }
  }

  async function triggerSync() {
    setSyncing(true)
    setAdminMsg('')
    try {
      const res = await api.post('/admin/sync')
      const { updated, status } = res.data
      if (status === 'no_key') {
        setAdminMsg('Configure a variável FOOTBALL_API_KEY no Replit Secrets para ativar a sincronização automática.')
      } else if (status === 'forbidden') {
        setAdminMsg('Chave de API inválida. Verifique FOOTBALL_API_KEY.')
      } else if (status === 'not_found') {
        setAdminMsg('Competição WC 2026 ainda não disponível na football-data.org.')
      } else if (updated > 0) {
        setAdminMsg(`Sincronizado! ${updated} jogo(s) atualizado(s).`)
        queryClient.invalidateQueries({ queryKey: ['games'] })
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      } else {
        setAdminMsg('Tudo atualizado — nenhum jogo novo para sincronizar.')
      }
      refetchSyncInfo()
    } catch (err) {
      setAdminMsg(err.response?.data?.error || 'Erro na sincronização')
    } finally {
      setSyncing(false)
    }
  }

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
            <h2 className="font-extrabold text-lg dark:text-gray-100">{user?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
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
              { label: 'Pontos', value: myEntry.total_points, color: 'text-copa-blue dark:text-blue-400' },
              { label: 'Placar certo', value: myEntry.exact_scores, color: 'text-copa-green' },
              { label: 'Resultado certo', value: myEntry.correct_results, color: 'text-gray-600 dark:text-gray-300' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2 text-center">
                <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin panel */}
      {user?.is_admin && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-copa-blue dark:text-blue-400">Painel Admin</h3>
            <div className="flex gap-2">
              <button
                onClick={triggerSync}
                disabled={syncing}
                className="flex items-center gap-1.5 bg-copa-green text-white text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                <span className={syncing ? 'animate-spin' : ''}>⚽</span>
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
              <button
                onClick={resetUsers}
                disabled={resetting}
                className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                🗑 {resetting ? 'Apagando...' : 'Resetar usuários'}
              </button>
            </div>
          </div>

          {syncInfo && (
            <div className="flex items-center gap-2 text-xs mb-3 px-1">
              <span className="text-gray-400 dark:text-gray-500">Auto-sync:</span>
              <SyncStatusBadge status={syncInfo.lastSyncStatus} />
              {syncInfo.lastSyncTime && (
                <span className="text-gray-300 dark:text-gray-600">· {new Date(syncInfo.lastSyncTime).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
              )}
            </div>
          )}

          {adminMsg && (
            <div className={`text-sm rounded-lg px-3 py-2 mb-3 ${
              adminMsg.includes('Erro')
                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-green-50 dark:bg-green-900/30 text-copa-green'
            }`}>{adminMsg}</div>
          )}

          {/* Abas */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {['resultado', 'palpites', 'usuarios'].map(tab => (
              <button key={tab} onClick={() => {
                setAdminTab(tab); setAdminGame(null); setPredsGame(null); setAdminMsg(''); setPredsMsg('')
                if (tab === 'usuarios') loadUsers()
              }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${adminTab === tab ? 'bg-copa-blue text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {tab === 'resultado' ? 'Inserir Resultado' : tab === 'palpites' ? 'Ver/Editar Palpites' : 'Usuários'}
              </button>
            ))}
          </div>

          {/* Aba Resultado */}
          {adminTab === 'resultado' && (<>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Inserir resultado manualmente:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {games.map(g => (
                <button key={g.id}
                  onClick={() => { setAdminGame(g); setAdminScore({ home: g.home_score ?? '', away: g.away_score ?? '' }); setAdminMsg('') }}
                  className={`w-full text-left flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${adminGame?.id === g.id ? 'bg-copa-blue/10 dark:bg-copa-blue/20 border border-copa-blue/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded shrink-0">{stageLabel(g.stage, g.group_name)}</span>
                  <span className="flex-1 truncate flex items-center gap-1 min-w-0"><FlagImg name={g.home_team} size="sm" /> {g.home_team} × <FlagImg name={g.away_team} size="sm" /> {g.away_team}</span>
                  {g.status === 'finished'
                    ? <span className="text-xs font-bold text-copa-green shrink-0">{g.home_score}×{g.away_score}</span>
                    : <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{formatBRT(g.match_time)}</span>}
                </button>
              ))}
            </div>
            {adminGame && (
              <form onSubmit={submitResult} className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="font-semibold text-sm mb-3 dark:text-gray-200">{adminGame.home_team} × {adminGame.away_team}</p>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" max="30" required value={adminScore.home}
                    onChange={e => setAdminScore(s => ({ ...s, home: e.target.value }))}
                    className="w-16 h-12 text-center border-2 border-gray-300 rounded-lg font-bold text-xl focus:border-copa-blue focus:outline-none dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                  <span className="font-bold text-gray-400 dark:text-gray-500">×</span>
                  <input type="number" min="0" max="30" required value={adminScore.away}
                    onChange={e => setAdminScore(s => ({ ...s, away: e.target.value }))}
                    className="w-16 h-12 text-center border-2 border-gray-300 rounded-lg font-bold text-xl focus:border-copa-blue focus:outline-none dark:bg-gray-600 dark:border-gray-500 dark:text-white" />
                  <button type="submit" className="btn-primary ml-2 py-2.5 px-4">Salvar</button>
                  <button type="button" onClick={() => setAdminGame(null)} className="text-gray-400 dark:text-gray-500 text-sm ml-1">Cancelar</button>
                </div>
              </form>
            )}
          </>)}

          {/* Aba Palpites */}
          {adminTab === 'palpites' && (<>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Selecione um jogo para ver e editar os palpites:</p>
            <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
              {games.map(g => (
                <button key={g.id}
                  onClick={() => loadPreds(g)}
                  className={`w-full text-left flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${predsGame?.id === g.id ? 'bg-copa-blue/10 dark:bg-copa-blue/20 border border-copa-blue/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded shrink-0">{stageLabel(g.stage, g.group_name)}</span>
                  <span className="flex-1 truncate flex items-center gap-1 min-w-0"><FlagImg name={g.home_team} size="sm" /> {g.home_team} × <FlagImg name={g.away_team} size="sm" /> {g.away_team}</span>
                  {g.status === 'finished' && <span className="text-xs text-gray-400 shrink-0">{g.home_score}×{g.away_score}</span>}
                </button>
              ))}
            </div>

            {predsGame && predsData && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                <p className="font-semibold text-sm mb-2 dark:text-gray-200 flex items-center gap-1">
                  <FlagImg name={predsGame.home_team} size="sm" /> {predsGame.home_team} × <FlagImg name={predsGame.away_team} size="sm" /> {predsGame.away_team}
                </p>
                {predsMsg && <p className="text-xs text-copa-green mb-2">{predsMsg}</p>}
                {predsData.length === 0
                  ? <p className="text-xs text-gray-400">Nenhum usuário cadastrado.</p>
                  : <div className="space-y-2">
                    {predsData.map(p => (
                      <div key={p.user_id} className="flex items-center gap-2">
                        <span className="flex-1 text-xs font-medium truncate dark:text-gray-200">{p.name}</span>
                        <input type="number" min="0" max="30"
                          value={predsEdits[p.user_id]?.home ?? ''}
                          onChange={e => setPredsEdits(prev => ({ ...prev, [p.user_id]: { ...prev[p.user_id], home: e.target.value } }))}
                          placeholder="—"
                          className="w-10 h-8 text-center border border-gray-300 dark:border-gray-500 rounded text-sm font-bold dark:bg-gray-600 dark:text-white focus:outline-none focus:border-copa-blue" />
                        <span className="text-gray-400 text-xs">×</span>
                        <input type="number" min="0" max="30"
                          value={predsEdits[p.user_id]?.away ?? ''}
                          onChange={e => setPredsEdits(prev => ({ ...prev, [p.user_id]: { ...prev[p.user_id], away: e.target.value } }))}
                          placeholder="—"
                          className="w-10 h-8 text-center border border-gray-300 dark:border-gray-500 rounded text-sm font-bold dark:bg-gray-600 dark:text-white focus:outline-none focus:border-copa-blue" />
                        <button onClick={() => savePred(p.user_id)}
                          className="text-xs bg-copa-blue text-white px-2 py-1 rounded font-semibold hover:opacity-80">
                          OK
                        </button>
                      </div>
                    ))}
                  </div>
                }
              </div>
            )}
            {predsGame && !predsData && (
              <p className="text-xs text-gray-400 text-center py-4">Carregando...</p>
            )}
          </>)}

          {/* Aba Usuários */}
          {adminTab === 'usuarios' && (<>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Gerenciar participantes:</p>
            {!usersList ? (
              <p className="text-xs text-gray-400 text-center py-4">Carregando...</p>
            ) : usersList.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Nenhum usuário cadastrado.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {usersList.map(u => (
                  <div key={u.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate dark:text-gray-200">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => deleteUser(u)}
                      disabled={deletingUser === u.id}
                      className="text-xs bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors shrink-0"
                    >
                      {deletingUser === u.id ? '...' : 'Apagar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>)}
        </div>
      )}

      {/* Prediction history */}
      <div>
        <h3 className="font-bold text-lg mb-3 dark:text-gray-100">Meus palpites ({myGames.length})</h3>
        {myGames.length === 0 ? (
          <div className="card p-4 text-center text-gray-500 dark:text-gray-400 text-sm">Nenhum palpite ainda</div>
        ) : (
          <div className="space-y-2">
            {myGames.map(game => {
              const pred = game.user_prediction
              const isFinished = game.status === 'finished'
              return (
                <div key={game.id} className="card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stageLabel(game.stage, game.group_name)} · {formatBRT(game.match_time)}</p>
                    <p className="text-sm font-medium truncate dark:text-gray-200 flex items-center gap-1">
                      <FlagImg name={game.home_team} size="sm" /> {game.home_team} × <FlagImg name={game.away_team} size="sm" /> {game.away_team}
                    </p>
                  </div>
                  <div className="text-center text-sm">
                    <p className="font-bold dark:text-gray-200">{pred.home_score} × {pred.away_score}</p>
                    {isFinished && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">{game.home_score} × {game.away_score}</p>
                    )}
                  </div>
                  {isFinished && (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      pred.points_awarded === 2 ? 'bg-copa-yellow text-copa-blue' :
                      pred.points_awarded === 1 ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {pred.points_awarded}
                    </div>
                  )}
                  {!isFinished && (
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      game.locked
                        ? 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-copa-green dark:bg-green-900/30 dark:text-green-400'
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
