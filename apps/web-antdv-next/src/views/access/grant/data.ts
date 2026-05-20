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
    componentProps: { placeholder: '权益编码' },
    fieldName: 'entitlement_code',
    label: '权益编码',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '管理员发放 (admin)', value: 'admin' },
        { label: '补偿 (compensation)', value: 'compensation' },
        { label: '活动促销 (promo)', value: 'promo' },
        { label: '任务奖励 (quest)', value: 'quest' },
        { label: '邀请奖励 (invite)', value: 'invite' },
      ],
      placeholder: '来源',
    },
    fieldName: 'source',
    label: '来源',
  },
];

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
      placeholder: '请选择授予的权益',
    },
    fieldName: 'entitlement_code',
    label: '对应权益',
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
      placeholder: '到期时间，不选表示永久',
      valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
      style: { width: '100%' },
    },
    fieldName: 'valid_to',
    label: '生效结束时间',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '管理员发放 (admin)', value: 'admin' },
        { label: '补偿 (compensation)', value: 'compensation' },
        { label: '活动促销 (promo)', value: 'promo' },
        { label: '任务奖励 (quest)', value: 'quest' },
        { label: '邀请奖励 (invite)', value: 'invite' },
      ],
      placeholder: '请选择授予来源',
    },
    fieldName: 'source',
    label: '授予来源',
    rules: 'required',
  },
];

const SOURCE_LABEL: Record<string, string> = {
  admin: '管理员发放',
  compensation: '补偿发放',
  promo: '促销活动',
  quest: '任务奖励',
  invite: '邀请奖励',
};

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
    { field: 'entitlement_code', title: '权益编码', minWidth: 200 },
    { field: 'entitlement_name', title: '权益名称', minWidth: 160 },
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
        cellValue ? new Date(cellValue).toLocaleString() : '永久',
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
        default: ({ row }: any) =>
          h(
            Tag,
            { color: 'blue' },
            () => SOURCE_LABEL[row.source] || row.source,
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
        default: ({ row }: any) => {
          if (row.status !== 'active') {
            return [h('span', { style: 'color:#bbb' }, '-')];
          }
          return [
            h(
              'a',
              {
                style: { color: '#ff4d4f' },
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
