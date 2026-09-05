export type VisualFieldType = 'boolean' | 'number' | 'tags' | 'text';

export interface VisualFieldRow {
  key: string;
  rowKey: number;
  type: VisualFieldType;
  value: boolean | number | string | string[];
}

let visualFieldSequence = 0;

export function createVisualField(
  key = '',
  value: VisualFieldRow['value'] = '',
  type: VisualFieldType = 'text',
): VisualFieldRow {
  return { key, rowKey: ++visualFieldSequence, type, value };
}

export function objectToVisualFields(
  value: null | Record<string, unknown> | undefined,
  excludedKeys: string[] = [],
): VisualFieldRow[] {
  if (!value) return [];
  const excluded = new Set(excludedKeys);
  return Object.entries(value)
    .filter(([key]) => !excluded.has(key))
    .map(([key, item]) => {
      if (typeof item === 'boolean')
        return createVisualField(key, item, 'boolean');
      if (typeof item === 'number')
        return createVisualField(key, item, 'number');
      if (Array.isArray(item)) {
        return createVisualField(key, item.map(String), 'tags');
      }
      return createVisualField(key, String(item ?? ''), 'text');
    });
}

export function visualFieldsToObject(rows: VisualFieldRow[]) {
  return Object.fromEntries(
    rows
      .filter((row) => row.key.trim())
      .map((row) => [row.key.trim(), row.value]),
  );
}
