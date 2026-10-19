import { CrosswordClue, CrosswordGameConfig } from '../types';

export interface GridCell {
  row: number;
  col: number;
  char: string;
  number?: number;
  acrossClueId?: string;
  downClueId?: string;
}

export interface CrosswordGridData {
  rows: number;
  cols: number;
  grid: (GridCell | null)[][];
  clues: CrosswordClue[];
}

/**
 * Clean and uppercase an answer string (letters only)
 */
export function sanitizeWord(word: string): string {
  return (word || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .trim();
}

/**
 * Layout clues on a compact, intersecting 2D crossword grid.
 */
export function buildCrosswordGrid(
  acrossItems: { id?: string; clue: string; answer: string }[],
  downItems: { id?: string; clue: string; answer: string }[],
  totalPoints: number = 100
): CrosswordGameConfig {
  const cleanAcross = acrossItems
    .map(item => ({
      id: item.id || `across-${Math.random().toString(36).substring(2, 7)}`,
      clue: item.clue.trim(),
      answer: sanitizeWord(item.answer)
    }))
    .filter(item => item.answer.length >= 2);

  const cleanDown = downItems
    .map(item => ({
      id: item.id || `down-${Math.random().toString(36).substring(2, 7)}`,
      clue: item.clue.trim(),
      answer: sanitizeWord(item.answer)
    }))
    .filter(item => item.answer.length >= 2);

  // If no words provided, return empty
  if (cleanAcross.length === 0 && cleanDown.length === 0) {
    return {
      acrossCount: 0,
      downCount: 0,
      totalPoints,
      clues: []
    };
  }

  // Attempt smart placement:
  // Step 1: Place first across word at (2, 0)
  const placedClues: CrosswordClue[] = [];
  const gridMap = new Map<string, string>(); // "r,c" -> CHAR

  const isCellAvailable = (r: number, c: number, expectedChar: string) => {
    const key = `${r},${c}`;
    if (!gridMap.has(key)) return true;
    return gridMap.get(key) === expectedChar;
  };

  // 1. Place Across words with spacing
  let curRow = 2;
  cleanAcross.forEach((ac, idx) => {
    const col = idx % 2 === 0 ? 0 : 2;
    const row = curRow;
    for (let c = 0; c < ac.answer.length; c++) {
      gridMap.set(`${row},${col + c}`, ac.answer[c]);
    }
    placedClues.push({
      id: ac.id,
      number: 0, // will assign sequentially
      direction: 'across',
      clue: ac.clue,
      answer: ac.answer,
      row,
      col
    });
    curRow += 3;
  });

  // 2. Place Down words intersecting across words if possible
  cleanDown.forEach((dn, dIdx) => {
    let placed = false;

    // Try to find intersection with already placed across words
    for (const ac of placedClues.filter(c => c.direction === 'across')) {
      for (let acI = 0; acI < ac.answer.length; acI++) {
        const charAc = ac.answer[acI];
        for (let dnI = 0; dnI < dn.answer.length; dnI++) {
          if (dn.answer[dnI] === charAc) {
            const candidateCol = ac.col + acI;
            const candidateRow = ac.row - dnI;

            // Check if placing dn here is valid
            let valid = true;
            for (let k = 0; k < dn.answer.length; k++) {
              const r = candidateRow + k;
              const c = candidateCol;
              if (!isCellAvailable(r, c, dn.answer[k])) {
                valid = false;
                break;
              }
            }

            if (valid) {
              // Commit
              for (let k = 0; k < dn.answer.length; k++) {
                gridMap.set(`${candidateRow + k},${candidateCol}`, dn.answer[k]);
              }
              placedClues.push({
                id: dn.id,
                number: 0,
                direction: 'down',
                clue: dn.clue,
                answer: dn.answer,
                row: candidateRow,
                col: candidateCol
              });
              placed = true;
              break;
            }
          }
        }
        if (placed) break;
      }
      if (placed) break;
    }

    // If not placed by intersection, place as vertical column adjacent to layout
    if (!placed) {
      const fallbackCol = 1 + dIdx * 3;
      const fallbackRow = 0;
      for (let k = 0; k < dn.answer.length; k++) {
        gridMap.set(`${fallbackRow + k},${fallbackCol}`, dn.answer[k]);
      }
      placedClues.push({
        id: dn.id,
        number: 0,
        direction: 'down',
        clue: dn.clue,
        answer: dn.answer,
        row: fallbackRow,
        col: fallbackCol
      });
    }
  });

  // Normalize grid to start at (0, 0)
  let minRow = 0;
  let minCol = 0;
  placedClues.forEach(clue => {
    if (clue.row < minRow) minRow = clue.row;
    if (clue.col < minCol) minCol = clue.col;
  });

  const rowOffset = -minRow;
  const colOffset = -minCol;

  placedClues.forEach(clue => {
    clue.row += rowOffset;
    clue.col += colOffset;
  });

  // Assign numbers (top-to-bottom, left-to-right starting positions)
  // Group by (row, col)
  const posMap = new Map<string, number>();
  let clueNum = 1;

  // Sort clues by row, then col
  const sortedClues = [...placedClues].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  sortedClues.forEach(clue => {
    const key = `${clue.row},${clue.col}`;
    if (!posMap.has(key)) {
      posMap.set(key, clueNum++);
    }
    clue.number = posMap.get(key)!;
  });

  return {
    acrossCount: cleanAcross.length,
    downCount: cleanDown.length,
    totalPoints,
    clues: sortedClues
  };
}

/**
 * Generate full 2D grid matrix with cell annotations for gameplay / preview
 */
export function getCrosswordGridMatrix(clues: CrosswordClue[]): CrosswordGridData {
  if (!clues || clues.length === 0) {
    return { rows: 0, cols: 0, grid: [], clues: [] };
  }

  let maxRow = 0;
  let maxCol = 0;

  clues.forEach(clue => {
    const len = clue.answer.length;
    if (clue.direction === 'across') {
      maxRow = Math.max(maxRow, clue.row);
      maxCol = Math.max(maxCol, clue.col + len - 1);
    } else {
      maxRow = Math.max(maxRow, clue.row + len - 1);
      maxCol = Math.max(maxCol, clue.col);
    }
  });

  const rows = maxRow + 1;
  const cols = maxCol + 1;
  const grid: (GridCell | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  // Populate cells
  clues.forEach(clue => {
    const isAcross = clue.direction === 'across';
    for (let i = 0; i < clue.answer.length; i++) {
      const r = isAcross ? clue.row : clue.row + i;
      const c = isAcross ? clue.col + i : clue.col;
      const char = clue.answer[i];

      if (!grid[r][c]) {
        grid[r][c] = {
          row: r,
          col: c,
          char,
          number: i === 0 ? clue.number : undefined,
          acrossClueId: isAcross ? clue.id : undefined,
          downClueId: !isAcross ? clue.id : undefined
        };
      } else {
        const existing = grid[r][c]!;
        if (i === 0 && !existing.number) {
          existing.number = clue.number;
        }
        if (isAcross) existing.acrossClueId = clue.id;
        else existing.downClueId = clue.id;
      }
    }
  });

  return { rows, cols, grid, clues };
}
