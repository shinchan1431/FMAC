export interface RawTick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseTimestamp(ts: string): number | null {
  // Try multiple formats
  // 1. Unix epoch (seconds or ms)
  const asNum = Number(ts);
  if (!isNaN(asNum) && ts.trim().match(/^\d+$/)) {
    return asNum > 1e12 ? asNum : asNum * 1000;
  }
  // 2. ISO string or similar date format
  const parsed = Date.parse(ts);
  if (!isNaN(parsed)) return parsed;
  return null;
}

export function parseCSV(text: string): RawTick[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV file appears to be empty or has no data rows');

  const headerFields = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const colMap: Record<string, number> = {};
  headerFields.forEach((h, i) => { colMap[h] = i; });

  // Detect column names
  const tsCol = colMap['timestamp'] ?? colMap['time'] ?? colMap['datetime'] ?? colMap['date'] ?? colMap['gmt'] ?? 0;
  const openCol = colMap['open'] ?? colMap['o'] ?? 1;
  const highCol = colMap['high'] ?? colMap['h'] ?? 2;
  const lowCol = colMap['low'] ?? colMap['l'] ?? 3;
  const closeCol = colMap['close'] ?? colMap['c'] ?? colMap['last'] ?? 4;
  const volCol = colMap['volume'] ?? colMap['vol'] ?? colMap['v'] ?? -1;

  const ticks: RawTick[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    if (fields.length < 5) continue;

    const ts = parseTimestamp(fields[tsCol]);
    if (ts === null) continue;

    const open = parseFloat(fields[openCol]);
    const high = parseFloat(fields[highCol]);
    const low = parseFloat(fields[lowCol]);
    const close = parseFloat(fields[closeCol]);
    const volume = volCol >= 0 ? parseFloat(fields[volCol]) || 0 : 0;

    if ([open, high, low, close].some((v) => isNaN(v) || v <= 0)) continue;

    ticks.push({ timestamp: ts, open, high, low, close, volume });
  }

  if (ticks.length === 0) throw new Error('No valid data rows found in CSV');
  return ticks;
}
