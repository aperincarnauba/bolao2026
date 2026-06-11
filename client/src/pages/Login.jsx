import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const handle = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(form.email, form.password)
      } else {
        await signup(form.name, form.email, form.password)
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-copa-blue flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🏆</div>
        <h1 className="text-3xl font-extrabold text-copa-yellow">Bolão Copa 2026</h1>
        <p className="text-blue-200 mt-1 text-sm">Faça seu palpite para cada jogo</p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
              tab === 'login' ? 'bg-white shadow text-copa-blue' : 'text-gray-500'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
              tab === 'signup' ? 'bg-white shadow text-copa-blue' : 'text-gray-500'
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {tab === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={handle('name')}
                placeholder="Seu nome"
                className="input-field"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={handle('email')}
              placeholder="seu@email.com"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={handle('password')}
              placeholder={tab === 'signup' ? 'Mínimo 6 caracteres' : '••••••'}
              className="input-field"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? '...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-blue-300 text-xs text-center">
        Copa do Mundo FIFA 2026 · USA · México · Canadá
      </p>
    </div>
  )
}
