import FlagImg from '../FlagImg'

function calcStandings(games, groupName) {
  const teams = {}

  for (const game of games) {
    if (game.group_name !== groupName) continue
    if (!teams[game.home_team]) teams[game.home_team] = { name: game.home_team, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 }
    if (!teams[game.away_team]) teams[game.away_team] = { name: game.away_team, pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 }
    if (game.status !== 'finished') continue

    const h = game.home_score, a = game.away_score
    teams[game.home_team].j++; teams[game.away_team].j++
    teams[game.home_team].gp += h; teams[game.home_team].gc += a
    teams[game.away_team].gp += a; teams[game.away_team].gc += h

    if (h > a) {
      teams[game.home_team].v++; teams[game.home_team].pts += 3; teams[game.away_team].d++
    } else if (h < a) {
      teams[game.away_team].v++; teams[game.away_team].pts += 3; teams[game.home_team].d++
    } else {
      teams[game.home_team].e++; teams[game.home_team].pts++
      teams[game.away_team].e++; teams[game.away_team].pts++
    }
  }

  return Object.values(teams).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    const sg = (b.gp - b.gc) - (a.gp - a.gc)
    if (sg !== 0) return sg
    if (b.gp !== a.gp) return b.gp - a.gp
    return a.name.localeCompare(b.name)
  })
}

export default function GroupStandings({ games, groupName }) {
  const rows = calcStandings(games, groupName)
  if (rows.length === 0) return null

  // Copa 2026: top 2 advance; best 8 third-placed teams also advance
  function rowClass(i) {
    if (i < 2) return 'border-l-[3px] border-copa-green bg-green-50/60 dark:bg-green-900/20'
    if (i === 2) return 'border-l-[3px] border-amber-400 bg-amber-50/60 dark:bg-amber-900/20'
    return 'border-l-[3px] border-red-300 bg-red-50/40 dark:bg-red-900/10'
  }

  return (
    <div className="card overflow-hidden">
      {/* Title */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-copa-blue/5 dark:bg-copa-blue/10">
        <p className="text-xs font-bold text-copa-blue dark:text-blue-300 uppercase tracking-wide">
          Classificação — Grupo {groupName}
        </p>
      </div>

      {/* Header row */}
      <div
        className="grid px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700"
        style={{ gridTemplateColumns: '18px 1fr 30px 22px 22px 22px 22px 30px' }}
      >
        <div />
        <div className="pl-6">Seleção</div>
        <div className="text-center">Pts</div>
        <div className="text-center">J</div>
        <div className="text-center">V</div>
        <div className="text-center">E</div>
        <div className="text-center">D</div>
        <div className="text-center">SG</div>
      </div>

      {rows.map((t, i) => {
        const sg = t.gp - t.gc
        return (
          <div
            key={t.name}
            className={`grid px-2 py-2 items-center ${rowClass(i)} ${i < rows.length - 1 ? 'border-b border-gray-100/80 dark:border-gray-700/40' : ''}`}
            style={{ gridTemplateColumns: '18px 1fr 30px 22px 22px 22px 22px 30px' }}
          >
            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 text-center">{i + 1}</div>
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <FlagImg name={t.name} size="sm" />
              <span className="text-xs font-semibold truncate dark:text-gray-200">{t.name}</span>
            </div>
            <div className="text-center text-sm font-extrabold text-copa-blue dark:text-blue-400">{t.pts}</div>
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">{t.j}</div>
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">{t.v}</div>
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">{t.e}</div>
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">{t.d}</div>
            <div className={`text-center text-xs font-bold ${
              sg > 0 ? 'text-copa-green' :
              sg < 0 ? 'text-red-500 dark:text-red-400' :
              'text-gray-400 dark:text-gray-500'
            }`}>
              {sg > 0 ? `+${sg}` : sg}
            </div>
          </div>
        )
      })}

      {/* Legend */}
      <div className="flex gap-4 px-3 py-1.5 bg-gray-50/60 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700">
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 rounded-full bg-copa-green shrink-0" />Classificado
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />3º (possível)
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 rounded-full bg-red-300 shrink-0" />Fora
        </span>
      </div>
    </div>
  )
}
