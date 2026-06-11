import { Link, useLocation } from 'react-router-dom'

const ITEMS = [
  { to: '/', icon: '🏠', label: 'Início' },
  { to: '/games', icon: '⚽', label: 'Jogos' },
  { to: '/leaderboard', icon: '🏆', label: 'Ranking' },
  { to: '/profile', icon: '👤', label: 'Perfil' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex">
        {ITEMS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
              pathname === item.to ? 'text-copa-blue' : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className={`text-xs font-medium ${pathname === item.to ? 'text-copa-blue' : 'text-gray-400'}`}>
              {item.label}
            </span>
            {pathname === item.to && (
              <div className="absolute top-0 w-8 h-0.5 bg-copa-blue rounded-full" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
