import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function Auth({ onAuthSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAuth(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        // REGISTRO (email/password)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error

        // Si "Confirm email" está OFF, normalmente tendrás sesión inmediata
        if (data?.session && data?.user) {
          onAuthSuccess(data.user)
        } else if (data?.user) {
          // Caso: usuario creado pero sin sesión (p.ej. si alguna config obliga confirmación)
          setError('Cuenta creada. Ahora inicia sesión para continuar.')
        } else {
          setError('No se pudo crear la cuenta. Intenta de nuevo.')
        }
      } else {
        // LOGIN (email/password)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        if (data?.session && data?.user) {
          onAuthSuccess(data.user)
        } else {
          setError('No se pudo iniciar sesión. Intenta de nuevo.')
        }
      }
    } catch (err) {
      setError(err?.message || 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>SwiftShare</h1>
        <p>Comparte archivos temporalmente</p>

        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="toggle-auth">
          <p>
            {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
            >
              {isSignUp ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}