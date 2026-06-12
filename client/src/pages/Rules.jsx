export default function Rules() {
  const POINTS = [
    { label: 'Fase de Grupos', result: 1, exact: 2, max: 3, color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
    { label: 'Jogo do Brasil', result: 3, exact: 4, max: 7, color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', flag: '🇧🇷' },
    { label: 'Mata-a-mata', result: 2, exact: 3, max: 5, color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
    { label: 'Final', result: 4, exact: 5, max: 9, color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', flag: '🏆' },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-copa-blue dark:text-blue-400">Regras do Bolão</h2>

      {/* Points */}
      <div className="card p-4">
        <h3 className="font-bold text-copa-blue dark:text-blue-400 mb-3 flex items-center gap-2">
          🏆 Sistema de Pontos
        </h3>
        <div className="space-y-2">
          {POINTS.map(p => (
            <div key={p.label} className={`rounded-xl border p-3 ${p.color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm dark:text-gray-200">
                  {p.flag && <span className="mr-1">{p.flag}</span>}{p.label}
                </span>
                <span className="text-xs font-bold text-copa-blue dark:text-copa-yellow">
                  até {p.max} pts
                </span>
              </div>
              <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-300">
                <span>✓ Resultado certo: <strong>{p.result} pt{p.result > 1 ? 's' : ''}</strong></span>
                <span>✓✓ Placar exato: <strong>+{p.exact} pts</strong></span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          * Jogos do Brasil valem o maior entre a pontuação de fase e o bônus Brasil (3+4). Na Final, vale 4+5.
        </p>
      </div>

      {/* Tiebreaker */}
      <div className="card p-4">
        <h3 className="font-bold text-copa-blue dark:text-blue-400 mb-3">⚖️ Desempate</h3>
        <ol className="space-y-2">
          {[
            { n: '1º', text: 'Mais placares exatos (resultado e placar corretos)' },
            { n: '2º', text: 'Maior pontuação de azarão — quem acertou resultados que poucos acertaram ganha mais' },
          ].map(item => (
            <li key={item.n} className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-copa-blue text-white flex items-center justify-center text-xs font-bold shrink-0">{item.n}</span>
              <p className="text-sm dark:text-gray-200 pt-1">{item.text}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Prizes */}
      <div className="card p-4">
        <h3 className="font-bold text-copa-blue dark:text-blue-400 mb-3">💰 Prêmios</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { place: '🥇 1º', prize: 'R$ 90', bg: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' },
            { place: '🥈 2º', prize: 'R$ 60', bg: 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700' },
            { place: '🥉 3º', prize: 'R$ 30', bg: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' },
          ].map(item => (
            <div key={item.place} className={`rounded-xl p-3 text-center ${item.bg}`}>
              <p className="text-sm font-bold dark:text-gray-200">{item.place}</p>
              <p className="text-lg font-extrabold text-copa-blue dark:text-copa-yellow">{item.prize}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="card p-4">
        <h3 className="font-bold text-copa-blue dark:text-blue-400 mb-3">🚫 Proibido</h3>
        <ul className="space-y-2">
          {[
            'Editar palpite após o jogo começar',
            'Criar múltiplas contas',
            'Manipular o placar com o admin',
          ].map(rule => (
            <li key={rule} className="flex items-center gap-2 text-sm dark:text-gray-200">
              <span className="text-red-500 font-bold">✗</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
