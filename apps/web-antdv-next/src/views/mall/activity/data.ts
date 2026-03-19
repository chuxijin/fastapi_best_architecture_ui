import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { MallActivityResult } from '#/api';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'activity_name',
    label: '活动名称',
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: {
      allowClear: true,
      options: [
        { label: '草稿', value: 'draft' },
        { label: '进行中', value: 'active' },
        { label: '已暂停', value: 'paused' },
        { label: '已结束', value: 'ended' },
      ],
    },
  },
];

const activityStatusMap: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  active: { color: 'success', label: '进行中' },
  paused: { color: 'warning', label: '已暂停' },
  ended: { color: 'error', label: '已结束' },
};

export function useColumns(
  onActionClick?: OnActionClickFn<MallActivityResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'activity_name', title: '活动名称', minWidth: 180 },
    { field: 'product_id', title: '商品 ID', width: 90 },
    { field: 'min_people', title: '最少人数', width: 90 },
    { field: 'max_people', title: '最多人数', width: 90 },
    { field: 'time_limit', title: '时限(h)', width: 80 },
    { field: 'stock', title: '库存', width: 80 },
    { field: 'sales_count', title: '已售', width: 80 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: {
        name: 'CellTag',
        props: {
          colorMap: activityStatusMap,
        },
      },
    },
    { field: 'start_time', title: '开始时间', width: 168 },
    { field: 'end_time', title: '结束时间', width: 168 },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 150,
      cellRender: {
        attrs: {
          nameField: 'activity_name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
    },
  ];
}

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'activity_name',
    label: '活动名称',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'product_id',
    label: '商品 ID',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'sku_id',
    label: 'SKU ID',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'min_people',
    label: '最少成团人数',
    rules: 'required',
    defaultValue: 2,
    componentProps: { min: 2 },
  },
  {
    component: 'InputNumber',
    fieldName: 'max_people',
    label: '最多成团人数',
    rules: 'required',
    defaultValue: 10,
    componentProps: { min: 2 },
  },
  {
    component: 'InputNumber',
    fieldName: 'time_limit',
    label: '成团时限（小时）',
    rules: 'required',
    defaultValue: 24,
    componentProps: { min: 1 },
  },
  {
    component: 'InputNumber',
    fieldName: 'stock',
    label: '活动库存',
    defaultValue: 0,
    componentProps: { min: 0 },
  },
  {
    component: 'DatePicker',
    fieldName: 'start_time',
    label: '开始时间',
    rules: 'required',
    componentProps: {
      showTime: true,
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
    },
  },
  {
    component: 'DatePicker',
    fieldName: 'end_time',
    label: '结束时间',
    rules: 'required',
    componentProps: {
      showTime: true,
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
    },
  },
  {
    component: 'Switch',
    fieldName: 'enable_mock_team',
    label: '启用模拟成团',
    defaultValue: false,
  },
  {
    component: 'Textarea',
    fieldName: 'rules',
    label: '活动规则',
  },
];
