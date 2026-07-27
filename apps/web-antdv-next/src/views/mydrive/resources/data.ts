import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { getSysCategoryTreeApi } from '#/api/category';

export const RESOURCE_TYPE_OPTIONS = [
  { label: '课程', value: '课程' },
  { label: '电子书', value: '电子书' },
  { label: '笔记', value: '笔记' },
  { label: '软件', value: '软件' },
  { label: '真题', value: '真题' },
  { label: '其他', value: '其他' },
];

export const resourceQuerySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '搜索标题、介绍、文件名' },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: RESOURCE_TYPE_OPTIONS,
      placeholder: '请选择资源类型',
    },
    fieldName: 'resource_type',
    label: '资源类型',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '百度', value: 'baidu' },
        { label: '夸克', value: 'quark' },
        { label: '迅雷', value: 'thunder' },
      ],
      placeholder: '请选择网盘',
    },
    fieldName: 'provider',
    label: '网盘',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '启用', value: 'enabled' },
        { label: '停用', value: 'disabled' },
      ],
      placeholder: '请选择状态',
    },
    fieldName: 'status',
    label: '状态',
  },
];

export function createResourceColumns(): VxeGridProps['columns'] {
  return [
    { field: 'id', title: 'ID', width: 80 },
    {
      field: 'title',
      title: '资源标题',
      minWidth: 180,
      showOverflow: 'tooltip',
    },
    { field: 'resource_type', title: '类型', width: 110 },
    {
      field: 'org_name',
      title: '机构/老师',
      minWidth: 120,
      showOverflow: 'tooltip',
    },
    {
      field: 'share.provider',
      title: '网盘',
      width: 90,
      formatter: ({ row }) => row.share?.provider || '-',
    },
    {
      field: 'share.share_status',
      title: '分享状态',
      width: 110,
      formatter: ({ row }) => row.share?.share_status || 'unknown',
    },
    { field: 'view_count', title: '浏览', width: 80 },
    { field: 'search_count', title: '搜索', width: 80 },
    { field: 'hot', title: '热度', width: 80 },
    {
      field: 'temp_policy',
      title: '策略',
      width: 130,
      formatter: ({ row }) => getTempPolicyLabel(row.temp_policy),
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '启用', value: 'enabled' },
          { color: 'red', label: '停用', value: 'disabled' },
        ],
      },
    },
    {
      field: 'share.share_expired_at',
      title: '分享过期',
      width: 180,
      formatter: ({ row }) => row.share?.share_expired_at || '长期有效',
    },
    { field: 'created_time', title: '创建时间', width: 180 },
    {
      field: 'operation',
      title: '操作',
      fixed: 'right',
      slots: { default: 'operation' },
      width: 500,
    },
  ];
}

export async function getCategoryTreeOptions(): Promise<any[]> {
  try {
    const response = await getSysCategoryTreeApi({
      app_code: 'youanshang',
      status: true,
      type: 'resource_exam',
    });
    const categories = Array.isArray(response)
      ? response
      : (response as any)?.data || [];
    return buildCategoryTree(categories);
  } catch {
    return [];
  }
}

function buildCategoryTree(nodes: any[]): any[] {
  return (nodes || []).map((node) => ({
    ...node,
    label: node.name,
    value: node.id,
    children:
      Array.isArray(node.children) && node.children.length > 0
        ? buildCategoryTree(node.children)
        : undefined,
  }));
}

function getTempPolicyLabel(value: number): string {
  const labels: Record<number, string> = {
    0: '无操作',
    1: '定时删除',
    2: '到期前刷新 7 天',
    3: '定时更新',
  };
  return labels[value] || '无操作';
}
