import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import ScoreInput from './ScoreInput'
import { formatBRT, getFlagEmoji, stageLabel } from '../../utils'

export default function GameCard({ game }) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showPreds, setShowPreds] = useState(false)
  const [otherPreds, setOtherPreds] = useState(null)
  const [loadingPreds, setLoadingPreds] = useState(false)

  async function togglePreds() {
    if (showPreds) { setShowPreds(false); return }
    if (otherPreds) { setShowPreds(true); return }
    setLoadingPreds(true)
    try {
      const res = await api.get(`/games/${game.id}/predictions`)
      setOtherPreds(res.data.predictions)
      setShowPreds(true)
    } catch {
      // game not started yet or error — ignore
    } finally {
      setLoadingPreds(false)
    }
  }

  async function submitPrediction(homeScore, awayScore) {
    setSaving(true)
    setError('')
    try {
      await api.post(`/predictions/${game.id}`, { home_score: homeScore, away_score: awayScore })
      queryClient.invalidateQueries({ queryKey: ['games'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const prediction = game.user_prediction
  const isFinished = game.status === 'finished'
  const isLocked = game.locked
  const pts = prediction?.points_awarded

  return (
    <div className={`card p-4 ${isLocked && !isFinished ? 'opacity-80' : ''}`}>
      {/* Header: stage + city + time + status */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isFinished
              ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              : isLocked
              ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-blue-50 text-copa-blue dark:bg-blue-900/30 dark:text-blue-300'
          }`}>
            {stageLabel(game.stage, game.group_name)}
            {isFinished ? ' · Encerrado' : isLocked ? ' · 🔒 Bloqueado' : ' · Aberto'}
          </span>
          {game.cidade && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 ml-1">{game.cidade}</p>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 text-right shrink-0 ml-2">
          {formatBRT(game.match_time)}
        </span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl leading-none">{getFlagEmoji(game.home_team)}</span>
          <span className="text-xs font-semibold leading-tight dark:text-gray-200 text-center">{game.home_team}</span>
        </div>

        {/* Center: result or input */}
        <div className="flex-shrink-0 px-1">
          {isFinished ? (
            <div className="text-center">
              <p className="text-2xl font-extrabold dark:text-white">
                {game.home_score} <span className="text-gray-300 dark:text-gray-600">×</span> {game.away_score}
              </p>
              {prediction && (
                <div className={`mt-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                  pts === 2 ? 'bg-copa-yellow text-copa-blue' :
                  pts === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                  'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {pts === 2 ? '2 pts ✓✓' : pts === 1 ? '1 pt ✓' : '0 pts ✗'}
                </div>
              )}
              {!prediction && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">sem palpite</p>}
            </div>
          ) : (
            <ScoreInput
              homeScore={prediction?.home_score}
              awayScore={prediction?.away_score}
              locked={isLocked}
              saving={saving}
              saved={saved}
              onSubmit={submitPrediction}
            />
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl leading-none">{getFlagEmoji(game.away_team)}</span>
          <span className="text-xs font-semibold leading-tight dark:text-gray-200 text-center">{game.away_team}</span>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}

      {!isLocked && !isFinished && !prediction && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">Digite o placar que você acha que vai ser</p>
      )}

      {/* Palpites dos outros — só aparecem após o jogo iniciar */}
      {isLocked && (
        <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-2">
          <button
            onClick={togglePreds}
            className="w-full text-xs text-copa-blue dark:text-blue-400 font-semibold flex items-center justify-center gap-1 py-1 hover:opacity-70 transition-opacity"
          >
            {loadingPreds ? 'Carregando...' : showPreds ? 'Ocultar palpites' : 'Ver palpites dos participantes'}
            {!loadingPreds && <span className="text-gray-400">{showPreds ? '▲' : '▼'}</span>}
          </button>

          {showPreds && otherPreds && (
            <div className="mt-2 space-y-1">
              {otherPreds.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">Nenhum palpite registrado</p>
              ) : (
                otherPreds.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-5 text-right">{i + 1}.</span>
                    <span className="flex-1 text-xs font-medium truncate dark:text-gray-200">{p.user_name}</span>
                    <span className="text-xs font-bold tabular-nums dark:text-gray-200">{p.home_score} × {p.away_score}</span>
                    {isFinished && p.points_awarded !== null && (
                      <span className={`text-xs w-8 text-center font-bold rounded-full px-1.5 py-0.5 ${
                        p.points_awarded === 2 ? 'bg-copa-yellow text-copa-blue' :
                        p.points_awarded === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                        'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                      }`}>{p.points_awarded}pt</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
