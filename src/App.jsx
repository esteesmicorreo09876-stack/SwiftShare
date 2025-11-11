import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Auth from './components/Auth'
import Upload from './components/Upload'
import Download from './components/Download'
import supabase from './lib/supabaseClient'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Cargando...</div>

  // Si estamos en ruta de descarga, mostrar componente Download sin importar autenticación
  if (location.pathname.startsWith('/download/')) {
    return <Download />
  }

  // Si no hay usuario autenticado, mostrar Auth
  if (!user) {
    return <Auth onAuthSuccess={(userData) => setUser(userData)} />
  }

  // Si hay usuario autenticado, mostrar Upload
  return <Upload user={user} onLogout={() => setUser(null)} />
}

export default App
