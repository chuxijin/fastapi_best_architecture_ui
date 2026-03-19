import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    fieldName: 'status',
    label: '订单状态',
    componentProps: {
      allowClear: true,
      options: [
        { label: '待支付', value: 'pending' },
        { label: '已支付', value: 'paid' },
        { label: '已取消', value: 'cancelled' },
        { label: '已退款', value: 'refunded' },
        { label: '已完成', value: 'completed' },
      ],
    },
  },
];

const orderStatusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待支付' },
  paid: { color: 'success', label: '已支付' },
  cancelled: { color: 'warning', label: '已取消' },
  refunded: { color: 'error', label: '已退款' },
  completed: { color: 'processing', label: '已完成' },
};

const orderTypeMap: Record<string, { color: string; label: string }> = {
  normal: { color: 'blue', label: '普通' },
  group_buy: { color: 'purple', label: '拼团' },
};

export function useColumns(): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'order_no', title: '订单号', width: 200 },
    { field: 'user_id', title: '用户 ID', width: 90 },
    {
      field: 'order_type',
      title: '类型',
      width: 80,
      cellRender: {
        name: 'CellTag',
        props: {
          colorMap: orderTypeMap,
        },
      },
    },
    { field: 'product_name', title: '商品名称', minWidth: 180 },
    { field: 'sku_name', title: 'SKU', width: 120 },
    { field: 'quantity', title: '数量', width: 70 },
    { field: 'unit_price', title: '单价', width: 90 },
    { field: 'total_amount', title: '总额', width: 90 },
    { field: 'paid_amount', title: '已付', width: 90 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: {
        name: 'CellTag',
        props: {
          colorMap: orderStatusMap,
        },
      },
    },
    { field: 'team_id', title: '团队 ID', width: 90 },
    {
      field: 'created_time',
      title: $t('common.table.created_time'),
      width: 168,
    },
  ];
}
