import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function Download() {
  const [shareId, setShareId] = useState(null)
  const [share, setShare] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = window.location.pathname.split('/').pop()
    setShareId(id)
    loadShare(id)
  }, [])

  async function loadShare(id) {
    try {
      const { data, error: fetchError } = await supabase
        .from('shares')
        .select('*')
        .eq('share_id', id)
        .single()

      if (fetchError || !data) {
        throw new Error('Enlace no encontrado')
      }

      if (new Date(data.expires_at) < new Date()) {
        throw new Error('Este enlace ha expirado')
      }

      setShare(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const { data, error: dlError } = await supabase.storage
        .from('shared-files')
        .download(share.zip_file_path)

      if (dlError) throw dlError

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = share.zip_filename
      a.click()

      await supabase.from('shares').update({ download_count: (share.download_count || 0) + 1 }).eq('id', share.id)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <div><p>Cargando...</p></div>
  if (error) return <div><p>{error}</p></div>

  return (
    <div className="download-container">
      {share && (
        <div>
          <h2>{share.zip_filename}</h2>
          <p>Archivos: {share.original_files_count}</p>
          <p>Descargas: {share.download_count || 0}</p>
          <button onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Descargando...' : 'Descargar'}
          </button>
        </div>
      )}
    </div>
  )
}
