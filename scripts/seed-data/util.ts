export function mustRow<T>(row: T | undefined, label: string): T {
  if (!row) throw new Error(`seed.missing_row:${label}`);
  return row;
}
