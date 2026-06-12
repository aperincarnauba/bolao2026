export default function LeaderboardTable({ data, currentUserId }) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-4">Nome</div>
        <div className="col-span-2 text-center">Pts</div>
        <div className="col-span-2 text-center">Placar</div>
        <div className="col-span-1 text-center">Res.</div>
        <div className="col-span-2 text-center" title="Pontuação de azarão — tiebreaker por apostas em resultados improváveis">Azarão</div>
      </div>

      {data.map((entry, i) => (
        <div
          key={entry.user_id}
          className={`grid grid-cols-12 gap-1 px-4 py-3 items-center text-sm ${
            i < data.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''
          } ${entry.user_id === currentUserId
              ? 'bg-yellow-50 dark:bg-yellow-900/20 font-semibold'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <div className="col-span-1 text-center font-bold text-sm">
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
              <span className="text-gray-400 dark:text-gray-500">{entry.rank}</span>
            )}
          </div>
          <div className="col-span-4 truncate dark:text-gray-200">
            {entry.name}
            {entry.user_id === currentUserId && (
              <span className="ml-1 text-xs text-copa-blue dark:text-blue-400">(você)</span>
            )}
          </div>
          <div className="col-span-2 text-center font-extrabold text-copa-blue dark:text-blue-400">{entry.total_points}</div>
          <div className="col-span-2 text-center">
            <span className="bg-copa-yellow/20 text-copa-blue dark:bg-copa-yellow/10 dark:text-copa-yellow text-xs px-1.5 py-0.5 rounded font-bold">
              {entry.exact_scores}
            </span>
          </div>
          <div className="col-span-1 text-center">
            <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs px-1.5 py-0.5 rounded font-bold">
              {entry.correct_results}
            </span>
          </div>
          <div className="col-span-2 text-center">
            {entry.underdog_score > 0 ? (
              <span className="text-amber-500 dark:text-amber-400 text-xs font-bold">
                +{entry.underdog_score.toFixed(2)}
              </span>
            ) : (
              <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
            )}
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">Sem participantes ainda</div>
      )}
    </div>
  )
}
