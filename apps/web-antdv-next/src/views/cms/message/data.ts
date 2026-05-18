import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

export const messageStatusMap: Record<
  number,
  { color: string; label: string }
> = {
  0: { color: 'default', label: '禁用' },
  1: { color: 'success', label: '启用' },
};

export const messageTypeMap: Record<string, { color: string; label: string }> =
  {
    maintenance: { color: 'warning', label: '维护' },
    personal: { color: 'blue', label: '个人' },
    system: { color: 'purple', label: '系统' },
    update: { color: 'green', label: '上新' },
  };

export const targetTypeMap: Record<string, { color: string; label: string }> = {
  all: { color: 'cyan', label: '全站' },
  user: { color: 'blue', label: '个人' },
};

const messageTypeOptions = [
  { label: '系统通知', value: 'system' },
  { label: '上新通知', value: 'update' },
  { label: '维护通知', value: 'maintenance' },
  { label: '个人消息', value: 'personal' },
];

const targetTypeOptions = [
  { label: '全站广播', value: 'all' },
  { label: '指定用户', value: 'user' },
];

const statusOptions = [
  { label: '禁用', value: 0 },
  { label: '启用', value: 1 },
];

export function useColumns(): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'title', minWidth: 200, title: '标题' },
    {
      cellRender: { name: 'CellTag', props: { colorMap: messageTypeMap } },
      field: 'message_type',
      title: '类型',
      width: 90,
    },
    {
      cellRender: { name: 'CellTag', props: { colorMap: targetTypeMap } },
      field: 'target_type',
      title: '目标',
      width: 80,
    },
    { field: 'user_id', title: '用户 ID', width: 100 },
    {
      cellRender: { name: 'CellTag', props: { colorMap: messageStatusMap } },
      field: 'status',
      title: '状态',
      width: 80,
    },
    { field: 'publish_time', title: '发布时间', width: 168 },
    { field: 'expire_time', title: '过期时间', width: 168 },
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
    componentProps: { placeholder: '消息标题' },
    fieldName: 'title',
    label: '标题',
  },
  {
    component: 'Select',
    componentProps: { allowClear: true, options: messageTypeOptions },
    fieldName: 'message_type',
    label: '类型',
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
    component: 'Select',
    componentProps: { options: messageTypeOptions },
    defaultValue: 'system',
    fieldName: 'message_type',
    label: '消息类型',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: { options: targetTypeOptions },
    defaultValue: 'all',
    fieldName: 'target_type',
    label: '目标类型',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 1, placeholder: '仅目标类型为"指定用户"时填写' },
    fieldName: 'user_id',
    label: '用户 ID',
    dependencies: {
      if(values: Record<string, any>) {
        return values.target_type === 'user';
      },
      triggerFields: ['target_type'],
    },
  },
  {
    component: 'Input',
    componentProps: { maxLength: 500, placeholder: '小程序页面路径，可选' },
    fieldName: 'link_url',
    label: '跳转链接',
  },
  {
    component: 'Select',
    componentProps: { options: statusOptions },
    defaultValue: 1,
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'DatePicker',
    componentProps: { showTime: true, valueFormat: 'YYYY-MM-DD HH:mm:ss' },
    fieldName: 'publish_time',
    label: '发布时间',
  },
  {
    component: 'DatePicker',
    componentProps: { showTime: true, valueFormat: 'YYYY-MM-DD HH:mm:ss' },
    fieldName: 'expire_time',
    label: '过期时间',
  },
];
