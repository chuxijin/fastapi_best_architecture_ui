import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '批次编号' },
    fieldName: 'batch_no',
    label: '批次编号',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '应用 ID' },
    fieldName: 'app_id',
    label: '应用 ID',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '启用', value: 1 },
        { label: '停用', value: 0 },
      ],
      placeholder: '状态',
    },
    fieldName: 'status',
    label: '状态',
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '如 fba-mini' },
    defaultValue: 'fba-mini',
    fieldName: 'app_id',
    label: '应用 ID',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '如 小红书公考年度会员订单批次' },
    fieldName: 'name',
    label: '批次名称',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      optionFilterProp: 'label',
      placeholder: '选择订阅模板',
      popupMatchSelectWidth: 520,
      showSearch: true,
    },
    fieldName: 'template_code',
    label: '订阅模板',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 0,
      max: 1_000_000,
      placeholder: '0 表示不限，不预生成激活码',
      style: { width: '100%' },
    },
    defaultValue: 0,
    fieldName: 'total_count',
    label: '订单容量',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 1,
      max: 100,
      style: { width: '100%' },
    },
    defaultValue: 1,
    fieldName: 'max_use_per_code',
    label: '单码最大使用次数',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '启用', value: 1 },
        { label: '停用', value: 0 },
      ],
    },
    defaultValue: 1,
    fieldName: 'status',
    label: '状态',
  },
];

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { type: 'checkbox', width: 60 },
    { field: 'id', title: 'ID', width: 80 },
    { field: 'batch_no', title: '批次编号', minWidth: 220 },
    { field: 'name', title: '批次名称', minWidth: 220 },
    { field: 'template_code', title: '订阅模板', minWidth: 180 },
    { field: 'app_id', title: '应用 ID', width: 120 },
    { field: 'total_count', title: '订单容量', width: 100 },
    { field: 'used_count', title: '已写入', width: 90 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: row.status === 1 ? 'green' : 'default' }, () =>
            row.status === 1 ? '启用' : '停用',
          ),
      },
    },
    {
      field: 'created_time',
      title: '创建时间',
      width: 170,
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString() : '-',
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: {
        default: ({ row }: any) =>
          h(
            'a',
            { onClick: () => onActionClick({ code: 'edit', row }) },
            '编辑',
          ),
      },
    },
  ];
}
