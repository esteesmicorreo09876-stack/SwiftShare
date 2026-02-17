import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Auth } from './components/Auth'
import { Upload } from './components/Upload'
import { Download } from './components/Download'
import { supabase } from './lib/supabaseClient'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) return <div className="loading">Cargando...</div>

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            user ? <Navigate to="/upload" /> : <Auth onAuthSuccess={(u) => setUser(u)} />
          }
        />
        <Route
          path="/upload"
          element={
            user ? <Upload user={user} onLogout={handleLogout} /> : <Navigate to="/" />
          }
        />
        <Route path="/download/:shareCode" element={<Download />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
