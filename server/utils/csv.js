import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

export function toCSV(records, header = true) {
  return stringify(records, { header });
}

export function fromCSV(csvText) {
  return parse(csvText, { columns: true, skip_empty_lines: true });
}

