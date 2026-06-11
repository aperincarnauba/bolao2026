import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const LINKS = [
  { to: '/', label: 'Início' },
  { to: '/games', label: 'Jogos' },
  { to: '/leaderboard', label: 'Ranking' },
  { to: '/profile', label: 'Perfil' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-copa-blue text-white h-16 items-center px-6 shadow-lg">
      <Link to="/" className="flex items-center gap-2 mr-8">
        <span className="text-2xl">🏆</span>
        <span className="font-extrabold text-copa-yellow tracking-tight">Bolão Copa 2026</span>
      </Link>

      <div className="flex gap-1 flex-1">
        {LINKS.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === link.to
                ? 'bg-white/20 text-copa-yellow'
                : 'hover:bg-white/10 text-blue-100'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg transition-colors"
          title={dark ? 'Modo claro' : 'Modo escuro'}
        >
          {dark ? '☀️' : '🌙'}
        </button>
        <div className="w-8 h-8 rounded-full bg-copa-yellow text-copa-blue flex items-center justify-center font-bold text-sm">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <span className="text-sm text-blue-200 hidden lg:block">{user?.name}</span>
      </div>
    </nav>
  )
}
