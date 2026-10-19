import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
function sanitizeWord(word: string): string {
  return (word || '').toUpperCase().replace(/[^A-Z]/g, '').trim();
}

function buildCrosswordGrid(
  acrossItems: { id?: string; clue: string; answer: string }[],
  downItems: { id?: string; clue: string; answer: string }[],
  totalPoints: number = 100
) {
  const cleanAcross = acrossItems
    .map((item, idx) => ({
      id: item.id || `across-${idx + 1}`,
      number: idx + 1,
      direction: 'across' as const,
      clue: item.clue.trim(),
      answer: sanitizeWord(item.answer),
      row: idx * 2,
      col: 0
    }))
    .filter(item => item.answer.length >= 2);

  const cleanDown = downItems
    .map((item, idx) => ({
      id: item.id || `down-${idx + 1}`,
      number: cleanAcross.length + idx + 1,
      direction: 'down' as const,
      clue: item.clue.trim(),
      answer: sanitizeWord(item.answer),
      row: 0,
      col: 2 + idx * 2
    }))
    .filter(item => item.answer.length >= 2);

  return {
    acrossCount: cleanAcross.length,
    downCount: cleanDown.length,
    totalPoints,
    clues: [...cleanAcross, ...cleanDown]
  };
}

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Helper to clean JSON string from codeblock wrappers
function cleanJsonString(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

// Helper to initialize Gemini SDK safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// 0. Endpoint: Parse Uploaded Document (PDF or Word DOCX) into Clean Text
app.post('/api/parse-document', async (req, res) => {
  try {
    const { base64 = '', fileType = '', fileName = '' } = req.body;
    if (!base64) {
      return res.status(400).json({ success: false, error: 'No file data provided' });
    }

    const buffer = Buffer.from(base64, 'base64');
    let text = '';

    const extractedImages: { id: string; url: string; name?: string; caption?: string }[] = [];

    if (fileType === 'pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      try {
        const parser = new PDFParse({ data: buffer });
        const textResult = await parser.getText();
        text = textResult.text ? textResult.text.trim() : '';
        await parser.destroy();
      } catch (pdfErr) {
        console.error('PDFParse error:', pdfErr);
        text = buffer.toString('utf-8').trim();
      }
    } else if (fileType === 'docx' || fileName.toLowerCase().endsWith('.docx')) {
      try {
        let imgCount = 0;
        await mammoth.convertToHtml(
          { buffer },
          {
            convertImage: mammoth.images.imgElement((image) => {
              return image.read('base64').then((imageBuffer) => {
                imgCount++;
                const mime = image.contentType || 'image/png';
                const dataUrl = `data:${mime};base64,${imageBuffer}`;
                const baseName = fileName.replace(/\.[^/.]+$/, '');
                extractedImages.push({
                  id: `img-doc-${Date.now()}-${imgCount}`,
                  url: dataUrl,
                  name: `Gambar ${imgCount}: ${baseName}`,
                  caption: `Ilustrasi ${imgCount} diekstrak dari dokumen ${fileName}`
                });
                return { src: dataUrl };
              });
            })
          }
        );
      } catch (imgErr) {
        console.warn('Could not extract docx images:', imgErr);
      }

      const result = await mammoth.extractRawText({ buffer });
      text = result.value ? result.value.trim() : '';
    } else {
      text = buffer.toString('utf-8').trim();
    }

    // Clean multiple consecutive empty lines
    text = text.replace(/\n{3,}/g, '\n\n');

    return res.json({
      success: true,
      text: text || `Materi dari dokumen ${fileName}. Dokumen ini memuat materi ajar MTsN 3 Banyuwangi.`,
      images: extractedImages
    });
  } catch (err: any) {
    console.error('Error parsing document on server:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to extract text from document', 
      details: err?.message 
    });
  }
});

// 1. Endpoint: Generate Latihan Soal dari Materi yang Diupload (Ditenagai AI Gemini)
app.post('/api/ai/generate-latihan', async (req, res) => {
  const { materialTitle = '', materialContent = '', count = 5, materialImages = [] } = req.body;
  const numCount = Math.max(1, Math.min(20, Number(count) || 5));

  try {
    const ai = getGeminiClient();

    if (ai) {
      const imagesContext = Array.isArray(materialImages) && materialImages.length > 0
        ? `\nINFORMASI GAMBAR PADA MATERI (PENTING - KEBUTUHAN SOAL BERGAMBAR):
Materi yang diupload memuat ${materialImages.length} gambar berikut:
${materialImages.map((m: any, i: number) => `- Gambar ${i + 1}: Nama: "${m.name || 'Gambar ' + (i+1)}", Keterangan: "${m.caption || ''}", URL: "${m.url}"`).join('\n')}

ATURAN WAJIB SOAL BERGAMBAR:
Karena materi memuat gambar, buatlah minimal 1 atau 2 butir soal yang secara langsung MENGANALISIS GAMBAR di atas!
Untuk butir soal berbasis gambar tersebut:
- Rumuskan pertanyaan dengan menginstruksikan siswa mencermati gambar, contoh: "Perhatikan gambar berikut! Bagian yang ditunjukkan berfungsi untuk..."
- Sertakan field "imageUrl" dengan salah satu URL gambar di atas.
- Sertakan field "imageCaption" dengan nama/keterangan gambar yang relevan.
Untuk butir soal yang tidak berbasis gambar, kosongkan field imageUrl atau abaikan.\n`
        : '';

      const prompt = `Anda adalah guru ahli dan penyusun soal evaluasi akademik madrasah (MTsN 3 Banyuwangi).
Tugas Anda: Buat persis ${numCount} butir soal latihan pilihan ganda berkualitas tinggi yang MURNI DIAMBIL DARI MATERI BERIKUT:

Judul Materi: ${materialTitle}
Konten Materi Lengkap:
${materialContent.slice(0, 9000)}
${imagesContext}
ATURAN MUTLAK KUALITAS SOAL & ANTI-JAWABAN GANDA / AMBIGU:
1. MURNI DARI TEKS MATERI: Pertanyaan, kunci jawaban, dan pembahasan WAJIB diambil langsung dari fakta, istilah, definisi, proses, atau contoh konkret yang tertulis di dalam teks materi di atas. JANGAN menyisipkan pengetahuan luar yang tidak dibahas dalam teks.
2. TEPAT SATU (1) JAWABAN BENAR (CRITICAL):
   - Setiap butir soal HANYA MEMILIKI SATU (1) JAWABAN YANG BENAR, yaitu opsi pada indeks 'correctIndex'.
   - Opsi jawaban benar harus merupakan pernyataan akurat sesuai isi teks.
3. DILARANG KERAS MEMBUAT PENGECOH YANG JUGA BENAR (ANTI-JAWABAN GANDA):
   - Tiga (3) pilihan pengecoh (distractor) HARUS SECARA EKSPLISIT SALAH / KELIRU menurut teks materi!
   - PERINGATAN KERAS: JANGAN PERNAH mengambil kalimat atau fakta benar dari paragraf lain untuk dijadikan opsi pengecoh! Jika siswa memilih opsi tersebut dan ternyata bernilai benar menurut materi, siswa akan merasa dirugikan karena disalahkan oleh sistem.
   - Cara membuat 3 opsi pengecoh yang aman dan valid:
     * Balikkan fakta atau fungsi (misal: "menghambat pengangkutan zat...", "hanya terjadi jika tidak ada cahaya matahari...", dsb).
     * Tukar peran komponen/istilah dengan fungsi yang keliru.
     * Ubah hasil reaksi atau produk yang disebutkan dalam materi.
4. PERTANYAAN FOKUS, SPESIFIK & TIDAK AMBIGU:
   - Rumuskan pertanyaan secara lugas dan terarah (Contoh baik: "Organel sel apa yang berfungsi menyerap energi matahari pada daun?", "Zat apa yang dihasilkan dari fotolisis air?").
   - Hindari pertanyaan umum multitafsir seperti "Manakah pernyataan yang benar?" yang opsi-opsinya mengutip berbagai kalimat lepas dari teks.
5. KUNCI JAWABAN (correctIndex) HARUS DIACAK:
   - Nilai correctIndex wajib tersebar merata di antara 0, 1, 2, dan 3 (jangan terkumpul pada satu indeks).
6. PEMBAHASAN MENDIDIK:
   - Sertakan kutipan atau rujukan kalimat materi pada bagian "explanation" untuk membuktikan mengapa opsi kunci adalah satu-satunya jawaban benar.

Format respon HARUS berupa array JSON murni (persis ${numCount} butir soal):
[
  {
    "id": "soal-1",
    "question": "Pertanyaan spesifik dan fokus yang menggali teks materi...",
    "imageUrl": "URL_GAMBAR_JIKA_SOAL_BERGAMBAR_ATAU_KOSONG",
    "imageCaption": "Keterangan gambar jika ada...",
    "options": [
      "Pilihan jawaban A yang spesifik",
      "Pilihan jawaban B yang spesifik",
      "Pilihan jawaban C yang spesifik",
      "Pilihan jawaban D yang spesifik"
    ],
    "correctIndex": 1,
    "explanation": "Penjelasan rujukan langsung dari materi mengapa hanya jawaban ini yang tepat...",
    "topic": "${materialTitle || 'Materi Pokok'}",
    "points": ${Math.round(100 / numCount)}
  }
]`;

      let textResult = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          }
        });
        textResult = response.text || '';
      } catch (err1) {
        try {
          const res2 = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            }
          });
          textResult = res2.text || '';
        } catch (err2) {
          // Fall through to smart content-extraction generator
        }
      }

      if (textResult) {
        const cleaned = cleanJsonString(textResult);
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ success: true, questions: parsed });
        }
      }
    }

    // Smart fallback if AI unavailable or parse issue
    const fallbackQuestions = generateFallbackQuiz(materialTitle, materialContent, numCount, materialImages);
    return res.json({ success: true, questions: fallbackQuestions, isFallback: true });
  } catch (error: any) {
    console.error('Error generating latihan:', error);
    const fallback = generateFallbackQuiz(materialTitle, materialContent, numCount, materialImages);
    return res.json({ success: true, questions: fallback, isFallback: true });
  }
});

// 2. Endpoint: Generate Game Edukasi sesuai Perintah / Prompt Guru & Pilihan Tipe Game
app.post('/api/ai/generate-game', async (req, res) => {
  try {
    const { 
      prompt: userPrompt = '', 
      materialTitle = '', 
      materialContent = '', 
      gameType = 'memory_match',
      acrossCount = 4,
      downCount = 4,
      totalPoints = 100,
      materialImages = []
    } = req.body;
    const ai = getGeminiClient();

    if (ai && (userPrompt.trim() || materialTitle || gameType)) {
      const systemInstruction = `Anda adalah desainer game edukasi interaktif untuk siswa madrasah (MTsN 3 Banyuwangi).
Tipe game yang dipilih: "${gameType}"
Perintah/Prompt Guru: "${userPrompt}"
Judul materi: "${materialTitle}"
Konten materi: ${materialContent.slice(0, 5000)}
${gameType === 'crossword' ? `Konfigurasi Teka-Teki Silang (TTS):
- Jumlah soal Mendatar (Across): ${acrossCount}
- Jumlah soal Menurun (Down): ${downCount}
- Total Poin: ${totalPoints}
KUNCI JAWABAN TTS HARUS BERUPA KATA TUNGGAL DENGAN HURUF BESAR TANPA SPASI (misal: FOTOSINTESIS, KLOROPLAS, STOMATA, XILEM, FLOEM).` : ''}
${gameType === 'image_match' ? `Daftar Gambar Materi Tersedia:
${materialImages.map((m: any, i: number) => `- Gambar ${i + 1}: Nama: "${m.name}", Deskripsi: "${m.caption}", URL: "${m.url}"`).join('\n')}
Gunakan gambar di atas untuk dipasangkan dengan nama konsep yang tepat.` : ''}

Susun konten game edukatif sesuai tipe "${gameType}" dalam format JSON murni:
Format JSON:
{
  "id": "game-${Date.now()}",
  "title": "Judul Game Edukasi yang Menarik",
  "type": "${gameType}",
  "description": "Deskripsi singkat dan mendidik mengenai game ini",
  "instructions": "Cara bermain yang jelas untuk siswa",
  "targetScore": ${totalPoints || 100},
  "pairs": [ // WAJIB ada jika type memory_match (minimal 6 pasang: term dan definition)
    { "id": "p-1", "term": "Istilah Singkat", "definition": "Penjelasan/Arti Singkat", "topic": "${materialTitle}" }
  ],
  "triviaQuestions": [ // WAJIB ada jika type speed_trivia (minimal 5 soal pilihan ganda cepat)
    {
      "id": "t-1",
      "question": "Pertanyaan cepat...",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correctIndex": 0,
      "points": 20
    }
  ],
  "scrambleWords": [ // WAJIB ada jika type word_scramble (minimal 5 kata kunci huruf acak dengan petunjuk)
    { "id": "w-1", "word": "FOTOSINTESIS", "hint": "Proses pembentukan makanan pada tumbuhan hijau", "points": 20 }
  ],
  "trueFalseItems": [ // WAJIB ada jika type true_false (minimal 5 pernyataan benar atau salah)
    { "id": "tf-1", "statement": "Pernyataan konsep materi...", "isTrue": true, "explanation": "Penjelasan fakta...", "points": 20 }
  ],
  "sortCategories": [ // WAJIB ada jika type card_sort (2-3 kategori masing-masing 2-4 item kata)
    { "id": "c-1", "name": "Kategori A", "items": ["Item 1", "Item 2"] }
  ],
  "crosswordConfig": { // WAJIB ada jika type crossword
    "acrossCount": ${acrossCount},
    "downCount": ${downCount},
    "totalPoints": ${totalPoints},
    "clues": [ // Daftar soal mendatar (across) dan menurun (down)
      { "id": "c-ac-1", "number": 1, "direction": "across", "clue": "Petunjuk mendatar...", "answer": "FOTOSINTESIS", "row": 0, "col": 0 },
      { "id": "c-dn-1", "number": 2, "direction": "down", "clue": "Petunjuk menurun...", "answer": "KLOROFIL", "row": 0, "col": 2 }
    ]
  },
  "imageMatchConfig": { // WAJIB ada jika type image_match
    "targetScore": ${totalPoints || 100},
    "items": [ // Pasangan gambar dan nama dari materi
      { "id": "im-1", "imageUrl": "URL_GAMBAR", "name": "Nama Objek/Konsep", "description": "Petunjuk singkat" }
    ]
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: systemInstruction,
        config: {
          responseMimeType: 'application/json',
        }
      });

      if (response.text) {
        const cleaned = cleanJsonString(response.text);
        const parsed = JSON.parse(cleaned);
        
        // If crossword, ensure valid crossword grid coordinates
        if (gameType === 'crossword' && parsed.crosswordConfig?.clues) {
          const acrossClues = parsed.crosswordConfig.clues.filter((c: any) => c.direction === 'across');
          const downClues = parsed.crosswordConfig.clues.filter((c: any) => c.direction === 'down');
          parsed.crosswordConfig = buildCrosswordGrid(acrossClues, downClues, totalPoints);
        }

        return res.json({ success: true, game: parsed });
      }
    }

    // Smart fallback matching the user's prompt and selected game type
    const fallbackGame = generateFallbackGame(userPrompt, materialTitle, materialContent, gameType, acrossCount, downCount, totalPoints, materialImages);
    return res.json({ success: true, game: fallbackGame, isFallback: true });
  } catch (error: any) {
    console.error('Error generating game:', error);
    const { 
      prompt: userPrompt = '', 
      materialTitle = '', 
      materialContent = '', 
      gameType = 'memory_match',
      acrossCount = 4,
      downCount = 4,
      totalPoints = 100,
      materialImages = []
    } = req.body;
    const fallback = generateFallbackGame(userPrompt, materialTitle, materialContent, gameType, acrossCount, downCount, totalPoints, materialImages);
    return res.json({ success: true, game: fallback, isFallback: true });
  }
});

// 3. Endpoint: Generate Asesmen Akhir dari Materi yang Diupload (Ditenagai AI Gemini)
app.post('/api/ai/generate-assessment', async (req, res) => {
  const { materialTitle = '', materialContent = '', count = 5, materialImages = [] } = req.body;
  const numCount = Math.max(1, Math.min(20, Number(count) || 5));

  try {
    const ai = getGeminiClient();

    if (ai) {
      const imagesContext = Array.isArray(materialImages) && materialImages.length > 0
        ? `\nINFORMASI GAMBAR PADA MATERI (PENTING - KEBUTUHAN ASESMEN BERBASIS GAMBAR):
Materi yang diupload memuat ${materialImages.length} gambar berikut:
${materialImages.map((m: any, i: number) => `- Gambar ${i + 1}: Nama: "${m.name || 'Gambar ' + (i+1)}", Keterangan: "${m.caption || ''}", URL: "${m.url}"`).join('\n')}

ATURAN WAJIB ASESMEN BERBASIS GAMBAR:
Karena materi memuat gambar, buatlah minimal 1 atau 2 butir soal asesmen penalaran HOTS yang MENGANALISIS GAMBAR di atas!
Untuk butir soal berbasis gambar tersebut:
- Rumuskan pertanyaan penalaran / interpretasi data visual (misal: "Cermati gambar berikut! Berdasarkan skema proses pada gambar, analisis manakah yang membuktikan terjadinya reaksi terang?")
- Sertakan field "imageUrl" dengan URL gambar materi.
- Sertakan field "imageCaption" dengan nama/keterangan gambar yang relevan.\n`
        : '';

      const prompt = `Anda adalah tim penilai dan pengembang asesmen kurikulum madrasah MTsN 3 Banyuwangi.
Tugas Anda: Buat persis ${numCount} butir soal asesmen akhir bab (evaluasi komprehensif / penalaran HOTS) yang MURNI BERSUMBER DARI TEKS MATERI:

Judul Materi: ${materialTitle}
Konten Materi:
${materialContent.slice(0, 9000)}
${imagesContext}
ATURAN WAJIB & KETAT ANTI-JAWABAN GANDA / AMBIGU:
1. PENGAMBILAN DARI TEKS MATERI: Soal wajib menguji pemahaman konsep tingkat tinggi, analisis kasus, evaluasi hubungan sebab-akibat yang secara nyata dibahas dalam teks bacaan di atas.
2. TEPAT SATU (1) JAWABAN BENAR:
   - Setiap soal HANYA MEMILIKI SATU (1) OPSI BENAR pada indeks 'correctIndex'.
3. DILARANG KERAS PENGECOH YANG JUGA BENAR:
   - Tiga (3) pilihan pengecoh (distractor) HARUS BENAR-BENAR SALAH / TIDAK TEPAT menurut teks materi!
   - JANGAN menggunakan kalimat/pernyataan dari paragraf lain yang juga bernilai BENAR sebagai pengecoh.
   - Pengecoh harus berupa rumusan kesimpulan yang salah, pembalikan konsep materi, atau inferensi keliru.
4. SOAL JELAS & FOKUS:
   - Rumuskan premis soal secara jelas dan spesifik.
5. KUNCI JAWABAN (correctIndex) HARUS DIACAK:
   - Nilai correctIndex wajib bervariasi di antara 0, 1, 2, atau 3 untuk masing-masing soal.
6. PEMBAHASAN AKADEMIK:
   - Sertakan kutipan argumen materi pendukung pada "explanation".

Format respon HARUS berupa array JSON murni (persis ${numCount} butir soal):
[
  {
    "id": "asesmen-1",
    "question": "Pertanyaan asesmen analisis/HOTS yang jelas dan mendalam...",
    "imageUrl": "URL_GAMBAR_JIKA_ADA_ATAU_KOSONG",
    "imageCaption": "Keterangan gambar jika ada...",
    "options": [
      "Opsi A yang analitis dan kontekstual",
      "Opsi B yang analitis dan kontekstual",
      "Opsi C yang analitis dan kontekstual",
      "Opsi D yang analitis dan kontekstual"
    ],
    "correctIndex": 2,
    "explanation": "Uraian ilmiah mengapa jawaban ini satu-satunya yang benar mengacu fakta bacaan...",
    "topic": "Evaluasi Komprehensif: ${materialTitle || 'Materi Pokok'}",
    "points": ${Math.round(100 / numCount)}
  }
]`;

      let textResult = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          }
        });
        textResult = response.text || '';
      } catch (err1) {
        try {
          const res2 = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            }
          });
          textResult = res2.text || '';
        } catch (err2) {
          // AI failed, smart fallback will be used
        }
      }

      if (textResult) {
        const cleaned = cleanJsonString(textResult);
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ success: true, questions: parsed });
        }
      }
    }

    const fallbackQuestions = generateFallbackAssessment(materialTitle, materialContent, numCount, materialImages);
    return res.json({ success: true, questions: fallbackQuestions, isFallback: true });
  } catch (error: any) {
    console.error('Error generating assessment:', error);
    const fallback = generateFallbackAssessment(materialTitle, materialContent, numCount, materialImages);
    return res.json({ success: true, questions: fallback, isFallback: true });
  }
});

// 4. Endpoint: Generate Cek Pemahaman Bacaan (Pilihan Ganda & Isian Singkat)
app.post('/api/ai/generate-reading-check', async (req, res) => {
  try {
    const { materialTitle = '', materialContent = '' } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `Buatkan 3 pertanyaan cek pemahaman membaca (kombinasi Pilihan Ganda dan Isian Singkat) untuk membuktikan siswa membaca materi:
Judul: ${materialTitle}
Materi: ${materialContent.slice(0, 6000)}

Format JSON murni:
[
  {
    "id": "check-1",
    "type": "multiple_choice",
    "question": "Pertanyaan pembuktian membaca pilihan ganda...",
    "options": ["Jawaban Benar", "Pilihan Salah 1", "Pilihan Salah 2", "Pilihan Salah 3"],
    "correctIndex": 0,
    "explanation": "Dikutip langsung dari materi...",
    "pointCorrect": 10,
    "pointWrong": 0
  },
  {
    "id": "check-2",
    "type": "short_answer",
    "question": "Sebutkan istilah yang dijelaskan pada paragraf awal materi...",
    "acceptedAnswers": ["istilah kunci", "nama konsep"],
    "explanation": "Istilah ini tercantum jelas dalam bacaan.",
    "pointCorrect": 15,
    "pointWrong": 0
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      if (response.text) {
        const cleaned = cleanJsonString(response.text);
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ success: true, checkQuestions: parsed });
        }
      }
    }

    const fallback = generateFallbackReadingCheck(materialTitle, materialContent);
    return res.json({ success: true, checkQuestions: fallback, isFallback: true });
  } catch (error: any) {
    console.error('Error generating reading check:', error);
    const { materialTitle = '', materialContent = '' } = req.body;
    const fallback = generateFallbackReadingCheck(materialTitle, materialContent);
    return res.json({ success: true, checkQuestions: fallback, isFallback: true });
  }
});

// --- Smart Fallback Generators with Rich Variety & True Content Extraction ---
interface ExtractedItem {
  type: 'definition' | 'function' | 'cause' | 'component' | 'fact';
  term: string;
  statement: string;
  detail: string;
}

function cleanExcerpt(text: string, maxLen = 120): string {
  if (!text) return '';
  let cleaned = text.replace(/^[-*•\d.)\s]+/, '').trim();
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen).replace(/[,;:\s]+[^,;:\s]*$/, '') + '...';
  }
  return cleaned;
}

function extractSentencesFromContent(content: string): string[] {
  if (!content) return [];
  return content
    .replace(/\r?\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim().replace(/^[-*•\d.)\s]+/, ''))
    .filter(s => s.length >= 25 && !/^(halaman|bab\s+\d+|daftar\s+isi|gambar|tabel)\b/i.test(s));
}

function extractKeyItemsFromContent(content: string, title: string): ExtractedItem[] {
  const sentences = extractSentencesFromContent(content);
  const items: ExtractedItem[] = [];

  for (const s of sentences) {
    // 1. Definition patterns: X adalah / merupakan / yaitu / ialah Y
    const defMatch = s.match(/^([^,.:;()]{3,40})\s+(adalah|merupakan|yaitu|ialah|diartikan sebagai)\s+([^.!?]{15,})/i);
    if (defMatch) {
      items.push({
        type: 'definition',
        term: defMatch[1].trim(),
        statement: s,
        detail: defMatch[3].trim()
      });
      continue;
    }

    // 2. Function / Purpose patterns: X berfungsi untuk / bertujuan untuk / berperan dalam Y
    const funcMatch = s.match(/(.*?)\s+(berfungsi untuk|bertujuan untuk|berperan dalam|memiliki peranan)\s+([^.!?]{15,})/i);
    if (funcMatch) {
      items.push({
        type: 'function',
        term: funcMatch[1].slice(-35).trim() || title,
        statement: s,
        detail: funcMatch[3].trim()
      });
      continue;
    }

    // 3. Cause-effect patterns
    const causeMatch = s.match(/(.*?)\s+(disebabkan oleh|mengakibatkan|sehingga|menghasilkan|karena)\s+([^.!?]{15,})/i);
    if (causeMatch) {
      items.push({
        type: 'cause',
        term: causeMatch[1].slice(-35).trim() || title,
        statement: s,
        detail: causeMatch[3].trim()
      });
      continue;
    }

    // 4. Component / Classification patterns
    const compMatch = s.match(/(.*?)\s+(meliputi|terdiri atas|terbagi atas|mencakup|terdiri dari)\s+([^.!?]{15,})/i);
    if (compMatch) {
      items.push({
        type: 'component',
        term: compMatch[1].slice(-35).trim() || title,
        statement: s,
        detail: compMatch[3].trim()
      });
      continue;
    }

    // General fact
    if (items.length < 30) {
      items.push({
        type: 'fact',
        term: title,
        statement: s,
        detail: s
      });
    }
  }

  return items;
}

function shuffleWithTracking(items: string[]): { shuffled: string[]; newCorrectIndex: number } {
  const indexed = items.map((val, idx) => ({ val, isOriginal: idx === 0 }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  const newIndex = indexed.findIndex(item => item.isOriginal);
  return {
    shuffled: indexed.map(item => item.val),
    newCorrectIndex: newIndex >= 0 ? newIndex : 0,
  };
}

function generateFallbackQuiz(title: string, content: string, count: number, materialImages: any[] = []) {
  const cleanTitle = title || 'Materi Pembelajaran';
  const sentences = extractSentencesFromContent(content);
  const items = extractKeyItemsFromContent(content, cleanTitle);
  const totalSentences = sentences.length;

  const list = [];
  for (let i = 0; i < count; i++) {
    let questionText = '';
    let rawOptions: string[] = [];
    let explanation = '';
    let imageUrl: string | undefined = undefined;
    let imageCaption: string | undefined = undefined;

    const hasImages = Array.isArray(materialImages) && materialImages.length > 0;
    const shouldAddImage = hasImages && (i === 0 || (i === 2 && materialImages.length > 1));

    if (shouldAddImage) {
      const selectedImg = materialImages[i % materialImages.length];
      imageUrl = selectedImg.url;
      imageCaption = selectedImg.caption || selectedImg.name || `Ilustrasi Materi ${cleanTitle}`;
    }

    if (items.length > 0) {
      const item = items[i % items.length];

      // Smart falsification: create clear, distinct distractors that are unequivocally FALSE
      const optCorrect = cleanExcerpt(item.detail, 110);
      const optDistractor1 = `Menghambat atau meniadakan peran normal dari ${cleanExcerpt(item.term, 35)}`;
      const optDistractor2 = `Tidak memiliki keterkaitan fungsional dengan proses dalam materi ${cleanTitle}`;
      const optDistractor3 = `Hanya bersifat pasif tanpa memberikan pengaruh atau hasil nyata pada sistem`;

      if (shouldAddImage) {
        questionText = `Perhatikan gambar berikut (${imageCaption})! Berdasarkan gambar tersebut dan teks bacaan materi, bagaimanakah fungsi atau peran utama dari "${item.term}"?`;
        explanation = `Rujukan materi berbasis gambar: "${cleanExcerpt(item.statement, 130)}".`;
      } else if (item.type === 'definition') {
        questionText = `Berdasarkan teks materi, apakah pengertian yang tepat mengenai "${item.term}"?`;
        explanation = `Rujukan fakta dari teks materi: "${cleanExcerpt(item.statement, 130)}".`;
      } else if (item.type === 'function') {
        questionText = `Berdasarkan uraian materi, apakah fungsi utama dari "${item.term}"?`;
        explanation = `Berdasarkan teks materi: "${cleanExcerpt(item.statement, 130)}".`;
      } else if (item.type === 'cause') {
        questionText = `Mengacu pada teks bacaan, apakah dampak atau akibat dari "${item.term}"?`;
        explanation = `Tercantum pada teks bacaan: "${cleanExcerpt(item.statement, 130)}".`;
      } else if (item.type === 'component') {
        questionText = `Berdasarkan materi yang dipelajari, komponen yang berkaitan erat dengan "${item.term}" adalah...`;
        explanation = `Sesuai penjelasan dalam modul: "${cleanExcerpt(item.statement, 130)}".`;
      } else {
        questionText = `Berdasarkan materi "${cleanTitle}", bagaimanakah penjelasan yang benar terkait "${item.term}"?`;
        explanation = `Keterangan dari materi bab: "${cleanExcerpt(item.statement, 130)}".`;
      }

      rawOptions = [
        optCorrect,
        optDistractor1,
        optDistractor2,
        optDistractor3
      ];
    } else if (totalSentences > 0) {
      const target = sentences[i % totalSentences];

      if (shouldAddImage) {
        questionText = `Perhatikan gambar berikut (${imageCaption})! Mengacu pada materi "${cleanTitle}", fakta manakah yang paling tepat terbukti: "${cleanExcerpt(target, 75)}..."?`;
      } else {
        questionText = `Berdasarkan materi bab "${cleanTitle}", pernyataan manakah yang secara tepat menguraikan fakta berikut: "${cleanExcerpt(target, 85)}..."?`;
      }

      rawOptions = [
        cleanExcerpt(target, 110),
        `Pernyataan tersebut bertentangan langsung dengan fakta dalam modul ${cleanTitle}`,
        `Informasi ini dibantah oleh kesimpulan penelitian yang diuraikan dalam bab ini`,
        `Fenomena ini dinyatakan tidak pernah terjadi di bawah kondisi normal materi`
      ];
      explanation = `Sesuai fakta bacaan pada bab "${cleanTitle}": "${cleanExcerpt(target, 130)}".`;
    } else {
      const noContentQuestions = [
        {
          q: `Apakah kompetensi inti yang dipelajari pada bab "${cleanTitle}"?`,
          c: `Memahami definisi mendasar, klasifikasi, dan prinsip kerja ${cleanTitle}`,
          d1: `Hanya menghafalkan rumus atau istilah teknis tanpa pemahaman materi`,
          d2: `Mengabaikan keterkaitan dengan materi madrasah sebelumnya`,
          d3: `Mempersepsikan konsep bab ini tidak memiliki penerapan nyata`,
          exp: `Penguasaan ${cleanTitle} memerlukan pemahaman konsep inti dan aplikasinya secara komprehensif.`
        },
        {
          q: `Bagaimanakah penerapan konsep "${cleanTitle}" dalam kehidupan sehari-hari siswa madrasah?`,
          c: `Menerapkan kaidah dan nilai positifnya dalam perilaku jujur serta bernalar kritis`,
          d1: `Hanya menggunakannya saat menghadapi ujian tertulis`,
          d2: `Menerapkan konsep tersebut tanpa memperhatikan etika Islami`,
          d3: `Menyerahkan pemahaman materi seutuhnya kepada teman sebaya`,
          exp: `Penerapan materi madrasah senantiasa diiringi integrasi nilai akhlakul karimah.`
        },
        {
          q: `Dalam struktur pembelajaran "${cleanTitle}", apa tujuan utama dari evaluasi berkala?`,
          c: `Mengukur ketuntasan belajar dan daya nalar analitis siswa secara berkesinambungan`,
          d1: `Memberikan sanksi akademik kepada siswa yang lambat membaca materi`,
          d2: `Mengurangi alokasi jam tatap muka guru di dalam kelas`,
          d3: `Menyamaratakan nilai seluruh siswa tanpa memperhatikan progres individu`,
          exp: `Evaluasi bertujuan mengukur ketercapaian kompetensi pembelajaran secara objektif.`
        },
        {
          q: `Sikap ilmiah apa yang paling penting dikembangkan saat mempelajari materi "${cleanTitle}"?`,
          c: `Ketelitian, rasa ingin tahu yang tinggi, dan kejujuran akademis`,
          d1: `Menolak kritik dan mempertahankan pendapat sendiri tanpa rujukan ilmiah`,
          d2: `Mengambil kesimpulan tergesa-gesa tanpa pembuktian fakta materi`,
          d3: `Menjiplak hasil karya orang lain demi kepraktisan tugas mandiri`,
          exp: `Sikap ilmiah dan integritas adalah karakter unggul madrasah.`
        },
        {
          q: `Apa manfaat utama dari pemahaman materi "${cleanTitle}" terhadap kesiapan asesmen akhir?`,
          c: `Memberikan landasan konseptual yang kokoh untuk menjawab soal-soal penalaran HOTS`,
          d1: `Menjamin kelulusan instan tanpa perlu membaca literatur modul`,
          d2: `Memudahkan menebak jawaban tanpa perlu menganalisis permasalahan`,
          d3: `Menggugurkan seluruh kewajiban praktikum dan tugas mandiri`,
          exp: `Pemahaman menyeluruh menjadi modal penting menjawab asesmen HOTS.`
        }
      ];

      const chosen = noContentQuestions[i % noContentQuestions.length];
      questionText = shouldAddImage ? `Perhatikan gambar berikut (${imageCaption})! ${chosen.q}` : chosen.q;
      rawOptions = [chosen.c, chosen.d1, chosen.d2, chosen.d3];
      explanation = chosen.exp;
    }

    const { shuffled, newCorrectIndex } = shuffleWithTracking(rawOptions);
    list.push({
      id: `soal-${Date.now()}-${i + 1}`,
      question: questionText,
      options: shuffled,
      correctIndex: newCorrectIndex,
      explanation,
      topic: cleanTitle,
      points: Math.round(100 / count),
      ...(imageUrl ? { imageUrl, imageCaption } : {})
    });
  }
  return list;
}

function generateFallbackAssessment(title: string, content: string, count: number, materialImages: any[] = []) {
  const cleanTitle = title || 'Materi Pembelajaran';
  const sentences = extractSentencesFromContent(content);
  const items = extractKeyItemsFromContent(content, cleanTitle);
  const totalSentences = sentences.length;

  const list = [];
  for (let i = 0; i < count; i++) {
    let questionText = '';
    let rawOptions: string[] = [];
    let explanation = '';
    let imageUrl: string | undefined = undefined;
    let imageCaption: string | undefined = undefined;

    const hasImages = Array.isArray(materialImages) && materialImages.length > 0;
    const shouldAddImage = hasImages && (i === 0 || (i === 2 && materialImages.length > 1));

    if (shouldAddImage) {
      const selectedImg = materialImages[i % materialImages.length];
      imageUrl = selectedImg.url;
      imageCaption = selectedImg.caption || selectedImg.name || `Ilustrasi Materi ${cleanTitle}`;
    }

    if (items.length > 0) {
      const item = items[i % items.length];

      if (shouldAddImage) {
        questionText = `[Asesmen HOTS Berbasis Gambar] Cermati gambar berikut (${imageCaption})! Berdasarkan telaah konsep "${item.term}", bagaimanakah simpulan ilmiah yang paling tepat sesuai fakta materi?`;
      } else {
        questionText = `[Asesmen Evaluasi HOTS ${i + 1}] Berdasarkan telaah mendalam terhadap konsep "${item.term}", bagaimanakah simpulan ilmiah yang paling tepat sesuai fakta materi?`;
      }

      const optCorrect = cleanExcerpt(item.detail, 110);
      const optDistractor1 = `Konsep tersebut tidak memiliki dasar ilmiah dan ditolak dalam pembahasan bab ${cleanTitle}`;
      const optDistractor2 = `Pengaruhnya berlawanan dengan teori dan merusak keteraturan proses yang ada`;
      const optDistractor3 = `Hanya relevan jika seluruh variabel lain diabaikan dan tidak dapat diuji kebenarannya`;

      rawOptions = [
        optCorrect,
        optDistractor1,
        optDistractor2,
        optDistractor3
      ];

      explanation = `Asesmen HOTS menguji penalaran siswa berlandaskan teks materi: "${cleanExcerpt(item.statement, 130)}".`;
    } else if (totalSentences > 0) {
      const target = sentences[i % totalSentences];

      if (shouldAddImage) {
        questionText = `[Asesmen HOTS Berbasis Gambar] Cermati gambar berikut (${imageCaption})! Jika dikaitkan dengan fakta materi: "${cleanExcerpt(target, 70)}...", interpretasi ilmiah manakah yang paling akurat?`;
      } else {
        questionText = `[Asesmen Evaluasi HOTS ${i + 1}] Jika dikaitkan dengan fakta materi: "${cleanExcerpt(target, 85)}...", interpretasi ilmiah manakah yang paling akurat?`;
      }

      rawOptions = [
        cleanExcerpt(target, 110),
        `Fakta tersebut tidak terbukti dan bertentangan dengan materi bab ini`,
        `Kesimpulan ini hanya berlaku untuk kondisi khusus di luar pembahasan pokok`,
        `Hubungan sebab-akibat yang dijelaskan tidak memiliki korelasi yang valid`
      ];

      explanation = `Asesmen menguji kemampuan penalaran tingkat tinggi siswa berdasar teks materi: "${cleanExcerpt(target, 130)}".`;
    } else {
      questionText = shouldAddImage
        ? `[Asesmen HOTS Berbasis Gambar] Perhatikan gambar berikut (${imageCaption})! Bagaimana implikasi penting konsep "${cleanTitle}" bila diterapkan dalam pemecahan masalah kontekstual?`
        : `[Asesmen HOTS ${i + 1}] Bagaimana implikasi penting dari materi "${cleanTitle}" bila diterapkan dalam pemecahan masalah kontekstual madrasah?`;
      rawOptions = [
        `Memperkuat landasan pemecahan masalah ilmiah yang teruji, aplikatif, dan beretika`,
        `Mengurangi tingkat ketelitian analisis karena semata-mata mengandalkan intuisi`,
        `Hanya berlaku pada tataran teori laboratorium tanpa dampak praktis nyata`,
        `Memerlukan eliminasi prinsip dasar yang sudah diajarkan pada bab sebelumnya`
      ];
      explanation = `Evaluasi komprehensif memastikan siswa mampu mengintegrasikan konsep ${cleanTitle} ke ranah kognitif tingkat tinggi.`;
    }

    const { shuffled, newCorrectIndex } = shuffleWithTracking(rawOptions);

    list.push({
      id: `asesmen-${Date.now()}-${i + 1}`,
      question: questionText,
      options: shuffled,
      correctIndex: newCorrectIndex,
      explanation,
      topic: `Evaluasi HOTS: ${cleanTitle}`,
      points: Math.round(100 / count),
      ...(imageUrl ? { imageUrl, imageCaption } : {})
    });
  }
  return list;
}

function generateFallbackReadingCheck(title: string, content: string) {
  const cleanTitle = title || 'Materi Pembelajaran';
  const sentences = extractSentencesFromContent(content);

  if (sentences.length >= 2) {
    const s1 = sentences[0];
    const s2 = sentences[1];

    const raw1 = [
      cleanExcerpt(s1, 100),
      `Materi membantah keberadaan konsep tersebut sama sekali`,
      `Informasi ini hanya ditujukan untuk pembelajaran di luar kurikulum`,
      `Tidak ada rujukan teks yang mendukung pernyataan tersebut`
    ];
    const opt1 = shuffleWithTracking(raw1);

    const raw2 = [
      `Memahami bahwa konsep "${cleanExcerpt(s2, 60)}" menjadi dasar pembahasan lanjutan`,
      `Melewatkan paragraf kedua karena dianggap tidak berhubungan dengan materi`,
      `Menyimpulkan bahwa materi tidak memiliki kesinambungan konsep yang jelas`,
      `Fakta tersebut bertolak belakang dengan pembahasan pada bab awal`
    ];
    const opt2 = shuffleWithTracking(raw2);

    return [
      {
        id: `check-${Date.now()}-1`,
        type: 'multiple_choice' as const,
        question: `Berdasarkan bagian awal modul "${cleanTitle}", apakah pokok bahasan utama yang diuraikan?`,
        options: opt1.shuffled,
        correctIndex: opt1.newCorrectIndex,
        explanation: `Dikutip langsung dari awal bacaan materi: "${cleanExcerpt(s1, 110)}".`,
        pointCorrect: 10,
        pointWrong: 0
      },
      {
        id: `check-${Date.now()}-2`,
        type: 'multiple_choice' as const,
        question: `Mengapa konsep pada kalimat: "${cleanExcerpt(s2, 75)}..." penting dipahami sebelum lanjut ke latihan soal?`,
        options: opt2.shuffled,
        correctIndex: opt2.newCorrectIndex,
        explanation: `Pembuktian membaca: pemahaman konsep awal memastikan siswa siap mengerjakan latihan dan game.`,
        pointCorrect: 10,
        pointWrong: 0
      }
    ];
  }

  return [
    {
      id: `check-${Date.now()}-1`,
      type: 'multiple_choice' as const,
      question: `Apakah topik utama yang dibahas secara mendalam dalam bacaan "${cleanTitle}"?`,
      options: [
        `Pokok bahasan dan konsep kunci materi ${cleanTitle}`,
        `Topik umum di luar kurikulum bab ini`,
        `Daftar riwayat hidup penulis buku referensi`,
        `Informasi tambahan yang tidak berkaitan dengan modul`
      ],
      correctIndex: 0,
      explanation: `Pertanyaan ini memastikan siswa telah menyimak materi awal dari bacaan ${cleanTitle}.`,
      pointCorrect: 10,
      pointWrong: 0
    },
    {
      id: `check-${Date.now()}-2`,
      type: 'multiple_choice' as const,
      question: `Berdasarkan uraian bacaan, apa kesimpulan penting yang dapat ditarik oleh siswa?`,
      options: [
        `Penguasaan materi secara menyeluruh penting untuk pengerjaan soal dan game edukasi`,
        `Materi bacaan hanya formalitas tanpa perlu dipelajari dengan saksama`,
        `Tidak ada kaitan antara bacaan dengan latihan soal yang diujikan`,
        `Materi bacaan tidak memuat poin pembelajaran esensial`
      ],
      correctIndex: 0,
      explanation: `Siswa yang membaca modul memahami tujuan pembelajaran secara tuntas.`,
      pointCorrect: 10,
      pointWrong: 0
    }
  ];
}

function generateFallbackGame(
  prompt: string, 
  title: string, 
  content: string, 
  gameType: string = 'memory_match',
  acrossCount: number = 4,
  downCount: number = 4,
  totalPoints: number = 100,
  materialImages: any[] = []
) {
  const p = prompt.toLowerCase();
  const cleanTitle = title || 'Materi Madrasah';
  
  let detectedType = gameType;
  if (!detectedType || detectedType === 'memory_match') {
    if (p.includes('silang') || p.includes('tts') || p.includes('crossword') || p.includes('mendatar') || p.includes('menurun')) {
      detectedType = 'crossword';
    } else if (p.includes('jodoh') || p.includes('gambar') || p.includes('match') || p.includes('cocokkan gambar')) {
      detectedType = 'image_match';
    } else if (p.includes('trivia') || p.includes('kecepatan') || p.includes('waktu') || p.includes('kuis kilat')) {
      detectedType = 'speed_trivia';
    } else if (p.includes('scramble') || p.includes('susun kata') || p.includes('huruf') || p.includes('kosakata')) {
      detectedType = 'word_scramble';
    } else if (p.includes('benar salah') || p.includes('true false') || p.includes('pernyataan')) {
      detectedType = 'true_false';
    } else if (p.includes('kelompok') || p.includes('kategori') || p.includes('sort') || p.includes('klasifikasi')) {
      detectedType = 'card_sort';
    }
  }

  // 6. TEKA-TEKI SILANG (TTS / CROSSWORD)
  if (detectedType === 'crossword') {
    const defaultAcross = [
      { clue: `Proses biokimia pembentukan glukosa oleh tumbuhan berklorofil`, answer: 'FOTOSINTESIS' },
      { clue: `Mulut daun tempat sirkulasi karbondioksida dan oksigen`, answer: 'STOMATA' },
      { clue: `Pembuluh pengangkut air dari akar menuju daun`, answer: 'XILEM' },
      { clue: `Cairan kloroplas tempat berlangsungnya Siklus Calvin`, answer: 'STROMA' },
      { clue: `Gula sederhana sumber energi utama hasil fotosintesis`, answer: 'GLUKOSA' },
      { clue: `Zat cair mutlak yang dipecah pada reaksi fotolisis`, answer: 'AIR' }
    ].slice(0, Math.max(1, Math.min(10, acrossCount || 4)));

    const defaultDown = [
      { clue: `Pigmen hijau penyerap foton energi cahaya matahari`, answer: 'KLOROFIL' },
      { clue: `Pembuluh pengangkut hasil fotosintesis ke seluruh jaringan`, answer: 'FLOEM' },
      { clue: `Gas esensial yang dilepaskan ke udara saat fotolisis`, answer: 'OKSIGEN' },
      { clue: `Gas karbon yang diserap dari atmosfer oleh stomata`, answer: 'KARBON' },
      { clue: `Kantung membran tilakoid tempat reaksi terang berlangsung`, answer: 'TILAKOID' }
    ].slice(0, Math.max(1, Math.min(10, downCount || 4)));

    const crosswordConfig = buildCrosswordGrid(defaultAcross, defaultDown, totalPoints || 100);

    return {
      id: `game-${Date.now()}`,
      title: `Teka-Teki Silang (TTS): ${cleanTitle}`,
      type: 'crossword' as const,
      description: `Teka-teki silang edukatif menguji ketepatan istilah materi ${cleanTitle} (Mendatar & Menurun).`,
      instructions: 'Pilih nomor soal mendatar atau menurun, lalu ketik huruf jawaban pada kotak-kotak TTS! Selesaikan seluruh kotak.',
      targetScore: totalPoints || 100,
      crosswordConfig
    };
  }

  // 7. MENJODOHKAN GAMBAR DAN NAMA (IMAGE MATCH)
  if (detectedType === 'image_match') {
    let items = [];
    if (Array.isArray(materialImages) && materialImages.length > 0) {
      items = materialImages.slice(0, 6).map((img: any, idx: number) => ({
        id: `im-${idx + 1}`,
        imageUrl: img.url,
        name: img.name || `Konsep ${idx + 1}`,
        description: img.caption || `Keterangan gambar materi ${idx + 1}`
      }));
    } else {
      items = [
        {
          id: 'im-1',
          imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=80',
          name: 'Struktur Jaringan Daun',
          description: 'Organ tempat terjadinya proses fotosintesis'
        },
        {
          id: 'im-2',
          imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=500&auto=format&fit=crop&q=80',
          name: 'Klorofil & Daun Hijau',
          description: 'Pigmen hijau penyerap foton cahaya matahari'
        },
        {
          id: 'im-3',
          imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=500&auto=format&fit=crop&q=80',
          name: 'Stomata pada Daun',
          description: 'Mulut daun untuk pertukaran gas CO₂ dan O₂'
        },
        {
          id: 'im-4',
          imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
          name: 'Berkas Pengangkut Vaskuler',
          description: 'Xilem dan floem pengangkut air dan fotosintat'
        }
      ];
    }

    return {
      id: `game-${Date.now()}`,
      title: `Menjodohkan Gambar & Nama: ${cleanTitle}`,
      type: 'image_match' as const,
      description: `Cocokkan antara gambar ilustrasi dengan nama konsep atau istilah ilmiah yang sesuai.`,
      instructions: 'Klik kartu gambar di sisi kiri, kemudian klik nama yang cocok di sisi kanan!',
      targetScore: totalPoints || 100,
      imageMatchConfig: {
        targetScore: totalPoints || 100,
        items
      }
    };
  }

  if (detectedType === 'speed_trivia') {
    return {
      id: `game-${Date.now()}`,
      title: `Kuis Kilat Edukasi: ${cleanTitle}`,
      type: 'speed_trivia' as const,
      description: `Game kuis kecepatan interaktif dibuat berdasarkan perintah: "${prompt || 'Tantangan kuis kilat'}"`,
      instructions: 'Jawab setiap soal sebelum waktu habis! Dapatkan combo streak untuk melipatgandakan skor.',
      targetScore: 100,
      triviaQuestions: [
        {
          id: 'sq-1',
          question: `Pertanyaan 1 seputar ${cleanTitle}: Konsep mana yang paling mendasar?`,
          options: ['Konsep Utama Sesuai Materi', 'Konsep Pengalih 1', 'Konsep Pengalih 2', 'Konsep Pengalih 3'],
          correctIndex: 0,
          points: 20
        },
        {
          id: 'sq-2',
          question: `Pertanyaan 2: Manakah pernyataan yang benar terkait materi ${cleanTitle}?`,
          options: ['Pernyataan Tepat Berdasarkan Bacaan', 'Pernyataan Kurang Tepat', 'Pernyataan Keliru', 'Pernyataan Palsu'],
          correctIndex: 0,
          points: 20
        },
        {
          id: 'sq-3',
          question: `Pertanyaan 3: Apa tujuan utama dari pembelajaran bab ini?`,
          options: ['Meningkatkan Penguasaan dan Akhlak Islami', 'Hanya Menghafal Tanpa Memahami', 'Mencapai Nilai Formalitas', 'Mengabaikan Praktik'],
          correctIndex: 0,
          points: 20
        },
        {
          id: 'sq-4',
          question: `Pertanyaan 4: Dalam kehidupan madrasah, penerapan materi ini diwujudkan melalui apa?`,
          options: ['Sikap Disiplin, Tanggung Jawab & Bernalar Kritis', 'Mengabaikan Aturan', 'Bersikap Pasif', 'Menghindari Diskusi'],
          correctIndex: 0,
          points: 20
        },
        {
          id: 'sq-5',
          question: `Pertanyaan 5: Simpulan akhir dari pembelajaran ${cleanTitle} adalah?`,
          options: ['Pemahaman Utuh Siap Asesmen', 'Materi Belum Selesai', 'Perlu Remedial Penuh', 'Tidak Tuntas'],
          correctIndex: 0,
          points: 20
        }
      ]
    };
  }

  if (detectedType === 'word_scramble') {
    return {
      id: `game-${Date.now()}`,
      title: `Susun Kata Cepat: ${cleanTitle}`,
      type: 'word_scramble' as const,
      description: `Game susun huruf acak kosakata materi ${cleanTitle} sesuai prompt: "${prompt || 'Susun huruf istilah kunci'}"`,
      instructions: 'Susun kembali huruf-huruf yang teracak menjadi kata ilmiah yang benar sesuai petunjuk!',
      targetScore: 100,
      scrambleWords: [
        { id: 'ws-1', word: 'MADRASAH', hint: 'Lembaga pendidikan berciri khas Islam yang unggul', points: 20 },
        { id: 'ws-2', word: 'TAQWA', hint: 'Ketaatan dan kepatuhan penuh menjalankan perintah Allah', points: 20 },
        { id: 'ws-3', word: 'DISIPLIN', hint: 'Sikap taat aturan dan tertib dalam belajar', points: 20 },
        { id: 'ws-4', word: 'LITERASI', hint: 'Kemampuan membaca, memahami, dan menganalisis informasi', points: 20 },
        { id: 'ws-5', word: 'PRESTASI', hint: 'Hasil membanggakan dari ikhtiar dan ketekunan belajar', points: 20 }
      ]
    };
  }

  if (detectedType === 'true_false') {
    return {
      id: `game-${Date.now()}`,
      title: `Tantangan Kilat Benar atau Salah: ${cleanTitle}`,
      type: 'true_false' as const,
      description: `Uji ketangkasan analisis fakta materi ${cleanTitle} sesuai prompt: "${prompt || 'Pilih benar atau salah'}"`,
      instructions: 'Tentukan apakah setiap pernyataan BENAR atau SALAH secara cepat dan tepat!',
      targetScore: 100,
      trueFalseItems: [
        { id: 'tf-1', statement: `Materi ${cleanTitle} wajib dipelajari dengan tekun untuk memahami kompetensi dasar.`, isTrue: true, explanation: 'Benar, materi ini merupakan pilar esensial kurikulum madrasah.', points: 20 },
        { id: 'tf-2', statement: 'Membaca modul materi tidak berpengaruh terhadap nilai latihan soal dan asesmen.', isTrue: false, explanation: 'Salah, membaca materi secara tuntas adalah kunci menjawab soal dengan benar.', points: 20 },
        { id: 'tf-3', statement: 'Penerapan ilmu yang dipelajari harus berlandaskan akhlakul karimah.', isTrue: true, explanation: 'Benar, integritas moral menyatu dengan keunggulan akademik.', points: 20 },
        { id: 'tf-4', statement: 'Semua soal kuis madrasah hanya mengandalkan hafalan tanpa nalar kritis.', isTrue: false, explanation: 'Salah, soal kurikulum merdeka menuntut pemikiran analitis dan HOTS.', points: 20 },
        { id: 'tf-5', statement: 'Kerja sama yang baik dan kejujuran adalah nilai penting dalam proses belajar.', isTrue: true, explanation: 'Benar, kejujuran (shiddiq) adalah karakter utama siswa madrasah.', points: 20 }
      ]
    };
  }

  if (detectedType === 'card_sort') {
    return {
      id: `game-${Date.now()}`,
      title: `Klasifikasi & Pengelompokan Kategori: ${cleanTitle}`,
      type: 'card_sort' as const,
      description: `Kelompokkan istilah ke dalam kategori yang tepat sesuai prompt: "${prompt || 'Pengelompokan kategori'}"`,
      instructions: 'Pindahkan setiap kartu istilah ke dalam wadah kategori yang sesuai!',
      targetScore: 100,
      sortCategories: [
        { id: 'cat-1', name: 'Konsep Dasar & Teori', items: ['Definisi Utama', 'Prinsip Dasar', 'Latar Belakang'] },
        { id: 'cat-2', name: 'Aplikasi & Praktik', items: ['Penyelesaian Masalah', 'Eksperimen / Latihan', 'Implementasi Sehari-hari'] }
      ]
    };
  }

  // Default Memory Match Pairs
  return {
    id: `game-${Date.now()}`,
    title: `Kartu Memori Edukatif: ${cleanTitle}`,
    type: 'memory_match' as const,
    description: `Game mencocokkan kartu interaktif dibuat otomatis sesuai perintah: "${prompt || 'Cocokkan konsep dan artinya'}"`,
    instructions: 'Buka 2 kartu yang cocok antara Istilah dan Penjelasannya! Cocokkan semua pasang kartu secepat mungkin.',
    targetScore: 100,
    pairs: [
      { id: 'gp-1', term: `${cleanTitle} Bag. 1`, definition: 'Pengenalan dan Dasar Teoretis', topic: cleanTitle },
      { id: 'gp-2', term: `${cleanTitle} Bag. 2`, definition: 'Ciri Khas dan Karakteristik Utama', topic: cleanTitle },
      { id: 'gp-3', term: `${cleanTitle} Bag. 3`, definition: 'Penerapan Nyata dalam Kehidupan', topic: cleanTitle },
      { id: 'gp-4', term: 'Nilai Religius', definition: 'Penguatan Akhlakul Karimah MTsN 3', topic: cleanTitle },
      { id: 'gp-5', term: 'Nalar Kritis', definition: 'Kemampuan Analisis dan Berpikir Terstruktur', topic: cleanTitle },
      { id: 'gp-6', term: 'Evaluasi Tuntas', definition: 'Pencapaian KKM Maksimal Siswa', topic: cleanTitle }
    ]
  };
}

// Vite / Static setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server LMS MTsN 3 Banyuwangi running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
