import * as XLSX from 'xlsx';

export interface ParsedStudentRow {
  name: string;
  nis: string; // NISN
  gender: 'Laki-laki' | 'Perempuan';
  password: string;
  isValid: boolean;
  error?: string;
}

/**
 * Unduh template resmi Excel (.xlsx) untuk upload data siswa satu kelas.
 */
export function downloadStudentTemplateExcel(className: string = 'Kelas') {
  const sampleData = [
    {
      'No': 1,
      'Nama Siswa': 'Ahmad Fauzan Pratama',
      'NISN': '0081234501',
      'Jenis Kelamin': 'Laki-laki',
      'Password': '123'
    },
    {
      'No': 2,
      'Nama Siswa': 'Siti Nurhaliza Zahra',
      'NISN': '0081234502',
      'Jenis Kelamin': 'Perempuan',
      'Password': '123'
    },
    {
      'No': 3,
      'Nama Siswa': 'Budi Santoso Wibowo',
      'NISN': '0081234503',
      'Jenis Kelamin': 'Laki-laki',
      'Password': '123'
    },
    {
      'No': 4,
      'Nama Siswa': 'Dewi Lestari Anggraeni',
      'NISN': '0081234504',
      'Jenis Kelamin': 'Perempuan',
      'Password': '123'
    },
    {
      'No': 5,
      'Nama Siswa': 'Muhammad Rizky Ramadhan',
      'NISN': '0081234505',
      'Jenis Kelamin': 'Laki-laki',
      'Password': '123'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 32 }, // Nama Siswa
    { wch: 18 }, // NISN
    { wch: 18 }, // Jenis Kelamin
    { wch: 14 }, // Password
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

  const safeClassName = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `Template_Data_Siswa_${safeClassName}.xlsx`);
}

/**
 * Membaca dan mem-parsing file Excel (.xlsx, .xls) atau .csv yang diunggah oleh guru.
 */
export async function parseStudentsFromExcel(file: File): Promise<ParsedStudentRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel kosong atau tidak memiliki lembar kerja (sheet).');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Tidak ditemukan data siswa dalam berkas Excel ini.');
  }

  const result: ParsedStudentRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    // Find name from column variations
    const nameVal = row['Nama Siswa'] || row['Nama'] || row['Nama Lengkap'] || row['nama'] || row['name'] || '';
    const cleanName = String(nameVal).trim();

    // Find NISN from column variations
    const nisnVal = row['NISN'] || row['NIS'] || row['nisn'] || row['nis'] || row['Nomor Induk'] || row['No Induk'] || '';
    const cleanNisn = String(nisnVal).replace(/[^0-9]/g, '').trim() || String(nisnVal).trim();

    // Find Gender
    const jkVal = String(
      row['Jenis Kelamin'] || row['Jenis_Kelamin'] || row['Gender'] || row['JK'] || row['L/P'] || row['jk'] || ''
    ).trim().toLowerCase();

    let gender: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
    if (
      jkVal.startsWith('p') || 
      jkVal.includes('perempuan') || 
      jkVal === 'w' || 
      jkVal.includes('wanita') || 
      jkVal === 'f'
    ) {
      gender = 'Perempuan';
    } else {
      gender = 'Laki-laki';
    }

    // Password
    const passVal = row['Password'] || row['Sandi'] || row['Kata Sandi'] || row['password'] || '123';
    const cleanPassword = String(passVal).trim() || '123';

    // Validation
    let isValid = true;
    let error: string | undefined;

    if (!cleanName) {
      isValid = false;
      error = 'Nama siswa tidak boleh kosong';
    } else if (!cleanNisn) {
      isValid = false;
      error = 'NISN tidak boleh kosong';
    }

    if (cleanName || cleanNisn) {
      result.push({
        name: cleanName || 'Siswa Tanpa Nama',
        nis: cleanNisn || `008${Date.now().toString().slice(-7)}`,
        gender,
        password: cleanPassword,
        isValid,
        error,
      });
    }
  }

  return result;
}
