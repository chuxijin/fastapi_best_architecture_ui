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

export const createSchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入用户 ID',
      min: 1,
      style: { width: '100%' },
    },
    fieldName: 'user_id',
    label: '用户 ID',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      showSearch: true,
      optionFilterProp: 'label',
      placeholder: '请选择订阅模板',
    },
    fieldName: 'template_code',
    label: '订阅模板',
    rules: 'required',
  },
  {
    component: 'DatePicker',
    componentProps: {
      showTime: true,
      placeholder: '开始时间',
      valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
      style: { width: '100%' },
    },
    fieldName: 'valid_from',
    label: '生效开始时间',
    rules: 'required',
  },
  {
    component: 'DatePicker',
    componentProps: {
      showTime: true,
      placeholder: '结束时间，不选表示永久',
      valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
      style: { width: '100%' },
    },
    fieldName: 'valid_to',
    label: '生效到期时间',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '管理员手动发放 (admin)', value: 'admin' },
        { label: '赠送 (gift)', value: 'gift' },
        { label: '激活码 (actcode)', value: 'actcode' },
        { label: '迁移 (migration)', value: 'migration' },
        { label: '任务奖励 (quest)', value: 'quest' },
        { label: '订单支付 (order)', value: 'order' },
      ],
      placeholder: '请选择来源',
    },
    fieldName: 'source',
    label: '订阅来源',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请填写来源引用（如：赠送原因或订单号）' },
    fieldName: 'source_ref',
    label: '来源引用',
  },
];
