import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

export const pageStatusMap: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '停用' },
  1: { color: 'success', label: '启用' },
};

const statusOptions = [
  { label: '停用', value: 0 },
  { label: '启用', value: 1 },
];

export function useColumns(): VxeGridProps['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'title', minWidth: 180, title: '标题' },
    { field: 'code', title: '访问标识', width: 140 },
    {
      cellRender: { name: 'CellTag', props: { colorMap: pageStatusMap } },
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
    componentProps: { placeholder: '页面标题' },
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
    componentProps: { maxLength: 255 },
    fieldName: 'title',
    label: '页面标题',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      maxLength: 64,
      placeholder: '留空自动生成，仅支持字母和数字',
    },
    fieldName: 'code',
    label: '访问标识',
    help: '访问地址为 /p/{标识}，创建后不可修改',
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
    componentProps: { maxLength: 255, placeholder: '内部备注，不对外展示' },
    fieldName: 'remark',
    label: '备注',
  },
];
