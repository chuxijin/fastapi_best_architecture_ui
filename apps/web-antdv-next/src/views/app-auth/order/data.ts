import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入用户ID',
    },
    fieldName: 'user_id',
    label: '用户ID',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '待支付', value: 0 },
        { label: '已支付', value: 1 },
        { label: '支付失败', value: 2 },
      ],
      placeholder: '请选择支付状态',
    },
    fieldName: 'payment_status',
    label: '支付状态',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '待处理', value: 0 },
        { label: '处理中', value: 1 },
        { label: '已完成', value: 2 },
        { label: '已取消', value: 3 },
      ],
      placeholder: '请选择订单状态',
    },
    fieldName: 'order_status',
    label: '订单状态',
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择套餐',
      // 这里需要动态加载套餐列表
      options: [],
    },
    fieldName: 'package_id',
    label: '套餐',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择设备',
      // 这里需要动态加载设备列表
      options: [],
    },
    fieldName: 'device_id',
    label: '设备',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入用户ID',
    },
    fieldName: 'user_id',
    label: '用户ID',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入用户名',
    },
    fieldName: 'username',
    label: '用户名',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入联系方式',
    },
    fieldName: 'contact_info',
    label: '联系方式',
  },
  {
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入备注',
      rows: 3,
    },
    fieldName: 'remark',
    label: '备注',
  },
];

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    {
      type: 'checkbox',
      width: 60,
    },
    {
      field: 'id',
      title: 'ID',
      width: 80,
    },
    {
      field: 'order_no',
      title: '订单号',
      minWidth: 180,
      slots: {
        default: ({ row }) => [
          h(
            'span',
            {
              style: { fontFamily: 'monospace', fontSize: '14px' },
            },
            row.order_no,
          ),
        ],
      },
    },
    {
      field: 'package_id',
      title: '套餐ID',
      width: 100,
    },
    {
      field: 'username',
      title: '用户名',
      width: 120,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'contact_info',
      title: '联系方式',
      width: 150,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'total_amount',
      title: '订单金额',
      width: 100,
      formatter: ({ cellValue }) => `¥${cellValue}`,
    },
    {
      field: 'paid_amount',
      title: '已付金额',
      width: 100,
      formatter: ({ cellValue }) => `¥${cellValue}`,
    },
    {
      field: 'payment_method',
      title: '支付方式',
      width: 100,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'payment_status',
      title: '支付状态',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          const statusMap = {
            0: { text: '待支付', color: 'orange' },
            1: { text: '已支付', color: 'green' },
            2: { text: '支付失败', color: 'red' },
          };
          const status =
            statusMap[row.payment_status as keyof typeof statusMap];
          return h(
            Tag,
            {
              color: status?.color || 'default',
            },
            () => status?.text || '未知',
          );
        },
      },
    },
    {
      field: 'order_status',
      title: '订单状态',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          const statusMap = {
            0: { text: '待处理', color: 'orange' },
            1: { text: '处理中', color: 'blue' },
            2: { text: '已完成', color: 'green' },
            3: { text: '已取消', color: 'red' },
          };
          const status = statusMap[row.order_status as keyof typeof statusMap];
          return h(
            Tag,
            {
              color: status?.color || 'default',
            },
            () => status?.text || '未知',
          );
        },
      },
    },
    {
      field: 'created_time',
      title: '创建时间',
      width: 180,
      formatter: ({ cellValue }) => {
        return new Date(cellValue).toLocaleString();
      },
    },
    {
      field: 'paid_time',
      title: '支付时间',
      width: 180,
      formatter: ({ cellValue }) => {
        return cellValue ? new Date(cellValue).toLocaleString() : '-';
      },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => [
          h(
            'a',
            {
              onClick: () => onActionClick({ code: 'edit', row }),
            },
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
