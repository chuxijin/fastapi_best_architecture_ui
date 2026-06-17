import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

export const kfStatusMap: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '停用' },
  1: { color: 'success', label: '启用' },
};

export const kfItemStatusMap: Record<number, { color: string; label: string }> =
  {
    0: { color: 'default', label: '停用' },
    1: { color: 'success', label: '启用' },
    2: { color: 'warning', label: '已满' },
  };

const statusOptions = [
  { label: '停用', value: 0 },
  { label: '启用', value: 1 },
];

const itemStatusOptions = [
  { label: '停用', value: 0 },
  { label: '启用', value: 1 },
  { label: '已满', value: 2 },
];

export function useColumns(): VxeGridProps['columns'] {
  return [
    { field: 'seq', title: $t('common.table.id'), type: 'seq', width: 50 },
    { field: 'title', title: '标题', minWidth: 180 },
    { field: 'code', title: '客服码', width: 120 },
    {
      cellRender: { name: 'CellTag', props: { colorMap: kfStatusMap } },
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
      width: 220,
    },
  ];
}

export function useItemColumns(): VxeGridProps['columns'] {
  return [
    { field: 'seq', title: '#', type: 'seq', width: 40 },
    {
      field: 'qrcode',
      title: '二维码 URL',
      minWidth: 200,
      showOverflow: true,
    },
    { field: 'leader', title: '客服', width: 100 },
    { field: 'limit', title: '阈值', width: 70 },
    { field: 'clicks', title: '扫码', width: 70 },
    { field: 'longpress', title: '长按', width: 70 },
    {
      cellRender: { name: 'CellTag', props: { colorMap: kfItemStatusMap } },
      field: 'status',
      title: '状态',
      width: 80,
    },
    {
      align: 'center',
      field: 'item_op',
      fixed: 'right',
      slots: { default: 'item_op_default' },
      title: '操作',
      width: 140,
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
    componentProps: { maxLength: 128 },
    fieldName: 'title',
    label: '标题',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      maxLength: 16,
      placeholder: '留空自动生成 6 位短码',
    },
    fieldName: 'code',
    label: '客服码',
    help: '访问地址为 /k/{客服码}，创建后不可修改',
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
    component: 'Textarea',
    componentProps: {
      maxLength: 1024,
      rows: 4,
      placeholder: '在线规则 JSON 字符串(可选)',
    },
    fieldName: 'online',
    label: '在线规则',
    help: '保留字段，按需填写在线状态规则的 JSON 字符串',
  },
  {
    component: 'Input',
    componentProps: { maxLength: 256 },
    fieldName: 'remark',
    label: '备注',
  },
];

export const itemSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { maxLength: 512, placeholder: 'https://...' },
    fieldName: 'qrcode',
    label: '客服二维码 URL',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { maxLength: 64 },
    fieldName: 'leader',
    label: '客服名称',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 1 },
    defaultValue: 200,
    fieldName: 'limit',
    label: '扫码阈值',
  },
  {
    component: 'Select',
    componentProps: { options: itemStatusOptions },
    defaultValue: 1,
    fieldName: 'status',
    label: '状态',
  },
];
