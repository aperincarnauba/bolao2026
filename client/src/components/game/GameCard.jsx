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

  const prediction = game.user_prediction
  const isFinished = game.status === 'finished'
  const isLocked = game.locked

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

  const pts = prediction?.points_awarded

  return (
    <div className={`card p-4 ${isLocked && !isFinished ? 'opacity-80' : ''}`}>
      {/* Header: stage + city + time + status */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isFinished ? 'bg-gray-100 text-gray-500' :
            isLocked ? 'bg-red-50 text-red-500' :
            'bg-blue-50 text-copa-blue'
          }`}>
            {stageLabel(game.stage, game.group_name)}
            {isFinished ? ' · Encerrado' : isLocked ? ' · 🔒 Bloqueado' : ' · Aberto'}
          </span>
          {game.cidade && (
            <p className="text-xs text-gray-400 mt-0.5 ml-1">{game.cidade}</p>
          )}
        </div>
        <span className="text-xs text-gray-400 text-right shrink-0 ml-2">
          {formatBRT(game.match_time)}
        </span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex-1 text-center">
          <div className="text-2xl">{getFlagEmoji(game.home_team)}</div>
          <div className="text-xs font-semibold mt-1 leading-tight">{game.home_team}</div>
        </div>

        {/* Center: result or input */}
        <div className="flex-shrink-0 px-1">
          {isFinished ? (
            <div className="text-center">
              <p className="text-2xl font-extrabold">{game.home_score} <span className="text-gray-300">×</span> {game.away_score}</p>
              {prediction && (
                <div className={`mt-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                  pts === 2 ? 'bg-copa-yellow text-copa-blue' :
                  pts === 1 ? 'bg-gray-200 text-gray-600' :
                  'bg-red-100 text-red-500'
                }`}>
                  {pts === 2 ? '2 pts ✓✓' : pts === 1 ? '1 pt ✓' : '0 pts ✗'}
                </div>
              )}
              {!prediction && <p className="text-xs text-gray-400 mt-1">sem palpite</p>}
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
        <div className="flex-1 text-center">
          <div className="text-2xl">{getFlagEmoji(game.away_team)}</div>
          <div className="text-xs font-semibold mt-1 leading-tight">{game.away_team}</div>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}

      {!isLocked && !isFinished && !prediction && (
        <p className="text-xs text-gray-400 text-center mt-2">Digite o placar que você acha que vai ser</p>
      )}
    </div>
  )
}
