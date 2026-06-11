import { useState, useEffect } from 'react'

export default function ScoreInput({ homeScore, awayScore, locked, saving, saved, onSubmit }) {
  const [home, setHome] = useState(homeScore ?? '')
  const [away, setAway] = useState(awayScore ?? '')

  useEffect(() => {
    setHome(homeScore ?? '')
    setAway(awayScore ?? '')
  }, [homeScore, awayScore])

  function trySubmit() {
    if (home === '' || away === '') return
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return
    if (h === homeScore && a === awayScore) return
    onSubmit(h, a)
  }

  if (locked) {
    return (
      <div className="text-center">
        <p className="text-base font-bold text-gray-500 dark:text-gray-400">
          {homeScore !== undefined && homeScore !== null ? `${homeScore} × ${awayScore}` : '— × —'}
        </p>
        <p className="text-xs text-red-400 mt-0.5">🔒</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        inputMode="numeric"
        min="0"
        max="30"
        value={home}
        onChange={e => setHome(e.target.value)}
        onBlur={trySubmit}
        className="w-11 h-11 text-center border-2 border-gray-200 rounded-lg font-bold text-lg focus:border-copa-blue focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
      <span className="font-bold text-gray-300 dark:text-gray-500 text-lg">×</span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        max="30"
        value={away}
        onChange={e => setAway(e.target.value)}
        onBlur={trySubmit}
        onKeyDown={e => e.key === 'Enter' && trySubmit()}
        className="w-11 h-11 text-center border-2 border-gray-200 rounded-lg font-bold text-lg focus:border-copa-blue focus:outline-none transition-colors dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
      <div className="w-5 text-center">
        {saving && <span className="text-gray-300 text-xs animate-spin inline-block">⏳</span>}
        {saved && <span className="text-copa-green text-base">✓</span>}
      </div>
    </div>
  )
}
