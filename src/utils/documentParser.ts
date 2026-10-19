import mammoth from 'mammoth';

export interface UploadedFileResult {
  fileName: string;
  fileType: 'pdf' | 'docx' | 'doc' | 'txt';
  fileSize: number;
  extractedText: string;
  fileDataUrl: string;
  extractedImages?: { id: string; url: string; name?: string; caption?: string }[];
}

export async function parseUploadedDocument(file: File): Promise<UploadedFileResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  let fileType: 'pdf' | 'docx' | 'doc' | 'txt' = 'txt';
  if (ext === 'pdf') fileType = 'pdf';
  else if (ext === 'docx') fileType = 'docx';
  else if (ext === 'doc') fileType = 'doc';

  // Read data URL for embedding / viewing
  const fileDataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

  let extractedText = '';
  let extractedImages: { id: string; url: string; name?: string; caption?: string }[] = [];

  // 1. Try server-side parsing first (uses full pdf-parse & mammoth for accurate text & image extraction)
  try {
    const base64 = fileDataUrl.includes(',') ? fileDataUrl.split(',')[1] : fileDataUrl;
    if (base64) {
      const resp = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, fileType, fileName }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.text && data.text.trim().length > 10) {
          extractedText = data.text.trim();
        }
        if (data.success && Array.isArray(data.images) && data.images.length > 0) {
          extractedImages = data.images;
        }
      }
    }
  } catch (serverErr) {
    console.warn('Server document parsing fallback:', serverErr);
  }

  // 2. Client-side fallback if server parsing was not populated
  if (!extractedText) {
    try {
      if (fileType === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value.trim();
      } else if (fileType === 'txt') {
        extractedText = await file.text();
      } else {
        extractedText = `Dokumen materi "${fileName}" berhasil diunggah. Silakan lengkapi atau tinjau ringkasan materi bacaan untuk peserta didik.`;
      }
    } catch (err) {
      console.warn('Client fallback parsing error:', err);
      extractedText = `Materi dari dokumen ${fileName}. Silakan pelajari materi terlampir.`;
    }
  }

  return {
    fileName,
    fileType,
    fileSize,
    extractedText,
    fileDataUrl,
    extractedImages,
  };
}
