import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  try {
    const now = new Date()
    
    // Obtener todos los archivos expirados
    const { data: expiredShares, error: queryError } = await supabase
      .from('shares')
      .select('id, zip_file_path')
      .lt('expires_at', now.toISOString())
    
    if (queryError) {
      throw queryError
    }
    
    if (!expiredShares || expiredShares.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No hay archivos expirados', deleted: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    let deletedCount = 0
    
    // Eliminar archivos del storage
    for (const share of expiredShares) {
      try {
        await supabase.storage
          .from('shared-files')
          .remove([share.zip_file_path])
      } catch (err) {
        console.error(`Error eliminando archivo ${share.zip_file_path}:`, err)
      }
    }
    
    // Eliminar registros de la base de datos
    const shareIds = expiredShares.map(s => s.id)
    const { error: deleteError } = await supabase
      .from('shares')
      .delete()
      .in('id', shareIds)
    
    if (deleteError) {
      throw deleteError
    }
    
    deletedCount = expiredShares.length
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Se eliminaron ${deletedCount} archivos expirados`,
        deleted: deletedCount 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error en cleanup-expired-shares:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
