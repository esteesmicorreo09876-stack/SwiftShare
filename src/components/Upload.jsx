import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createShareZip } from '../lib/fileUtils'

export function Upload({ user, onLogout }) {
  const [files, setFiles] = useState([])
  const [zipName, setZipName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  async function handleUpload(e) {
    e.preventDefault()
    if (!files.length) {
      alert('Por favor selecciona archivos')
      return
    }

    setUploading(true)
    try {
      console.log('Iniciando proceso de subida para el usuario:', user.id)
      const zipBlob = await createShareZip(files)
      const finalZipName = (zipName.trim() || 'archivos-compartidos') + '.zip'
      const shareCode = Math.random().toString(36).slice(2, 10)
      const fileName = `${Date.now()}-${finalZipName}`
      const filePath = `shares/${shareCode}/${fileName}`

      console.log('Subiendo a Storage:', filePath)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('shared-files')
        .upload(filePath, zipBlob)

      if (uploadError) {
        console.error('Detalles del error de Storage:', uploadError)
        throw new Error(`[Storage] ${uploadError.message}`)
      }

      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      console.log('Insertando en DB:', { shareCode, userId: user.id, filePath })
      const { error: dbError } = await supabase.from('shares').insert([
        {
          user_id: user.id,
          zip_file_path: filePath,
          zip_filename: finalZipName,
          original_files_count: files.length,
          expires_at: expiryTime.toISOString(),
          share_code: shareCode,
        },
      ])

      if (dbError) {
        console.error('Detalles del error de Base de Datos:', dbError)
        throw new Error(`[Database] ${dbError.message} `)
      }

      setShareLink(`${window.location.origin}/download/${shareCode}`)
      setExpiresAt(expiryTime.toLocaleString())
      setFiles([])
      setZipName('')
    } catch (error) {
      alert('Error al procesar la subida: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-container">
      <div className="header">
        <h1>SwiftShare</h1>
        <button onClick={onLogout} className="logout-link">Cerrar sesión</button>
      </div>

      {!shareLink ? (
        <div className="upload-card">
          <p className="welcome">Hola, {user.email?.split('@')[0]}</p>
          <form onSubmit={handleUpload}>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="file-input"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files))}
                disabled={uploading}
              />
              <label htmlFor="file-input" className="file-input-label">
                <p>Click para seleccionar archivos</p>
                <span>O arrastra y suelta aquí</span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="selected-files">
                <p>{files.length} archivos seleccionados:</p>
                <ul className="file-list">
                  {files.slice(0, 5).map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                  {files.length > 5 && <li>...y {files.length - 5} más</li>}
                </ul>
              </div>
            )}

            <div className="form-group zip-name-input">
              <label>Nombre personalizado para el ZIP (opcional):</label>
              <input
                type="text"
                value={zipName}
                onChange={(e) => setZipName(e.target.value)}
                placeholder="mis-archivos"
              />
            </div>

            <button type="submit" disabled={uploading || !files.length} className="primary-btn">
              {uploading ? 'Procesando...' : 'Crear enlace de descarga'}
            </button>
          </form>
        </div>
      ) : (
        <div className="share-result">
          <div className="success-icon">✓</div>
          <h3>¡Listo para compartir!</h3>
          <p>Tus archivos estarán disponibles durante 24 horas.</p>
          <div className="link-box">
            <input type="text" value={shareLink} readOnly className="share-link-input" />
            <button onClick={() => {
              navigator.clipboard.writeText(shareLink)
              alert('Enlace copiado al portapapeles')
            }}>
              Copiar
            </button>
          </div>
          <p className="expiry">Expira: {expiresAt}</p>
          <button onClick={() => { setShareLink(''); setExpiresAt(''); }} className="secondary-btn">
            Subir más archivos
          </button>
        </div>
      )}
    </div>
  )
}
