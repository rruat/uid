// Helpers for editing CSS Grid visually: turning `grid-template-areas` into
// an editable matrix of named cells, and back into the quoted-string CSS
// value the browser (and the exported stylesheet) actually understands.

const EMPTY_CELL = ".";

export function parseAreas(value: string | undefined): string[][] {
  if (!value) return [["."]];
  const rows = [...value.matchAll(/"([^"]*)"/g)].map((m) => m[1].trim().split(/\s+/).filter(Boolean));
  return rows.length > 0 ? rows : [["."]];
}

export function serializeAreas(matrix: string[][]): string {
  return matrix
    .map((row) => `"${row.map((cell) => cell.trim() || EMPTY_CELL).join(" ")}"`)
    .join(" ");
}

export function resizeMatrix(matrix: string[][], rows: number, cols: number): string[][] {
  const next: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const existingRow = matrix[r] ?? [];
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(existingRow[c] ?? EMPTY_CELL);
    }
    next.push(row);
  }
  return next;
}

export function countTracks(value: string | undefined, fallback: number): number {
  const v = (value ?? "").trim();
  if (!v) return fallback;
  const repeatMatch = v.match(/^repeat\(\s*(\d+)\s*,/);
  if (repeatMatch) return parseInt(repeatMatch[1], 10);
  const tokens = v.match(/[^\s]+\([^)]*\)|[^\s]+/g);
  return tokens ? tokens.length : fallback;
}

export function buildTracksValue(count: number): string {
  return `repeat(${Math.max(1, count)}, 1fr)`;
}

export function collectAreaNames(matrix: string[][]): string[] {
  const names = new Set<string>();
  for (const row of matrix) {
    for (const cell of row) {
      if (cell && cell !== EMPTY_CELL) names.add(cell);
    }
  }
  return [...names];
}

/** First unused "item-N" name, so a newly added grid child is never nameless. */
export function nextAutoAreaName(existingNames: Iterable<string>): string {
  const used = new Set(existingNames);
  let n = 1;
  while (used.has(`item-${n}`)) n++;
  return `item-${n}`;
}
