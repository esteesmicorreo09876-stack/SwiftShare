import JSZip from 'jszip'

export async function createShareZip(files) {
  const zip = new JSZip()
  
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    zip.file(file.name, arrayBuffer)
  }
  
  return await zip.generateAsync({ type: 'blob' })
}
