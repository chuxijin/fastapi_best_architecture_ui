import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

export const feishuConfigQuerySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '请输入配置名称' },
    fieldName: 'name',
    label: '配置名称',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '启用', value: true },
        { label: '停用', value: false },
      ],
      placeholder: '请选择状态',
    },
    fieldName: 'is_enabled',
    label: '状态',
  },
];

export function createFeishuConfigColumns(): VxeGridProps['columns'] {
  return [
    { field: 'id', title: 'ID', width: 70 },
    {
      field: 'name',
      title: '配置名称',
      minWidth: 130,
      slots: { default: 'name' },
    },
    {
      field: 'app_code',
      title: '分类来源',
      width: 130,
      formatter: ({ row }) => `${row.app_code} / ${row.category_type}`,
    },
    {
      field: 'cron',
      title: '定时',
      width: 140,
      formatter: ({ cellValue }) => cellValue || '仅手动',
    },
    {
      field: 'is_enabled',
      title: '状态',
      slots: { default: 'is_enabled' },
      width: 90,
    },
    {
      field: 'last_synced_at',
      title: '最近同步',
      width: 180,
      slots: { default: 'last_synced_at' },
    },
    {
      field: 'operation',
      title: '操作',
      fixed: 'right',
      slots: { default: 'operation' },
      width: 300,
    },
  ];
}

export function createFeishuTaskColumns(
  getConfigName: (configId: number) => string,
): VxeGridProps['columns'] {
  return [
    { field: 'id', title: '任务 ID', width: 90 },
    {
      field: 'config_id',
      title: '导出配置',
      minWidth: 150,
      formatter: ({ cellValue }) => getConfigName(cellValue),
    },
    {
      field: 'status',
      title: '状态',
      slots: { default: 'status' },
      width: 110,
    },
    {
      field: 'statistics',
      title: '执行统计',
      slots: { default: 'statistics' },
      minWidth: 260,
    },
    {
      field: 'error_message',
      title: '错误信息',
      minWidth: 200,
      slots: { default: 'error_message' },
    },
    { field: 'created_time', title: '创建时间', width: 180 },
  ];
}

/** 形如「其他=干货汇总」的多行文本 <-> 字典 */
export function textToSheetMap(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line
      .split(/[=,，:：]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (parts.length < 2) continue;
    const [resourceType, sheet] = parts;
    if (resourceType && sheet) result[resourceType] = sheet;
  }
  return result;
}

export function sheetMapToText(sheetMap: Record<string, string>): string {
  return Object.entries(sheetMap || {})
    .map(([resourceType, sheet]) => `${resourceType}=${sheet}`)
    .join('\n');
}

/** 形如「网络获取=5」的多行文本 <-> 字典 */
export function textToWeights(text: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line
      .split(/[=:：]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (parts.length < 2) continue;
    const weight = Number(parts[1]);
    if (Number.isFinite(weight)) result[parts[0]] = Math.trunc(weight);
  }
  return result;
}

export function weightsToText(weights: Record<string, number>): string {
  return Object.entries(weights || {})
    .map(([source, weight]) => `${source}=${weight}`)
    .join('\n');
}

/** 来源权重的一行：`items` 是下拉选项（资源类型、子表名），`weights` 决定抽取概率 */
export interface SourceWeightRow {
  /** 行内唯一 key，仅用于 v-for 与增删 */
  key: string;
  /** 来源名称 */
  source: string;
  /** 抽取权重，正整数 */
  weight: number;
}

let sourceWeightSeed = 0;

export function createSourceWeightRow(
  source = '',
  weight = 1,
): SourceWeightRow {
  sourceWeightSeed += 1;
  return { key: `sw-${Date.now()}-${sourceWeightSeed}`, source, weight };
}

/** 字典 -> 可视化行（用于表单回填） */
export function weightsToRows(
  weights: Record<string, number>,
): SourceWeightRow[] {
  const entries = Object.entries(weights || {});
  if (entries.length === 0) {
    return [
      createSourceWeightRow('网络获取', 5),
      createSourceWeightRow('用户推荐', 4),
      createSourceWeightRow('店铺购买', 1),
    ];
  }
  return entries.map(([source, weight]) =>
    createSourceWeightRow(source, weight),
  );
}

/** 可视化行 -> 字典（过滤空来源，重名以后者覆盖前者） */
export function rowsToWeights(rows: SourceWeightRow[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const source = (row.source || '').trim();
    if (!source) continue;
    const weight = Number(row.weight);
    result[source] = Number.isFinite(weight) ? Math.trunc(weight) : 0;
  }
  return result;
}

/** 表格可用列：来源下拉的可选项来自子表映射里的资源类型 */
export function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

/** 文本域 -> 字符串数组（每行一项） */
export function textToLines(text: string): string[] {
  return text
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function linesToText(lines: string[]): string {
  return (lines || []).join('\n');
}
