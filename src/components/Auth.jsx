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
      const raw = err?.message || ''
      const msg = raw.toLowerCase()

      // Traducciones / mensajes más amigables
      if (msg.includes('invalid login credentials')) {
        setError('Correo o contraseña incorrectos.')
      } else if (msg.includes('email not confirmed')) {
        setError('Tu correo aún no está confirmado. Revisa tu bandeja de entrada o Spam.')
      } else if (msg.includes('user already registered') || msg.includes('already registered')) {
        setError('Este correo ya está registrado. Inicia sesión.')
      } else if (msg.includes('password should be at least') || msg.includes('password is too short')) {
        setError('La contraseña es muy corta. Usa al menos 6 caracteres.')
      } else if (msg.includes('signup is disabled')) {
        setError('El registro está deshabilitado temporalmente.')
      } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
        setError('Demasiados intentos. Espera un momento e inténtalo de nuevo.')
      } else {
        setError(raw || 'Ocurrió un error. Intenta de nuevo.')
      }
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