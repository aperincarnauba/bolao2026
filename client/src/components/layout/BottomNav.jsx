import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const ITEMS = [
  { to: '/', icon: '🏠', label: 'Início' },
  { to: '/games', icon: '⚽', label: 'Jogos' },
  { to: '/knockout', icon: '🏅', label: 'Mata-Mata' },
  { to: '/leaderboard', icon: '🏆', label: 'Ranking' },
  { to: '/profile', icon: '👤', label: 'Perfil' },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const { dark, toggle } = useTheme()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="flex">
        {ITEMS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
              pathname === item.to ? 'text-copa-blue dark:text-copa-yellow' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className={`text-xs font-medium ${pathname === item.to ? 'text-copa-blue dark:text-copa-yellow' : 'text-gray-400 dark:text-gray-500'}`}>
              {item.label}
            </span>
            {pathname === item.to && (
              <div className="absolute top-0 w-8 h-0.5 bg-copa-blue rounded-full" />
            )}
          </Link>
        ))}

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="flex-1 flex flex-col items-center py-2 gap-0.5 text-gray-400 dark:text-gray-500 hover:text-copa-blue dark:hover:text-copa-yellow transition-colors"
        >
          <span className="text-xl leading-none">{dark ? '☀️' : '🌙'}</span>
          <span className="text-xs font-medium">{dark ? 'Claro' : 'Escuro'}</span>
        </button>
      </div>
    </nav>
  )
}
