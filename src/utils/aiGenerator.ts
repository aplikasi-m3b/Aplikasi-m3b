import { buildCrosswordGrid } from './crosswordGenerator';
import { QuestionItem, ChapterGame, ReadingCheckQuestion } from '../types';

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

export function generateQuizClient(
  title: string, 
  content: string, 
  count: number, 
  materialImages: any[] = []
): QuestionItem[] {
  const cleanTitle = title || 'Materi Pembelajaran';
  const sentences = extractSentencesFromContent(content);
  const items = extractKeyItemsFromContent(content, cleanTitle);
  const totalSentences = sentences.length;

  const list: QuestionItem[] = [];
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

      rawOptions = [optCorrect, optDistractor1, optDistractor2, optDistractor3];
    } else if (totalSentences > 0) {
      const target = sentences[i % totalSentences];

      if (shouldAddImage) {
        questionText = `Perhatikan gambar berikut (${imageCaption})! Mengacu pada materi "${cleanTitle}", fakta manakah yang paling tepat: "${cleanExcerpt(target, 75)}..."?`;
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
      questionText = `Berdasarkan materi "${cleanTitle}", pemahaman konsep pokok apa yang paling utama dikuasai siswa?`;
      rawOptions = [
        `Memahami definisi mendasar, fungsi utama, dan prinsip kerja ${cleanTitle}`,
        `Menghafalkan istilah teknis tanpa memahami keterkaitan konsep materi`,
        `Mengabaikan keterkaitan dengan materi pembelajaran madrasah lainnya`,
        `Menganggap materi tidak memiliki hubungan langsung dengan proses ilmiah`
      ];
      explanation = `Penguasaan ${cleanTitle} memerlukan pemahaman konsep inti dan aplikasinya secara menyeluruh.`;
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

export function generateAssessmentClient(
  title: string, 
  content: string, 
  count: number, 
  materialImages: any[] = []
): QuestionItem[] {
  const cleanTitle = title || 'Materi Pembelajaran';
  const sentences = extractSentencesFromContent(content);
  const items = extractKeyItemsFromContent(content, cleanTitle);
  const totalSentences = sentences.length;

  const list: QuestionItem[] = [];
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

      rawOptions = [optCorrect, optDistractor1, optDistractor2, optDistractor3];
      explanation = `Asesmen HOTS menguji penalaran siswa berlandaskan teks materi: "${cleanExcerpt(item.statement, 130)}".`;
    } else if (totalSentences > 0) {
      const target = sentences[i % totalSentences];
      questionText = `[Asesmen Evaluasi HOTS ${i + 1}] Jika dikaitkan dengan fakta materi: "${cleanExcerpt(target, 85)}...", interpretasi ilmiah manakah yang paling akurat?`;
      rawOptions = [
        cleanExcerpt(target, 110),
        `Fakta tersebut tidak terbukti dan bertentangan dengan materi bab ini`,
        `Kesimpulan ini hanya berlaku untuk kondisi khusus di luar pembahasan pokok`,
        `Hubungan sebab-akibat yang dijelaskan tidak memiliki korelasi yang valid`
      ];
      explanation = `Asesmen menguji kemampuan penalaran tingkat tinggi siswa berdasar teks materi: "${cleanExcerpt(target, 130)}".`;
    } else {
      questionText = `[Asesmen HOTS ${i + 1}] Bagaimana implikasi penting dari materi "${cleanTitle}" bila diterapkan dalam pemecahan masalah kontekstual madrasah?`;
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

export function generateReadingCheckClient(title: string, content: string): ReadingCheckQuestion[] {
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
        type: 'multiple_choice',
        question: `Berdasarkan bagian awal modul "${cleanTitle}", apakah pokok bahasan utama yang diuraikan?`,
        options: opt1.shuffled,
        correctIndex: opt1.newCorrectIndex,
        explanation: `Dikutip langsung dari awal bacaan materi: "${cleanExcerpt(s1, 110)}".`,
        pointCorrect: 10,
        pointWrong: 0
      },
      {
        id: `check-${Date.now()}-2`,
        type: 'multiple_choice',
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
      type: 'multiple_choice',
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
      type: 'multiple_choice',
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

export function generateGameClient(
  prompt: string, 
  title: string, 
  content: string, 
  gameType: string = 'memory_match',
  acrossCount: number = 4,
  downCount: number = 4,
  totalPoints: number = 100,
  materialImages: any[] = []
): ChapterGame {
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

  // Crossword
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
      type: 'crossword',
      description: `Teka-teki silang edukatif menguji ketepatan istilah materi ${cleanTitle} (Mendatar & Menurun).`,
      instructions: 'Pilih nomor soal mendatar atau menurun, lalu ketik huruf jawaban pada kotak-kotak TTS! Selesaikan seluruh kotak.',
      targetScore: totalPoints || 100,
      crosswordConfig
    };
  }

  // Image Match
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
      type: 'image_match',
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
      type: 'speed_trivia',
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
      type: 'word_scramble',
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
      type: 'true_false',
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
      type: 'card_sort',
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
    type: 'memory_match',
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
