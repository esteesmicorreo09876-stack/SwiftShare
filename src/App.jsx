import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      setUser(user)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>SwiftShare</h1>
      <p>Temporary File Sharing Platform</p>
      {user ? (
        <div>
          <p>Welcome, {user.email}</p>
          <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
      ) : (
        <div>
          <p>Please sign in to continue</p>
        </div>
      )}
    </div>
  )
}

export default App
