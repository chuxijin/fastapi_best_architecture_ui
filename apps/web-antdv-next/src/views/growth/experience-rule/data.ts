import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

const FAMILY_OPTIONS = [
  { label: 'FREE 免费', value: 'FREE' },
  { label: 'VIP', value: 'VIP' },
  { label: 'SVIP', value: 'SVIP' },
];

const CYCLE_OPTIONS = [
  { label: 'lifetime 终身', value: 'lifetime' },
  { label: 'day 日', value: 'day' },
  { label: 'week 周', value: 'week' },
  { label: 'month 月', value: 'month' },
  { label: 'year 年', value: 'year' },
];

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: FAMILY_OPTIONS,
      placeholder: '家族',
    },
    fieldName: 'family_code',
    label: '家族',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '规则编码' },
    fieldName: 'rule_code',
    label: '规则编码',
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
    component: 'Select',
    componentProps: { options: FAMILY_OPTIONS },
    fieldName: 'family_code',
    label: '家族',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '如 practice.correct / checkin.daily' },
    fieldName: 'rule_code',
    label: '规则编码',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'rule_name',
    label: '规则名称',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { placeholder: '正数发放, 负数扣减' },
    fieldName: 'exp_delta',
    label: '经验值变化',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: { options: CYCLE_OPTIONS },
    fieldName: 'cycle_type',
    label: '周期',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, placeholder: '单周期内最大获取(0=无限)' },
    fieldName: 'daily_cap',
    label: '周期上限',
  },
  {
    component: 'Textarea',
    componentProps: { rows: 3 },
    fieldName: 'description',
    label: '说明',
  },
];

const FAMILY_COLOR: Record<string, string> = {
  FREE: 'default',
  VIP: 'blue',
  SVIP: 'gold',
};

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { type: 'checkbox', width: 60 },
    { field: 'id', title: 'ID', width: 80 },
    {
      field: 'family_code',
      title: '家族',
      width: 100,
      slots: {
        default: ({ row }: any) =>
          h(
            Tag,
            { color: FAMILY_COLOR[row.family_code] || 'default' },
            () => row.family_code,
          ),
      },
    },
    { field: 'rule_code', title: '规则编码', minWidth: 180 },
    { field: 'rule_name', title: '名称', minWidth: 160 },
    {
      field: 'exp_delta',
      title: '经验变化',
      width: 100,
      slots: {
        default: ({ row }: any) =>
          h(
            'span',
            {
              style: {
                color: row.exp_delta >= 0 ? '#52c41a' : '#ff4d4f',
                fontWeight: 700,
              },
            },
            row.exp_delta >= 0 ? `+${row.exp_delta}` : `${row.exp_delta}`,
          ),
      },
    },
    { field: 'cycle_type', title: '周期', width: 100 },
    {
      field: 'daily_cap',
      title: '周期上限',
      width: 100,
      formatter: ({ cellValue }) => cellValue || '无限',
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
