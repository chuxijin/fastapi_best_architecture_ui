import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

export const dwzStatusMap: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '停用' },
  1: { color: 'success', label: '启用' },
};

const statusOptions = [
  { label: '停用', value: 0 },
  { label: '启用', value: 1 },
];

export function useColumns(): VxeGridProps['columns'] {
  return [
    { field: 'seq', title: $t('common.table.id'), type: 'seq', width: 50 },
    { field: 'title', title: '标题', minWidth: 160 },
    { field: 'code', title: '短码', width: 120 },
    {
      field: 'original_url',
      title: '原网址',
      minWidth: 220,
      showOverflow: true,
    },
    {
      cellRender: { name: 'CellTag', props: { colorMap: dwzStatusMap } },
      field: 'status',
      title: '状态',
      width: 80,
    },
    { field: 'clicks', title: '访问量', width: 90 },
    {
      field: 'visit',
      slots: { default: 'visit_default' },
      title: '访问链接',
      width: 200,
    },
    {
      field: 'created_time',
      title: $t('common.table.created_time'),
      width: 168,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'operation_default' },
      title: $t('common.table.operation'),
      width: 200,
    },
  ];
}

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '标题关键词' },
    fieldName: 'title',
    label: '标题',
  },
  {
    component: 'Select',
    componentProps: { allowClear: true, options: statusOptions },
    fieldName: 'status',
    label: '状态',
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { maxLength: 2048, placeholder: 'https://...' },
    fieldName: 'original_url',
    label: '原网址',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { maxLength: 128 },
    fieldName: 'title',
    label: '标题',
  },
  {
    component: 'Input',
    componentProps: {
      maxLength: 16,
      placeholder: '留空自动生成 6 位短码',
    },
    fieldName: 'code',
    label: '短码',
    help: '访问地址为 /c/{短码}，创建后不可修改',
  },
  {
    component: 'Select',
    componentProps: { options: statusOptions },
    defaultValue: 1,
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'Input',
    componentProps: { maxLength: 128, placeholder: '可选' },
    fieldName: 'entry_domain',
    label: '入口域名',
  },
  {
    component: 'Input',
    componentProps: { maxLength: 128, placeholder: '可选' },
    fieldName: 'redirect_domain',
    label: '中转域名',
  },
  {
    component: 'Input',
    componentProps: { maxLength: 128, placeholder: '可选' },
    fieldName: 'landing_domain',
    label: '落地域名',
  },
  {
    component: 'Input',
    componentProps: { maxLength: 256 },
    fieldName: 'remark',
    label: '备注',
  },
];
