import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export function Download() {
  const { shareCode } = useParams()
  const [share, setShare] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    if (shareCode) {
      loadShare(shareCode)
    }
  }, [shareCode])

  async function loadShare(code) {
    try {

      const { data, error: fetchError } = await supabase
        .from('shares')
        .select('*')
        .eq('share_code', code)
        .eq('is_deleted', false)
        .single()

      if (fetchError || !data) {
        throw new Error('Enlace no encontrado o enlace incorrecto')
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
    setDownloadError('')

    try {
      const { data, error: dlError } = await supabase.storage
        .from('shared-files')
        .download(share.zip_file_path)

      if (dlError) throw dlError

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = share.zip_filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      // Actualizar contador de descargas (RPC)
      const { error: rpcError } = await supabase.rpc('increment_download_count', {
        p_share_code: shareCode,
      })

      if (!rpcError) {
        setShare(prev => ({ ...prev, download_count: (prev.download_count || 0) + 1 }))
      } else {
        console.error('increment_download_count failed:', rpcError)
      }
    } catch (err) {
      setDownloadError('Error al descargar: ' + err.message)

    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <div className="loading">Consultando enlace...</div>

  return (
    <div className="download-container">
      {error ? (
        <div className="error-card">
          <div className="expired-message">{error}</div>
          <Link to="/" className="btn">Ir al inicio</Link>
        </div>
      ) : share && (
        <div className="download-card">
          <h2>Archivo listo para descargar</h2>
          <div className="download-info">
            <p className="filename">{share.zip_filename}</p>
            <p>Archivos incluidos: <strong>{share.original_files_count}</strong></p>
            <p className="downloads">Descargas: {share.download_count || 0}</p>
            <p className="expires">Expira el: {new Date(share.expires_at).toLocaleString()}</p>
          </div>
          <button onClick={handleDownload} disabled={downloading} className="primary-btn">
            {downloading ? 'Descargando...' : 'Descargar ZIP'}
          </button>
          {downloadError && (
            <p className="download-error">{downloadError}</p>
          )}
        </div>
      )}
    </div>
  )
}
