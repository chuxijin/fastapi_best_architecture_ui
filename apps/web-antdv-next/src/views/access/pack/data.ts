import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '搜索 code / name' },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: 'basic 基础', value: 'basic' },
        { label: 'standard 标准', value: 'standard' },
        { label: 'premium 高级 (VIP)', value: 'premium' },
        { label: 'elite 至尊 (SVIP)', value: 'elite' },
      ],
      placeholder: '档级',
    },
    fieldName: 'grade',
    label: '档级',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '生效', value: 'active' },
        { label: '停用', value: 'inactive' },
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
    componentProps: { placeholder: '如 all_svip / kaoyan_vip' },
    fieldName: 'code',
    label: 'Pack 编码',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '如 全家桶 SVIP' },
    fieldName: 'name',
    label: '名称',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: 'basic 基础', value: 'basic' },
        { label: 'standard 标准', value: 'standard' },
        { label: 'premium 高级 (VIP)', value: 'premium' },
        { label: 'elite 至尊 (SVIP)', value: 'elite' },
      ],
      popupMatchSelectWidth: 220,
      styles: { popup: { root: { minWidth: '220px' } } },
      style: { width: '100%' },
    },
    fieldName: 'grade',
    label: '档级',
    rules: 'required',
  },
  {
    component: 'Textarea',
    componentProps: { rows: 3 },
    fieldName: 'description',
    label: '描述',
  },
];

const GRADE_COLOR: Record<string, string> = {
  basic: 'default',
  standard: 'blue',
  premium: 'purple',
  elite: 'gold',
};

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { type: 'checkbox', width: 60 },
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: 'Pack 编码', minWidth: 150 },
    { field: 'name', title: '名称', minWidth: 140 },
    {
      field: 'grade',
      title: '档级',
      width: 100,
      slots: {
        default: ({ row }: any) =>
          h(
            Tag,
            { color: GRADE_COLOR[row.grade] || 'default' },
            () => row.grade,
          ),
      },
    },
    {
      field: 'entitlement_codes',
      title: '权益数',
      width: 100,
      formatter: ({ row }: any) =>
        `${(row.items || row.entitlement_codes || []).length} 项`,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: row.status === 'active' ? 'green' : 'default' }, () =>
            row.status === 'active' ? '生效' : '停用',
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
      width: 140,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => [
          h(
            'a',
            { onClick: () => onActionClick({ code: 'edit', row }) },
            '编辑',
          ),
          h(
            'a',
            {
              style: { marginLeft: '8px', color: '#ff4d4f' },
              onClick: () => onActionClick({ code: 'delete', row }),
            },
            '删除',
          ),
        ],
      },
    },
  ];
}
