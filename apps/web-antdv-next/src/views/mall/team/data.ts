import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    fieldName: 'activity_id',
    label: '活动 ID',
    rules: 'required',
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: {
      allowClear: true,
      options: [
        { label: '拼团中', value: 'pending' },
        { label: '已成团', value: 'success' },
        { label: '已失败', value: 'failed' },
        { label: '已取消', value: 'cancelled' },
      ],
    },
  },
];

const teamStatusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'processing', label: '拼团中' },
  success: { color: 'success', label: '已成团' },
  failed: { color: 'error', label: '已失败' },
  cancelled: { color: 'default', label: '已取消' },
};

export function useColumns(): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'id', title: '团队 ID', width: 90 },
    { field: 'activity_id', title: '活动 ID', width: 90 },
    { field: 'leader_user_id', title: '团长 ID', width: 90 },
    { field: 'required_people', title: '需要人数', width: 90 },
    { field: 'current_people', title: '当前人数', width: 90 },
    { field: 'team_price', title: '拼团价', width: 100 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: {
        name: 'CellTag',
        props: {
          colorMap: teamStatusMap,
        },
      },
    },
    {
      field: 'is_mock',
      title: '模拟成团',
      width: 90,
      cellRender: {
        name: 'CellTag',
        props: {
          colorMap: {
            true: { color: 'warning', label: '是' },
            false: { color: 'default', label: '否' },
          },
        },
      },
    },
    { field: 'start_time', title: '开团时间', width: 168 },
    { field: 'expire_time', title: '过期时间', width: 168 },
    { field: 'share_code', title: '分享码', width: 120 },
    {
      field: 'created_time',
      title: $t('common.table.created_time'),
      width: 168,
    },
  ];
}
