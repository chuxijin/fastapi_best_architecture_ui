import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

export const domainTypeMap: Record<number, { color: string; label: string }> = {
  1: { color: 'blue', label: '入口域名' },
  2: { color: 'orange', label: '中转域名' },
  3: { color: 'green', label: '落地域名' },
};

const domainTypeOptions = [
  { label: '入口域名', value: 1 },
  { label: '中转域名', value: 2 },
  { label: '落地域名', value: 3 },
];

export function useColumns(): VxeGridProps['columns'] {
  return [
    { field: 'seq', title: $t('common.table.id'), type: 'seq', width: 50 },
    { field: 'domain', title: '域名', minWidth: 200 },
    {
      cellRender: { name: 'CellTag', props: { colorMap: domainTypeMap } },
      field: 'domain_type',
      title: '类型',
      width: 110,
    },
    { field: 'remark', title: '备注', minWidth: 160 },
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
      width: 160,
    },
  ];
}

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '域名关键字' },
    fieldName: 'domain',
    label: '域名',
  },
  {
    component: 'Select',
    componentProps: { allowClear: true, options: domainTypeOptions },
    fieldName: 'domain_type',
    label: '类型',
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { maxLength: 128, placeholder: '示例: p.example.com' },
    fieldName: 'domain',
    label: '域名',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: { options: domainTypeOptions },
    fieldName: 'domain_type',
    label: '类型',
    rules: 'selectRequired',
  },
  {
    component: 'Input',
    componentProps: { maxLength: 256 },
    fieldName: 'remark',
    label: '备注',
  },
];
