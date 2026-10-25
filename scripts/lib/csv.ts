/**
 * Minimal CSV reader: quoted fields, embedded commas, doubled quotes, CRLF.
 *
 * Lives here because two scripts now read the same Hill Interiors dropship
 * export for different columns — `sync-hill-stock.ts` for `Available Stock`
 * and `Status`, `fix-hill-interiors-carriage.ts` for `Delivery Size` and
 * `Weight` — and a second copy of a parser is a second set of edge cases to
 * get wrong.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * Reads a header row into a lookup, so a column is addressed by its name
 * rather than a position that shifts when the supplier adds a column.
 */
export function columnReader(
  header: string[],
): (row: string[], name: string) => string {
  const index = new Map(header.map((h, i) => [h.trim(), i]));
  return (row, name) => {
    const i = index.get(name);
    return i === undefined ? "" : (row[i] ?? "");
  };
}
