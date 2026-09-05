import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

const DAY_OPTIONS = [
  { label: '周一 / 第1天', value: 1 },
  { label: '周二 / 第2天', value: 2 },
  { label: '周三 / 第3天', value: 3 },
  { label: '周四 / 第4天', value: 4 },
  { label: '周五 / 第5天', value: 5 },
  { label: '周六 / 第6天', value: 6 },
  { label: '周日 / 第7天', value: 7 },
];

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '如 qbank.kaoyan.access' },
    fieldName: 'required_entitlement_code',
    label: '所需权益',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '事件编码' },
    fieldName: 'event_code',
    label: '事件编码',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '生效', value: 1 },
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
    componentProps: { placeholder: '留空表示对所有用户生效' },
    fieldName: 'required_entitlement_code',
    label: '所需权益',
    help: '填写权益编码可做差异化奖励（如会员双倍经验），不再使用固定的 VIP/SVIP 档位',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '如 practice_correct / check_in' },
    fieldName: 'event_code',
    label: '事件编码',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'name',
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
    componentProps: { options: DAY_OPTIONS, placeholder: '不限制则留空' },
    fieldName: 'cycle_day',
    label: '周期第几天',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, placeholder: '单次最少做题数' },
    fieldName: 'min_practice_count',
    label: '最低做题数',
    defaultValue: 0,
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, placeholder: '单次最少练习秒数' },
    fieldName: 'min_practice_duration',
    label: '最低时长(秒)',
    defaultValue: 0,
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, placeholder: '排序' },
    fieldName: 'sort',
    label: '排序',
    defaultValue: 0,
  },
  {
    component: 'Textarea',
    componentProps: { rows: 3 },
    fieldName: 'description',
    label: '说明',
  },
];

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { type: 'checkbox', width: 60 },
    { field: 'id', title: 'ID', width: 80 },
    {
      field: 'required_entitlement_code',
      title: '所需权益',
      minWidth: 180,
      slots: {
        default: ({ row }: any) =>
          row.required_entitlement_code
            ? h(Tag, { color: 'blue' }, () => row.required_entitlement_code)
            : h('span', { style: 'color: rgba(0,0,0,0.45);' }, '所有用户'),
      },
    },
    { field: 'event_code', title: '事件编码', minWidth: 160 },
    { field: 'name', title: '名称', minWidth: 160 },
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
    {
      field: 'cycle_day',
      title: '周期',
      width: 100,
      formatter: ({ cellValue }) => (cellValue ? `第 ${cellValue} 天` : '无限'),
    },
    {
      field: 'min_practice_count',
      title: '最低做题',
      width: 100,
    },
    {
      field: 'min_practice_duration',
      title: '最低时长',
      width: 100,
      formatter: ({ cellValue }) => (cellValue ? `${cellValue} 秒` : '无限制'),
    },
    {
      field: 'sort',
      title: '排序',
      width: 80,
    },
    {
      field: 'status',
      title: '状态',
      width: 80,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: row.status === 1 ? 'green' : 'default' }, () =>
            row.status === 1 ? '生效' : '停用',
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
