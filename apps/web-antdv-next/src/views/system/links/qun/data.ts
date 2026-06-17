import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

export const qunStatusMap: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '停用' },
  1: { color: 'success', label: '启用' },
};

export const qunItemStatusMap: Record<
  number,
  { color: string; label: string }
> = {
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

const kfStatusOptions = [
  { label: '不显示', value: 0 },
  { label: '显示', value: 1 },
];

export function useColumns(): VxeGridProps['columns'] {
  return [
    { field: 'seq', title: $t('common.table.id'), type: 'seq', width: 50 },
    { field: 'title', title: '标题', minWidth: 180 },
    { field: 'code', title: '活码', width: 120 },
    {
      cellRender: { name: 'CellTag', props: { colorMap: qunStatusMap } },
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
    { field: 'leader', title: '群主', width: 100 },
    { field: 'limit', title: '阈值', width: 70 },
    { field: 'clicks', title: '扫码', width: 70 },
    { field: 'longpress', title: '长按', width: 70 },
    {
      cellRender: { name: 'CellTag', props: { colorMap: qunItemStatusMap } },
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
    label: '活码',
    help: '访问地址为 /q/{活码}，创建后不可修改',
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
    component: 'InputNumber',
    componentProps: { min: 1, placeholder: '可选: 群满时跳客服码 ID' },
    fieldName: 'kf',
    label: '关联客服 ID',
  },
  {
    component: 'Select',
    componentProps: { options: kfStatusOptions },
    defaultValue: 0,
    fieldName: 'kf_status',
    label: '客服显示',
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
    label: '二维码图片 URL',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { maxLength: 64 },
    fieldName: 'leader',
    label: '群主',
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
