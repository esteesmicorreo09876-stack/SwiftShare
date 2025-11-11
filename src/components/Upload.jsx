import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createShareZip } from '../lib/fileUtils'

export function Upload({ user }) {
  const [files, setFiles] = useState([])
  const [zipName, setZipName] = useState('archivos')
  const [uploading, setUploading] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  async function handleUpload(e) {
    e.preventDefault()
    if (!files.length || !zipName.trim()) return

    setUploading(true)
    try {
      const zipBlob = await createShareZip(files)
      const fileName = `${zipName}-${Date.now()}.zip`
      const shareId = Math.random().toString(36).substr(2, 9)

      const { error: uploadError } = await supabase.storage
        .from('shared-files')
        .upload(`shares/${shareId}/${fileName}`, zipBlob)

      if (uploadError) throw uploadError

      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const { error: dbError } = await supabase.from('shares').insert([
        {
          share_id: shareId,
          user_id: user.id,
          zip_file_path: `shares/${shareId}/${fileName}`,
          zip_filename: fileName,
          original_files_count: files.length,
          expires_at: expiryTime.toISOString(),
        },
      ])

      if (dbError) throw dbError

      setShareLink(`${window.location.origin}/download/${shareId}`)
      setExpiresAt(expiryTime.toLocaleString())
      setFiles([])
      setZipName('archivos')
    } catch (error) {
      alert('Error al subir: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-container">
      <h2>Subir Archivos</h2>
      
      {!shareLink ? (
        <form onSubmit={handleUpload} className="upload-form">
          <div className="input-group">
            <label>Nombre del ZIP (sin extensión):</label>
            <input
              type="text"
              value={zipName}
              onChange={(e) => setZipName(e.target.value)}
              placeholder="Ej: mi-proyecto"
              required
            />
          </div>

          <div className="input-group">
            <label>Selecciona archivos:</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files))}
              disabled={uploading}
            />
            {files.length > 0 && (
              <p className="file-count">{files.length} archivo(s) seleccionado(s)</p>
            )}
          </div>

          <button type="submit" disabled={uploading || !files.length}>
            {uploading ? 'Comprimiendo y subiendo...' : 'Crear enlace de descarga'}
          </button>
        </form>
      ) : (
        <div className="share-result">
          <h3>¡Enlace creado!</h3>
          <p>Comparte este enlace (válido por 24 horas):</p>
          <input type="text" value={shareLink} readOnly className="share-link" />
          <button onClick={() => navigator.clipboard.writeText(shareLink)}>
            Copiar enlace
          </button>
          <p className="expiry">Expira: {expiresAt}</p>
          <button onClick={() => { setShareLink(''); setExpiresAt(''); }} className="new-upload">
            Subir más archivos
          </button>
        </div>
      )}
    </div>
  )
}
