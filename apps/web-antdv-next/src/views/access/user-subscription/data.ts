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
    component: 'Input',
    componentProps: { placeholder: '订阅模板 code' },
    fieldName: 'template_code',
    label: '模板',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '生效中', value: 'active' },
        { label: '已过期', value: 'expired' },
        { label: '已撤销', value: 'revoked' },
        { label: '已暂停', value: 'paused' },
      ],
      placeholder: '状态',
    },
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: 'actcode (激活码)', value: 'actcode' },
        { label: 'purchase (支付)', value: 'purchase' },
        { label: 'gift (赠送)', value: 'gift' },
        { label: 'reward (奖励)', value: 'reward' },
        { label: 'migration (迁移)', value: 'migration' },
        { label: 'manual (手动)', value: 'manual' },
      ],
      placeholder: '来源',
    },
    fieldName: 'source',
    label: '来源',
  },
];

const STATUS_COLOR: Record<string, string> = {
  active: 'green',
  expired: 'default',
  revoked: 'red',
  paused: 'orange',
};

const STATUS_LABEL: Record<string, string> = {
  active: '生效中',
  expired: '已过期',
  revoked: '已撤销',
  paused: '已暂停',
};

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { type: 'checkbox', width: 60 },
    { field: 'id', title: 'ID', width: 80 },
    { field: 'user_id', title: '用户 ID', width: 100 },
    { field: 'username', title: '用户名', minWidth: 140 },
    { field: 'template_code', title: '模板编码', minWidth: 220 },
    { field: 'template_name', title: '模板名称', minWidth: 160 },
    {
      field: 'valid_from',
      title: '生效时间',
      width: 170,
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString() : '-',
    },
    {
      field: 'valid_to',
      title: '到期时间',
      width: 170,
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString() : '-',
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) =>
          h(
            Tag,
            { color: STATUS_COLOR[row.status] || 'default' },
            () => STATUS_LABEL[row.status] || row.status,
          ),
      },
    },
    {
      field: 'source',
      title: '来源',
      width: 110,
      slots: {
        default: ({ row }: any) => h(Tag, { color: 'blue' }, () => row.source),
      },
    },
    {
      field: 'source_ref',
      title: '来源引用',
      minWidth: 180,
      showOverflow: 'tooltip',
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => {
          if (row.status !== 'active') {
            return [h('span', { style: 'color:#bbb' }, '-')];
          }
          return [
            h(
              'a',
              { onClick: () => onActionClick({ code: 'extend', row }) },
              '续期',
            ),
            h(
              'a',
              {
                style: { marginLeft: '8px', color: '#ff4d4f' },
                onClick: () => onActionClick({ code: 'revoke', row }),
              },
              '撤销',
            ),
          ];
        },
      },
    },
  ];
}
