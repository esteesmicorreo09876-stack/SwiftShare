import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import Upload from './components/Upload'
import Download from './components/Download'
import supabase from './lib/supabaseClient'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('auth')
  const [shareId, setShareId] = useState(null)

  useEffect(() => {
    checkUser()
    checkDownloadLink()
  }, [])

  function checkDownloadLink() {
    const path = window.location.pathname
    if (path.includes('/download/')) {
      const id = path.split('/download/')[1]
      if (id) {
        setShareId(id)
        setCurrentPage('download')
      }
    }
  }

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        setCurrentPage('upload')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Cargando...</div>

  if (currentPage === 'download') {
    return <Download shareId={shareId} />
  }

  if (!user) {
    return <Auth onAuthSuccess={(userData) => {
      setUser(userData)
      setCurrentPage('upload')
    }} />
  }

  return <Upload user={user} onLogout={() => {
    setUser(null)
    setCurrentPage('auth')
  }} />
}

export default App
