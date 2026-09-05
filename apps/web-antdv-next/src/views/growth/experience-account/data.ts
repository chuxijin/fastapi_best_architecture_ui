import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    componentProps: { placeholder: '用户 ID' },
    fieldName: 'user_id',
    label: '用户 ID',
  },
];

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { type: 'checkbox', width: 60 },
    { field: 'user_id', title: '用户 ID', width: 100 },
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
