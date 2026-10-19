import { ClassItem, Student, Chapter, NotificationItem, ChatMessage, PersonalRecommendation, StudentProgress, TeacherItem } from '../types';

export const INITIAL_TEACHERS: TeacherItem[] = [
  {
    id: 'teacher-main',
    name: 'Guru Utama (MTsN 3 Banyuwangi)',
    nip: '197508122002121003',
    email: 'kegiatanm3b@gmail.com',
    password: 'Guru-13531',
    isMainTeacher: true,
    subject: 'Koordinator Kurikulum & Admin Utama MTsN 3 Banyuwangi',
    phone: '0812-3456-7890',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    createdAt: 1704067200000,
    status: 'aktif',
  }
];

export const INITIAL_CLASSES: ClassItem[] = [
  {
    id: 'class-ipa-7a',
    name: 'Kelas 7A - Ilmu Pengetahuan Alam',
    subject: 'IPA (Biologi & Ekologi)',
    grade: 'Kelas 7 SMP',
    description: 'Eksplorasi ekosistem, fotosintesis tumbuhan hijau, dan keanekaragaman hayati nusantara.',
    code: 'IPA7A-2026',
    teacherId: 'teacher-main',
    teacherName: 'Guru Utama (MTsN 3 Banyuwangi)',
    createdAt: 1704067200000,
  },
  {
    id: 'class-mat-8b',
    name: 'Kelas 8B - Matematika Terapan',
    subject: 'Matematika Aljabar & Geometri',
    grade: 'Kelas 8 SMP',
    description: 'Memahami teorema Pythagoras, persamaan linear, dan statistika data sederhana.',
    code: 'MAT8B-2026',
    teacherId: 'teacher-main',
    teacherName: 'Guru Utama (MTsN 3 Banyuwangi)',
    createdAt: 1704067200000,
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'student-1',
    classId: 'class-ipa-7a',
    name: 'Ahmad Fauzan',
    nis: '0081291001',
    gender: 'Laki-laki',
    password: '123',
    totalPoints: 340,
    completedItemsCount: 6,
  },
  {
    id: 'student-2',
    classId: 'class-ipa-7a',
    name: 'Siti Nurhaliza',
    nis: '0081291002',
    gender: 'Perempuan',
    password: '123',
    totalPoints: 480,
    completedItemsCount: 8,
  },
  {
    id: 'student-3',
    classId: 'class-ipa-7a',
    name: 'Budi Santoso',
    nis: '0081291003',
    gender: 'Laki-laki',
    password: '123',
    totalPoints: 190,
    completedItemsCount: 3,
  },
  {
    id: 'student-4',
    classId: 'class-ipa-7a',
    name: 'Dewi Lestari',
    nis: '0081291004',
    gender: 'Perempuan',
    password: '123',
    totalPoints: 260,
    completedItemsCount: 4,
  },
  {
    id: 'student-5',
    classId: 'class-mat-8b',
    name: 'Rian Pratama',
    nis: '0082018105',
    gender: 'Laki-laki',
    password: '123',
    totalPoints: 210,
    completedItemsCount: 4,
  },
  {
    id: 'student-6',
    classId: 'class-mat-8b',
    name: 'Zahra Putri',
    nis: '0082018206',
    gender: 'Perempuan',
    password: '123',
    totalPoints: 320,
    completedItemsCount: 5,
  }
];

export const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: 'chap-ipa-1',
    classId: 'class-ipa-7a',
    assignedClassIds: ['class-ipa-7a'],
    teacherId: 'teacher-main',
    teacherName: 'Guru Utama (MTsN 3 Banyuwangi)',
    chapterNumber: 1,
    order: 1,
    title: 'Bab 1: Proses Fotosintesis & Klorofil',
    description: 'Mempelajari reaksi terang, reaksi gelap, kloroplas, serta peranan fotosintesis dalam menjaga pasokan oksigen bumi.',
    material: {
      id: 'mat-ipa-1',
      title: 'Mekanisme Fotosintesis pada Daun Tumbuhan',
      readingTimeMinutes: 5,
      uploadedFile: {
        fileName: 'Modul-Resmi-Bab-1-Fotosintesis-MTsN3Banyuwangi.pdf',
        fileType: 'pdf',
        fileSize: 245760,
        uploadedAt: Date.now() - 86400000 * 5,
        extractedImages: [
          {
            id: 'img-kloroplas-1',
            url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
            name: 'Kloroplas',
            caption: 'Mikrograf organel kloroplas sel daun tempat pigmen klorofil menyerap cahaya matahari'
          },
          {
            id: 'img-stomata-1',
            url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
            name: 'Stomata',
            caption: 'Stoma daun pada mikroskop elektron tempat difusi pertukaran gas fotosintesis'
          }
        ]
      },
      content: `## Pengertian Fotosintesis
Fotosintesis adalah proses biokimia pembentukan zat makanan seperti glukosa yang dilakukan oleh tumbuhan hijau dengan memanfaatkan energi cahaya matahari.

### Rumus Kimia Fotosintesis:
\`\`\`
6CO₂ (Karbondioksida) + 6H₂O (Air) + Cahaya Matahari → C₆H₁₂O₆ (Glukosa) + 6O₂ (Oksigen)
\`\`\`

### Bagian Daun yang Berperan Penting:
1. **Kloroplas**: Organel sel tempat berlangsungnya reaksi fotosintesis. Kloroplas memiliki pigmen hijau bernama **klorofil**.
2. **Stomata**: Mulut daun tempat pertukaran gas karbondioksida (CO₂) masuk dan oksigen (O₂) keluar.
3. **Berkas Pembuluh Xilem & Floem**:
   - **Xilem** mengangkut air dan unsur hara dari akar ke daun.
   - **Floem** mengedarkan hasil fotosintesis ke seluruh jaringan tumbuhan.

### Tahapan Fotosintesis:
- **Reaksi Terang (Fotolisis)**: Terjadi di membran tilakoid kloroplas, memerlukan sinar matahari untuk memecah molekul air menjadi ion hidrogen dan melepaskan oksigen.
- **Reaksi Gelap (Siklus Calvin)**: Terjadi di stroma kloroplas, tidak memerlukan cahaya langsung, mengubah CO₂ menjadi karbohidrat (glukosa).`,
      summaryPoints: [
        'Klorofil menangkap foton cahaya matahari di dalam tilakoid kloroplas.',
        'Bahan baku utama adalah Air (H₂O) dari akar dan Karbondioksida (CO₂) dari stomata.',
        'Hasil akhir berupa Glukosa (energi cadangan) dan Oksigen (O₂) yang dilepaskan ke atmosfer.',
        'Reaksi terang menghasilkan ATP & NADPH, reaksi gelap menghasilkan glukosa.'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=sQK3Yr4Sc_k',
      images: [
        {
          id: 'img-kloroplas-1',
          url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
          name: 'Kloroplas',
          caption: 'Mikrograf organel kloroplas sel daun tempat pigmen klorofil menyerap cahaya matahari'
        },
        {
          id: 'img-stomata-1',
          url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
          name: 'Stomata',
          caption: 'Mulut daun (stomata) tempat keluar masuknya gas CO₂ dan O₂'
        },
        {
          id: 'img-daun-1',
          url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
          name: 'Jaringan Daun',
          caption: 'Penampang helai daun hijau yang aktif melakukan fotolisis fotosintesis'
        }
      ]
    },
    quiz: {
      id: 'quiz-ipa-1',
      title: 'Latihan Soal Pemahaman Fotosintesis',
      passingScore: 70,
      timeLimitMinutes: 10,
      questions: [
        {
          id: 'q1',
          question: 'Perhatikan gambar organel sel daun berikut. Bagian yang berfungsi sebagai tempat berlangsungnya fotosintesis dan mengandung pigmen hijau adalah...',
          options: ['Mitokondria', 'Kloroplas', 'Ribosom', 'Retikulum Endoplasma'],
          correctIndex: 1,
          explanation: 'Kloroplas mengandung pigmen klorofil yang menyerap sinar matahari untuk reaksi fotosintesis.',
          topic: 'Struktur Kloroplas',
          points: 25,
          imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
          imageCaption: 'Gambar 1: Mikrograf organel kloroplas pada sel daun tumbuhan hijau'
        },
        {
          id: 'q2',
          question: 'Perhatikan gambar pori mulut daun di atas. Gas yang diserap oleh tumbuhan melalui bagian tersebut untuk bahan baku reaksi fotosintesis adalah...',
          options: ['Karbondioksida (CO₂)', 'Oksigen (O₂)', 'Nitrogen (N₂)', 'Karbonmonoksida (CO)'],
          correctIndex: 0,
          explanation: 'CO₂ diambil melalui stomata untuk bahan baku reaksi gelap siklus Calvin.',
          topic: 'Pertukaran Gas Daun',
          points: 25,
          imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
          imageCaption: 'Gambar 2: Penampakan celah stomata pada epidermis bawah daun'
        },
        {
          id: 'q3',
          question: 'Pada reaksi terang fotosintesis, proses fotolisis menghasilkan gas...',
          options: ['Karbondioksida', 'Hidrogen Sulfida', 'Oksigen', 'Metana'],
          correctIndex: 2,
          explanation: 'Fotolisis air (H₂O) memecah molekul menjadi elektron, proton H+, dan melepaskan Oksigen (O₂).',
          topic: 'Reaksi Terang',
          points: 25
        },
        {
          id: 'q4',
          question: 'Jaringan pengangkut yang bertugas mengedarkan hasil fotosintesis ke seluruh tubuh tumbuhan adalah...',
          options: ['Xilem', 'Kambium', 'Floem', 'Epidermis'],
          correctIndex: 2,
          explanation: 'Floem membawa hasil fotosintesis (sukrosa/glukosa) dari daun ke seluruh bagian tanaman.',
          topic: 'Jaringan Tumbuhan',
          points: 25
        }
      ]
    },
    game: {
      id: 'game-ipa-1',
      title: 'Game Edukasi: Cocokkan Konsep Fotosintesis',
      type: 'memory_match',
      description: 'Latih memori dan pemahaman Anda dengan memadukan istilah biologi dengan fungsinya yang tepat!',
      instructions: 'Buka kartu berpasangan. Cocokkan istilah dengan fungsi atau deskripsi yang sesuai secepat mungkin!',
      targetScore: 100,
      timeLimitMinutes: 8,
      pairs: [
        { id: 'p1', term: 'Klorofil', definition: 'Pigmen hijau penyerap foton cahaya matahari', topic: 'Pigmen Daun' },
        { id: 'p2', term: 'Stomata', definition: 'Mulut daun untuk respirasi dan sirkulasi gas', topic: 'Anatomi Daun' },
        { id: 'p3', term: 'Floem', definition: 'Pembuluh pengangkut hasil glukosa ke organ lain', topic: 'Jaringan Tumbuhan' },
        { id: 'p4', term: 'Reaksi Terang', definition: 'Pemecahan molekul air menghasilkan oksigen', topic: 'Fotolisis' },
        { id: 'p5', term: 'Stroma', definition: 'Cairan kloroplas tempat berlangsungnya Siklus Calvin', topic: 'Organel Kloroplas' },
        { id: 'p6', term: 'Xilem', definition: 'Pembuluh pengangkut air dari akar menuju daun', topic: 'Jaringan Tumbuhan' }
      ]
    },
    assessment: {
      id: 'assess-ipa-1',
      title: 'Asesmen Akhir Bab 1: Penguasaan Fotosintesis',
      passingScore: 75,
      timeLimitMinutes: 15,
      questions: [
        {
          id: 'a1',
          question: 'Perhatikan mikrograf kloroplas berikut. Seorang siswa membungkus sehelai daun dengan aluminium foil sebelum matahari terbit, kemudian mengujinya dengan larutan iodin. Daun yang ditutup tidak berubah warna menjadi biru-kehitaman karena...',
          options: [
            'Daun tidak menyerap air',
            'Daun tidak dapat berfotosintesis dan tidak menghasilkan amilum',
            'Klorofil di daun rusak oleh aluminium',
            'Kadar karbondioksida terlalu tinggi di dalam bungkusan'
          ],
          correctIndex: 1,
          explanation: 'Uji iodin mendeteksi amilum (pati). Tanpa cahaya, fotosintesis terhenti sehingga tidak terbentuk amilum.',
          topic: 'Eksperimen Sach',
          points: 33,
          imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
          imageCaption: 'Ilustrasi Asesmen: Kloroplas daun yang membutuhkan energi cahaya untuk pembentukan pati amilum'
        },
        {
          id: 'a2',
          question: 'Perhatikan zat-zat berikut: (1) O₂ (2) CO₂ (3) H₂O (4) Glukosa. Zat yang merupakan produk akhir fotosintesis adalah...',
          options: ['(1) dan (2)', '(2) dan (3)', '(1) dan (4)', '(3) dan (4)'],
          correctIndex: 2,
          explanation: 'Produk fotosintesis adalah glukosa (karbohidrat) dan oksigen (O₂).',
          topic: 'Mekanisme Fotosintesis',
          points: 33
        },
        {
          id: 'a3',
          question: 'Faktor eksternal apa yang secara langsung membatasi laju fotosintesis saat cuaca mendung gelap?',
          options: ['Suhu tanah', 'Intensitas cahaya matahari', 'Kelembapan udara akar', 'Kandungan nitrogen bebas'],
          correctIndex: 1,
          explanation: 'Intensitas cahaya adalah penggerak fotolisis reaksi terang; saat gelap laju fotosintesis menurun drastis.',
          topic: 'Faktor Fotosintesis',
          points: 34
        }
      ]
    }
  },
  {
    id: 'chap-ipa-2',
    classId: 'class-ipa-7a',
    assignedClassIds: ['class-ipa-7a'],
    teacherId: 'teacher-main',
    teacherName: 'Guru Utama (MTsN 3 Banyuwangi)',
    chapterNumber: 2,
    order: 2,
    title: 'Bab 2: Rantai Makanan & Jaring-Jaring Ekosistem',
    description: 'Memahami interaksi produsen, konsumen tingkat 1-3, dekomposer, serta aliran energi dan piramida biomassa.',
    material: {
      id: 'mat-ipa-2',
      title: 'Dinamika Aliran Energi pada Ekosistem Alami',
      readingTimeMinutes: 6,
      uploadedFile: {
        fileName: 'Bahan-Ajar-Bab-2-Rantai-Makanan-Ekosistem.docx',
        fileType: 'docx',
        fileSize: 184320,
        uploadedAt: Date.now() - 86400000 * 3,
        extractedImages: []
      },
      content: `## Struktur Trofik Ekosistem
Dalam sebuah ekosistem, setiap organisme memiliki kedudukan tertentu dalam perpindahan materi dan energi yang disebut **Tingkat Trofik**:

1. **Trofik 1 (Produsen)**: Organisme autotrof seperti tumbuhan hijau dan fitoplankton yang mengubah energi matahari menjadi biomassa.
2. **Trofik 2 (Konsumen Primer / Herbivora)**: Hewan pemakan produsen, misalnya ulat, belalang, kelinci, zooplankton.
3. **Trofik 3 (Konsumen Sekunder / Karnivora Kecil)**: Pemakan herbivora, misalnya katak, burung pemakan serangga.
4. **Trofik 4 (Konsumen Tersier / Predator Puncak)**: Pemakan karnivora, misalnya elang, singa, hiu.
5. **Pengurai (Dekomposer / Detritivor)**: Bakteri dan jamur pembusuk yang menguraikan sisa organisme mati menjadi nutrisi anorganik tanah.

### Hukum Aliran Energi (10% Rule):
Hanya sekitar 10% energi dari satu tingkat trofik yang berhasil ditransfer ke tingkat trofik di atasnya. Sisanya (90%) hilang sebagai panas metabolik, ekskresi, dan aktivitas gerak.`,
      summaryPoints: [
        'Produsen menempati dasar piramida energi dengan cadangan kalori terbesar.',
        'Rantai makanan menggambarkan jalur searah, sedangkan jaring-jaring makanan menunjukkan interaksi kompleks antar berbagai rantai makanan.',
        'Dekomposer mengembalikan unsur hara penting seperti nitrogen dan fosfor kembali ke tanah.',
        'Semakin tinggi tingkat trofik, biomassa dan energi yang tersedia semakin mengecil.'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=VgbpC3m4sP4',
      images: [
        {
          id: 'img-trofik-1',
          url: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=600&auto=format&fit=crop&q=80',
          name: 'Predator Puncak',
          caption: 'Hewan karnivora pemangsa pada tingkat trofik puncak ekosistem'
        },
        {
          id: 'img-herbivora-1',
          url: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=600&auto=format&fit=crop&q=80',
          name: 'Konsumen Herbivora',
          caption: 'Konsumen primer pemakan tumbuhan hijau produsen'
        }
      ]
    },
    quiz: {
      id: 'quiz-ipa-2',
      title: 'Latihan Soal Rantai Makanan dan Trofik',
      passingScore: 70,
      timeLimitMinutes: 12,
      questions: [
        {
          id: 'q2-1',
          question: 'Organisme yang berperan mengubah zat anorganik menjadi bahan organik makanan disebut...',
          options: ['Autotrof / Produsen', 'Konsumen Tersier', 'Dekomposer', 'Detritivor'],
          correctIndex: 0,
          explanation: 'Organisme autotrof seperti tumbuhan hijau dapat menyintesis makanannya sendiri melalui fotosintesis.',
          topic: 'Tingkat Trofik',
          points: 25
        },
        {
          id: 'q2-2',
          question: 'Jika populasi ular di sawah dibasmi oleh manusia, maka dampak yang langsung terjadi adalah...',
          options: ['Populasi padi meningkat', 'Populasi tikus meningkat tajam', 'Populasi elang meningkat', 'Air sawah mengering'],
          correctIndex: 1,
          explanation: 'Ular adalah predator alami tikus; hilangnya predator menyebabkan ledakan populasi hama tikus.',
          topic: 'Keseimbangan Ekosistem',
          points: 25
        },
        {
          id: 'q2-3',
          question: 'Peran jamur dan bakteri dalam siklus materi ekosistem adalah sebagai...',
          options: ['Produsen kedua', 'Konsumen primer', 'Pengurai / Dekomposer', 'Parasit wajib'],
          correctIndex: 2,
          explanation: 'Dekomposer merombak sisa makhluk hidup menjadi mineral hara bagi tumbuhan.',
          topic: 'Dekomposer',
          points: 25
        },
        {
          id: 'q2-4',
          question: 'Berdasarkan hukum aliran energi 10%, jika produsen memiliki 10.000 kkal energi, energi yang diterima konsumen primer adalah...',
          options: ['10.000 kkal', '1.000 kkal', '100 kkal', '10 kkal'],
          correctIndex: 1,
          explanation: '10% dari 10.000 kkal = 1.000 kkal energi yang diteruskan ke herbivora.',
          topic: 'Piramida Energi',
          points: 25
        }
      ]
    },
    game: {
      id: 'game-ipa-2',
      title: 'Game Teka-Teki Silang (TTS): Ekosistem & Trofik',
      type: 'crossword',
      description: 'Asah wawasan biologi Anda dengan melengkapi kotak teka-teki silang mendatar dan menurun seputar rantai makanan!',
      instructions: 'Klik kotak pada kisi teka-teki silang, lalu ketik huruf jawaban yang tepat sesuai petunjuk mendatar atau menurun!',
      targetScore: 100,
      timeLimitMinutes: 10,
      crosswordConfig: {
        acrossCount: 3,
        downCount: 3,
        totalPoints: 100,
        clues: [
          {
            id: 'c-a-1',
            number: 1,
            direction: 'across',
            clue: 'Organisme autotrof penghasil makanan pertama dalam rantai makanan',
            answer: 'PRODUSEN',
            row: 0,
            col: 0,
          },
          {
            id: 'c-a-2',
            number: 3,
            direction: 'across',
            clue: 'Hewan pemakan tumbuhan yang menduduki konsumen primer',
            answer: 'HERBIVORA',
            row: 2,
            col: 0,
          },
          {
            id: 'c-a-3',
            number: 5,
            direction: 'across',
            clue: 'Organisme pengurai bangkai dan sisa materi organik',
            answer: 'DEKOMPOSER',
            row: 4,
            col: 0,
          },
          {
            id: 'c-d-1',
            number: 1,
            direction: 'down',
            clue: 'Bentuk diagram tingkatan biomassa trofik ekosistem',
            answer: 'PIRAMIDA',
            row: 0,
            col: 0,
          },
          {
            id: 'c-d-2',
            number: 2,
            direction: 'down',
            clue: 'Hewan pemakan tumbuhan sekaligus daging/hewan lain',
            answer: 'OMNIVORA',
            row: 0,
            col: 2,
          },
          {
            id: 'c-d-3',
            number: 4,
            direction: 'down',
            clue: 'Burung pemangsa puncak karnivora',
            answer: 'ELANG',
            row: 1,
            col: 5,
          }
        ]
      }
    },
    assessment: {
      id: 'assess-ipa-2',
      title: 'Asesmen Akhir Bab 2: Dinamika Ekosistem',
      passingScore: 75,
      timeLimitMinutes: 20,
      questions: [
        {
          id: 'a2-1',
          question: 'Manakah dari pernyataan berikut yang membedakan rantai makanan dan jaring-jaring makanan?',
          options: [
            'Rantai makanan bersifat siklus, jaring makanan satu arah',
            'Rantai makanan linier tunggal, sedangkan jaring makanan kumpulan rantai makanan yang saling berhubungan',
            'Rantai makanan hanya terjadi di darat',
            'Jaring makanan tidak membutuhkan produsen'
          ],
          correctIndex: 1,
          explanation: 'Jaring-jaring makanan menunjukkan relasi makan dan dimakan yang lebih realistis dan saling terhubung.',
          topic: 'Konsep Jaring Makanan',
          points: 50
        },
        {
          id: 'a2-2',
          question: 'Mengapa energi yang tersisa di tingkat trofik teratas sangat sedikit?',
          options: [
            'Karena hewan karnivora tidak membutuhkan energi',
            'Sebagian besar energi hilang sebagai panas dan metabolisme pada setiap tingkatan',
            'Tumbuhan menyimpan semua energi dan tidak melepasnya',
            'Energi matahari diserap sepenuhnya oleh tanah'
          ],
          correctIndex: 1,
          explanation: 'Sesuai termodinamika biologis, sekitar 90% energi terbuang sebagai panas respirasi dan ekskresi.',
          topic: 'Efisiensi Energi',
          points: 50
        }
      ]
    }
  },
  {
    id: 'chap-ipa-3',
    classId: 'class-ipa-7a',
    assignedClassIds: ['class-ipa-7a'],
    teacherId: 'teacher-main',
    teacherName: 'Guru Utama (MTsN 3 Banyuwangi)',
    chapterNumber: 3,
    order: 3,
    title: 'Bab 3: Organel Sel & Anatomi Makhluk Hidup',
    description: 'Mengenal struktur organel sel hewan dan tumbuhan, mikrograf seluler, serta fungsinya melalui game menjodohkan gambar.',
    material: {
      id: 'mat-ipa-3',
      title: 'Struktur Organel Sel & Penampakan Visualnya',
      readingTimeMinutes: 5,
      content: `## Pengantar Organel Sel
Sel merupakan unit struktural dan fungsional terkecil dari makhluk hidup. Di dalam sitoplasma sel terdapat organel-organel penting dengan bentuk dan fungsi khas:

1. **Kloroplas**: Mengandung pigmen klorofil untuk reaksi fotosintesis pada sel tumbuhan.
2. **Mitokondria**: Berbentuk seperti sosis kecil dengan krista lipatan membran, berfungsi sebagai pabrik penghasil energi (ATP).
3. **Nukleus (Inti Sel)**: Mengatur seluruh kegiatan sel dan menyimpan materi genetik DNA.
4. **Stomata**: Celah khusus pada permukaan daun untuk transpirasi dan respirasi tanaman.`,
      summaryPoints: [
        'Kloroplas hanya terdapat pada sel tumbuhan hijau.',
        'Mitokondria adalah pusat respirasi aerob penghasil energi ATP.',
        'Inti sel (nukleus) bertindak sebagai pengendali utama aktivitas seluler.'
      ],
      images: [
        {
          id: 'img-sel-kloroplas',
          url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
          name: 'Kloroplas',
          caption: 'Organel tempat berlangsungnya fotosintesis pada daun'
        },
        {
          id: 'img-sel-stomata',
          url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
          name: 'Stomata Daun',
          caption: 'Mulut daun tempat respirasi gas tumbuhan'
        },
        {
          id: 'img-sel-daun',
          url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
          name: 'Jaringan Palisade Daun',
          caption: 'Lapisan sel tiang daun tempat fotosintesis maksimal'
        }
      ]
    },
    quiz: {
      id: 'quiz-ipa-3',
      title: 'Latihan Soal Organel Sel',
      passingScore: 70,
      timeLimitMinutes: 10,
      questions: [
        {
          id: 'q3-1',
          question: 'Perhatikan gambar organel klorofil berikut. Organel tersebut memiliki peran utama dalam...',
          options: ['Fotosintesis dan sintesis glukosa', 'Pencernaan intraseluler', 'Sintesis protein', 'Sekresi enzim'],
          correctIndex: 0,
          explanation: 'Kloroplas berperan menyerap cahaya matahari untuk sintesis glukosa.',
          topic: 'Organel Sel',
          points: 50,
          imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
          imageCaption: 'Organel kloroplas dengan membran tilakoid'
        },
        {
          id: 'q3-2',
          question: 'Organel sel yang berperan sebagai "the powerhouse of cell" atau penghasil energi adalah...',
          options: ['Mitokondria', 'Ribosom', 'Lisosom', 'Vakuola'],
          correctIndex: 0,
          explanation: 'Mitokondria menghasilkan ATP melalui fosforilasi oksidatif.',
          topic: 'Organel Sel',
          points: 50
        }
      ]
    },
    game: {
      id: 'game-ipa-3',
      title: 'Game Menjodohkan: Gambar & Nama Organel',
      type: 'image_match',
      description: 'Cocokkan kartu gambar visual organel sel dan jaringan dengan nama istilah konsep yang sesuai!',
      instructions: 'Klik satu kartu gambar di sebelah kiri, kemudian klik nama konsep yang sesuai di sebelah kanan!',
      targetScore: 100,
      timeLimitMinutes: 8,
      imageMatchConfig: {
        targetScore: 100,
        items: [
          {
            id: 'm-1',
            imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
            name: 'Kloroplas',
            description: 'Organel tempat sintesis glukosa fotosintesis'
          },
          {
            id: 'm-2',
            imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80',
            name: 'Stomata Daun',
            description: 'Mulut daun tempat respirasi pertukaran gas'
          },
          {
            id: 'm-3',
            imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80',
            name: 'Jaringan Daun Hijau',
            description: 'Jaringan fotosintesis tanaman autotrof'
          }
        ]
      }
    },
    assessment: {
      id: 'assess-ipa-3',
      title: 'Asesmen Akhir Bab 3: Penguasaan Sel & Anatomi',
      passingScore: 75,
      timeLimitMinutes: 15,
      questions: [
        {
          id: 'a3-1',
          question: 'Perhatikan gambar mikrograf kloroplas berikut. Bagian stroma pada kloroplas merupakan tempat terjadinya...',
          options: ['Reaksi Gelap (Siklus Calvin)', 'Fotolisis Reaksi Terang', 'Glikolisis', 'Transpor Elektron'],
          correctIndex: 0,
          explanation: 'Siklus Calvin (reaksi gelap) terjadi di dalam stroma kloroplas.',
          topic: 'Stroma Kloroplas',
          points: 50,
          imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
          imageCaption: 'Kloroplas dengan cairan stroma'
        },
        {
          id: 'a3-2',
          question: 'Perbedaan utama antara sel tumbuhan dan sel hewan adalah sel tumbuhan memiliki...',
          options: ['Dinding sel dan kloroplas', 'Sentriol dan lisosom', 'Ribosom dan mitokondria', 'Membran inti dan DNA'],
          correctIndex: 0,
          explanation: 'Sel tumbuhan memiliki dinding sel selulosa dan plastida/kloroplas yang tidak dimiliki sel hewan.',
          topic: 'Komparasi Sel',
          points: 50
        }
      ]
    }
  },
  {
    id: 'chap-mat-1',
    classId: 'class-mat-8b',
    assignedClassIds: ['class-mat-8b'],
    teacherId: 'teacher-main',
    teacherName: 'Guru Utama (MTsN 3 Banyuwangi)',
    chapterNumber: 1,
    order: 1,
    title: 'Bab 1: Teorema Pythagoras & Segitiga Siku-Siku',
    description: 'Memahami hubungan sisi miring (hipotenusa) pada segitiga siku-siku dan penerapan praktisnya.',
    material: {
      id: 'mat-mat-1',
      title: 'Konsep Dasar Teorema Pythagoras',
      readingTimeMinutes: 5,
      uploadedFile: {
        fileName: 'Modul-Teorema-Pythagoras-Kelas8.pdf',
        fileType: 'pdf',
        fileSize: 198656,
        uploadedAt: Date.now() - 86400000 * 4,
        extractedImages: []
      },
      content: `## Pengertian Teorema Pythagoras
Teorema Pythagoras menyatakan bahwa pada setiap segitiga siku-siku, kuadrat panjang sisi miring (hipotenusa) sama dengan jumlah kuadrat panjang sisi-sisi siku-sikunya.

### Rumus Utama:
\`\`\`
c² = a² + b²
\`\`\`
Dimana:
- **c** adalah panjang sisi miring (hipotenusa), yaitu sisi di hadapan sudut siku-siku (90°).
- **a** dan **b** adalah panjang sisi-sisi tegak siku-siku.

### Triple Pythagoras yang Sering Digunakan:
1. 3, 4, 5 (dan kelipatannya: 6, 8, 10)
2. 5, 12, 13 (dan kelipatannya: 10, 24, 26)
3. 7, 24, 25
4. 8, 15, 17`,
      summaryPoints: [
        'Teorema Pythagoras hanya berlaku khusus untuk segitiga siku-siku.',
        'Sisi miring (hipotenusa) selalu merupakan sisi terpanjang pada segitiga siku-siku.',
        'Rumus dasar pembuktian: c² = a² + b² atau c = √(a² + b²).'
      ],
      checkQuestions: [
        {
          id: 'check-mat-1',
          question: 'Pada segitiga siku-siku dengan panjang sisi tegak 3 cm dan 4 cm, berapa panjang sisi miringnya?',
          options: ['5 cm', '6 cm', '7 cm', '8 cm'],
          correctIndex: 0,
          explanation: 'c² = 3² + 4² = 9 + 16 = 25, maka c = √25 = 5 cm.',
          pointCorrect: 10,
          pointWrong: 0
        }
      ]
    },
    quiz: {
      id: 'quiz-mat-1',
      title: 'Latihan Soal Pythagoras',
      passingScore: 70,
      timeLimitMinutes: 15,
      questions: [
        {
          id: 'qm-1',
          question: 'Jika diketahui sisi tegak a = 6 cm dan b = 8 cm, maka panjang sisi miring c adalah...',
          options: ['10 cm', '12 cm', '14 cm', '15 cm'],
          correctIndex: 0,
          explanation: 'c = √(6² + 8²) = √(36 + 64) = √100 = 10 cm.',
          topic: 'Teorema Pythagoras',
          points: 50
        },
        {
          id: 'qm-2',
          question: 'Manakah dari kelompok bilangan berikut yang merupakan Triple Pythagoras?',
          options: ['5, 12, 13', '4, 5, 6', '6, 7, 8', '7, 8, 9'],
          correctIndex: 0,
          explanation: '5² + 12² = 25 + 144 = 169 = 13².',
          topic: 'Triple Pythagoras',
          points: 50
        }
      ]
    },
    game: {
      id: 'game-mat-1',
      title: 'Tantangan Benar/Salah: Teorema Pythagoras',
      type: 'true_false',
      description: 'Uji pemahaman kilat mengenai fakta segitiga siku-siku dan triple Pythagoras.',
      instructions: 'Tentukan apakah pernyataan matematika berikut Benar atau Salah!',
      targetScore: 100,
      timeLimitMinutes: 5,
      trueFalseItems: [
        {
          id: 'tf-m1',
          statement: 'Teorema Pythagoras dapat digunakan pada segitiga sama sisi sembarang tanpa membaginya menjadi siku-siku.',
          isTrue: false,
          explanation: 'Salah, teorema Pythagoras hanya berlaku langsung pada segitiga siku-siku.',
          points: 50
        },
        {
          id: 'tf-m2',
          statement: 'Panjang sisi miring (hipotenusa) selalu lebih panjang daripada panjang sisi tegak mana pun.',
          isTrue: true,
          explanation: 'Benar, hipotenusa berhadapan dengan sudut terbesar (90°).',
          points: 50
        }
      ]
    },
    assessment: {
      id: 'ass-mat-1',
      title: 'Asesmen Akhir: Penerapan Pythagoras',
      passingScore: 75,
      timeLimitMinutes: 20,
      questions: [
        {
          id: 'am-1',
          question: 'Sebuah tangga dengan panjang 10 meter disandarkan pada tembok. Jarak ujung bawah tangga ke tembok adalah 6 meter. Tinggi tembok yang dicapai tangga adalah...',
          options: ['8 meter', '7 meter', '9 meter', '7.5 meter'],
          correctIndex: 0,
          explanation: 't = √(10² - 6²) = √(100 - 36) = √64 = 8 meter.',
          topic: 'Penerapan Kontekstual',
          points: 50
        },
        {
          id: 'am-2',
          question: 'Sebuah kapal berlayar ke arah barat sejauh 12 mil, kemudian berbelok ke arah selatan sejauh 9 mil. Jarak terdekat kapal dari titik awal keberangkatan adalah...',
          options: ['15 mil', '21 mil', '18 mil', '16 mil'],
          correctIndex: 0,
          explanation: 'Jarak = √(12² + 9²) = √(144 + 81) = √225 = 15 mil.',
          topic: 'Jarak Terpendek',
          points: 50
        }
      ]
    }
  }
];

export const INITIAL_PROGRESS: StudentProgress[] = [
  {
    id: 'student-1_chap-ipa-1',
    studentId: 'student-1',
    chapterId: 'chap-ipa-1',
    classId: 'class-ipa-7a',
    materialCompleted: true,
    materialCompletedAt: Date.now() - 3600000 * 20,
    quizCompleted: true,
    quizScore: 75,
    quizPassed: true,
    quizCompletedAt: Date.now() - 3600000 * 18,
    gameCompleted: true,
    gameScore: 100,
    gameCompletedAt: Date.now() - 3600000 * 16,
    assessmentCompleted: true,
    assessmentScore: 67, // Need improvement!
    assessmentPassed: false,
    assessmentCompletedAt: Date.now() - 3600000 * 14,
    isUnlocked: true,
    topicScores: {
      'Struktur Kloroplas': { correct: 1, total: 1 },
      'Pertukaran Gas Daun': { correct: 1, total: 1 },
      'Reaksi Terang': { correct: 0, total: 1 }, // Weakness
      'Jaringan Tumbuhan': { correct: 1, total: 1 },
      'Eksperimen Sach': { correct: 0, total: 1 }, // Weakness
      'Faktor Fotosintesis': { correct: 1, total: 1 }
    }
  },
  {
    id: 'student-1_chap-ipa-2',
    studentId: 'student-1',
    chapterId: 'chap-ipa-2',
    classId: 'class-ipa-7a',
    materialCompleted: true,
    materialCompletedAt: Date.now() - 3600000 * 6,
    quizCompleted: false,
    gameCompleted: false,
    assessmentCompleted: false,
    isUnlocked: true,
  },
  {
    id: 'student-2_chap-ipa-1',
    studentId: 'student-2',
    chapterId: 'chap-ipa-1',
    classId: 'class-ipa-7a',
    materialCompleted: true,
    materialCompletedAt: Date.now() - 86400000 * 2,
    quizCompleted: true,
    quizScore: 100,
    quizPassed: true,
    quizCompletedAt: Date.now() - 86400000 * 2,
    gameCompleted: true,
    gameScore: 100,
    gameCompletedAt: Date.now() - 86400000 * 2,
    assessmentCompleted: true,
    assessmentScore: 100,
    assessmentPassed: true,
    assessmentCompletedAt: Date.now() - 86400000 * 2,
    isUnlocked: true,
    topicScores: {
      'Struktur Kloroplas': { correct: 1, total: 1 },
      'Pertukaran Gas Daun': { correct: 1, total: 1 },
      'Reaksi Terang': { correct: 1, total: 1 },
      'Jaringan Tumbuhan': { correct: 1, total: 1 },
      'Eksperimen Sach': { correct: 1, total: 1 },
      'Faktor Fotosintesis': { correct: 1, total: 1 }
    }
  },
  {
    id: 'student-2_chap-ipa-2',
    studentId: 'student-2',
    chapterId: 'chap-ipa-2',
    classId: 'class-ipa-7a',
    materialCompleted: true,
    quizCompleted: true,
    quizScore: 100,
    quizPassed: true,
    gameCompleted: true,
    gameScore: 120,
    assessmentCompleted: true,
    assessmentScore: 100,
    assessmentPassed: true,
    isUnlocked: true,
    topicScores: {
      'Tingkat Trofik': { correct: 1, total: 1 },
      'Keseimbangan Ekosistem': { correct: 1, total: 1 },
      'Dekomposer': { correct: 1, total: 1 },
      'Piramida Energi': { correct: 1, total: 1 }
    }
  },
  {
    id: 'student-3_chap-ipa-1',
    studentId: 'student-3',
    chapterId: 'chap-ipa-1',
    classId: 'class-ipa-7a',
    materialCompleted: true,
    materialCompletedAt: Date.now() - 3600000 * 8,
    quizCompleted: true,
    quizScore: 50,
    quizPassed: false,
    gameCompleted: true,
    gameScore: 70,
    assessmentCompleted: false,
    isUnlocked: true,
    topicScores: {
      'Struktur Kloroplas': { correct: 1, total: 1 },
      'Pertukaran Gas Daun': { correct: 0, total: 1 },
      'Reaksi Terang': { correct: 0, total: 1 },
      'Jaringan Tumbuhan': { correct: 1, total: 1 }
    }
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    teacherId: 'teacher-main',
    classId: 'class-ipa-7a',
    className: 'Kelas 7A - Ilmu Pengetahuan Alam',
    studentId: 'student-1',
    studentName: 'Ahmad Fauzan',
    type: 'asesmen',
    title: 'Selesai Mengerjakan Asesmen',
    message: 'Ahmad Fauzan telah menyelesaikan Asesmen Bab 1 dengan skor 67 (Perlu Remedial).',
    score: 67,
    timestamp: Date.now() - 3600000 * 14,
    read: false,
  },
  {
    id: 'notif-2',
    teacherId: 'teacher-main',
    classId: 'class-ipa-7a',
    className: 'Kelas 7A - Ilmu Pengetahuan Alam',
    studentId: 'student-1',
    studentName: 'Ahmad Fauzan',
    type: 'game',
    title: 'Game Edukasi Selesai',
    message: 'Ahmad Fauzan berhasil menyelesaikan Game Cocokkan Konsep Fotosintesis dengan skor 100!',
    score: 100,
    timestamp: Date.now() - 3600000 * 16,
    read: false,
  },
  {
    id: 'notif-3',
    teacherId: 'teacher-main',
    classId: 'class-ipa-7a',
    className: 'Kelas 7A - Ilmu Pengetahuan Alam',
    studentId: 'student-2',
    studentName: 'Siti Nurhaliza',
    type: 'asesmen',
    title: 'Prestasi Sempurna Asesmen Bab 2',
    message: 'Siti Nurhaliza meraih skor sempurna 100 pada Asesmen Akhir Bab 2!',
    score: 100,
    timestamp: Date.now() - 3600000 * 22,
    read: true,
  },
  {
    id: 'notif-4',
    teacherId: 'teacher-main',
    classId: 'class-ipa-7a',
    className: 'Kelas 7A - Ilmu Pengetahuan Alam',
    studentId: 'student-3',
    studentName: 'Budi Santoso',
    type: 'materi',
    title: 'Materi Telah Dibaca',
    message: 'Budi Santoso telah selesai membaca materi Bab 1: Mekanisme Fotosintesis.',
    timestamp: Date.now() - 3600000 * 8,
    read: false,
  }
];

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'chat-1',
    classId: 'class-ipa-7a',
    senderId: 'teacher-1',
    senderName: 'Ibu Rahmawati, S.Pd.',
    senderRole: 'guru',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    text: 'Selamat pagi anak-anak! Silakan selesaikan Bab 1 secara berurutan mulai dari membaca materi, latihan soal, game edukatif, dan asesmen akhir ya. Jika ada kendala, tanyakan di sini.',
    timestamp: Date.now() - 86400000 * 2,
  },
  {
    id: 'chat-2',
    classId: 'class-ipa-7a',
    senderId: 'student-1',
    senderName: 'Ahmad Fauzan',
    senderRole: 'siswa',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    text: 'Baik Bu! Saya sedang mempelajari reaksi terang fotosintesis. Bedanya dengan siklus calvin apa ya Bu?',
    timestamp: Date.now() - 86400000 * 1.5,
  },
  {
    id: 'chat-3',
    classId: 'class-ipa-7a',
    senderId: 'teacher-1',
    senderName: 'Ibu Rahmawati, S.Pd.',
    senderRole: 'guru',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    text: 'Pertanyaan bagus Fauzan! Reaksi terang membutuhkan cahaya matahari di tilakoid untuk memecah air menghasilkan O₂. Sedangkan Siklus Calvin (reaksi gelap) terjadi di stroma untuk menyusun glukosa tanpa butuh cahaya langsung.',
    timestamp: Date.now() - 86400000 * 1.4,
  },
  {
    id: 'chat-4',
    classId: 'class-ipa-7a',
    senderId: 'student-2',
    senderName: 'Siti Nurhaliza',
    senderRole: 'siswa',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    text: 'Game mencocokkan kartu seru sekali Bu! Sangat membantu mengingat fungsi klorofil dan stomata.',
    timestamp: Date.now() - 86400000 * 1,
  }
];

export const INITIAL_RECOMMENDATIONS: PersonalRecommendation[] = [
  {
    id: 'rec-1',
    studentId: 'student-1',
    studentName: 'Ahmad Fauzan',
    classId: 'class-ipa-7a',
    teacherName: 'Ibu Rahmawati, S.Pd.',
    topic: 'Reaksi Terang & Eksperimen Sach',
    strengthWeaknessType: 'kelemahan',
    reason: 'Akurasi pada topik Reaksi Terang dan Uji Amilum Sach masih di bawah 65%.',
    recommendationText: 'Pelajari kembali diagram reaksi fotolisis air dan cara kerja uji lugol/iodin pada daun yang ditutup aluminium foil.',
    suggestedAction: 'Buka modul pengayaan singkat Bab 1 sub-bab fotolisis dan ulangi latihan soal bagian Sachs.',
    createdAt: Date.now() - 3600000 * 12,
    status: 'baru'
  },
  {
    id: 'rec-2',
    studentId: 'student-2',
    studentName: 'Siti Nurhaliza',
    classId: 'class-ipa-7a',
    teacherName: 'Ibu Rahmawati, S.Pd.',
    topic: 'Olimpiade Sains Ekosistem',
    strengthWeaknessType: 'pengayaan',
    reason: 'Siti memiliki penguasaan materi di atas 95% pada semua bab ekosistem dan aliran trofik.',
    recommendationText: 'Sangat luar biasa! Disarankan mencoba materi lanjutan piramida biomassa terbalik dan studi kasus ekotoksikologi biomagnifikasi.',
    suggestedAction: 'Baca artikel pengayaan Biologi Lanjutan tentang Biomagnifikasi Merkuri.',
    createdAt: Date.now() - 3600000 * 20,
    status: 'dibaca'
  }
];
