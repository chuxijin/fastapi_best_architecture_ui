import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    componentProps: { placeholder: '用户 ID' },
    fieldName: 'user_id',
    label: '用户 ID',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '用户名' },
    fieldName: 'username',
    label: '用户名',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: 'FREE', value: 'FREE' },
        { label: 'VIP', value: 'VIP' },
        { label: 'SVIP', value: 'SVIP' },
      ],
      placeholder: '家族',
    },
    fieldName: 'family_code',
    label: '家族',
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
    { field: 'user_id', title: '用户 ID', width: 100 },
    { field: 'username', title: '用户名', minWidth: 140 },
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
    { field: 'current_grade', title: '当前等级', minWidth: 120 },
    {
      field: 'total_exp',
      title: '累计经验',
      width: 110,
      slots: {
        default: ({ row }: any) =>
          h('strong', { style: 'color: #1677ff' }, row.total_exp ?? 0),
      },
    },
    { field: 'available_exp', title: '可用经验', width: 110 },
    {
      field: 'updated_time',
      title: '更新时间',
      width: 170,
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString() : '-',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => [
          h(
            'a',
            { onClick: () => onActionClick({ code: 'grant', row }) },
            '发放',
          ),
          h(
            'a',
            {
              style: { marginLeft: '8px' },
              onClick: () => onActionClick({ code: 'consume', row }),
            },
            '扣减',
          ),
          h(
            'a',
            {
              style: { marginLeft: '8px' },
              onClick: () => onActionClick({ code: 'records', row }),
            },
            '查流水',
          ),
        ],
      },
    },
  ];
}
