-- ======================================================
-- 🛠️ SOLUCIÓN DEFINITIVA PARA PERMISOS (RLS)
-- ======================================================

-- 1. Asegurar que el bucket existe y es público para descargas
-- Nota: Esto intentará insertar el bucket si no existe.
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-files', 'shared-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Asegurar que la tabla existe con los tipos correctos
-- Si la tabla ya existe, nos aseguramos de que share_id sea TEXT y no UUID
ALTER TABLE public.shares ALTER COLUMN share_id TYPE TEXT;

-- 3. LIMPIEZA TOTAL de políticas previas (para evitar conflictos)
-- Eliminamos todas las posibles versiones de políticas que pudimos haber creado
DROP POLICY IF EXISTS "Public can view shares" ON public.shares;
DROP POLICY IF EXISTS "Users can create shares" ON public.shares;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Subida autenticada" ON storage.objects;
DROP POLICY IF EXISTS "Descarga pública" ON storage.objects;
DROP POLICY IF EXISTS "Permitir todo en shared-files" ON storage.objects;

-- 3. POLÍTICAS PARA LA TABLA 'SHARES' (Base de Datos)
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de shares"
ON public.shares FOR SELECT
USING (true);

CREATE POLICY "Inserción libre para autenticados"
ON public.shares FOR INSERT
TO authenticated
WITH CHECK (true); -- Permitimos insertar si estás logueado

-- 4. POLÍTICAS PARA 'STORAGE' (Archivos)
-- Importante: storage.objects es donde se guardan los archivos
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso público de lectura a archivos"
ON storage.objects FOR SELECT
USING (bucket_id = 'shared-files');

CREATE POLICY "Inserción total para usuarios logueados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shared-files'); -- El único requisito es que sea en el bucket correcto
