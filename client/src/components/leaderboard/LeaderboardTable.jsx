export default function LeaderboardTable({ data, currentUserId }) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-1 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-5">Nome</div>
        <div className="col-span-2 text-center">Pts</div>
        <div className="col-span-2 text-center">Placar</div>
        <div className="col-span-2 text-center">Result.</div>
      </div>

      {data.map((entry, i) => (
        <div
          key={entry.user_id}
          className={`grid grid-cols-12 gap-1 px-4 py-3 items-center text-sm ${
            i < data.length - 1 ? 'border-b border-gray-50' : ''
          } ${entry.user_id === currentUserId ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'}`}
        >
          <div className="col-span-1 text-center font-bold text-sm">
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
              <span className="text-gray-400">{entry.rank}</span>
            )}
          </div>
          <div className="col-span-5 truncate">
            {entry.name}
            {entry.user_id === currentUserId && (
              <span className="ml-1 text-xs text-copa-blue">(você)</span>
            )}
          </div>
          <div className="col-span-2 text-center font-extrabold text-copa-blue">{entry.total_points}</div>
          <div className="col-span-2 text-center">
            <span className="bg-copa-yellow/20 text-copa-blue text-xs px-1.5 py-0.5 rounded font-bold">
              {entry.exact_scores}
            </span>
          </div>
          <div className="col-span-2 text-center">
            <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded font-bold">
              {entry.correct_results}
            </span>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="py-8 text-center text-gray-400 text-sm">Sem participantes ainda</div>
      )}
    </div>
  )
}
