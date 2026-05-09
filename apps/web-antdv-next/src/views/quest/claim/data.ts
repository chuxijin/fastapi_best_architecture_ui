import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { QuestClaimResult } from '#/api';

import { $t } from '@vben/locales';

export const claimStatusMap: Record<number, { color: string; label: string }> =
  {
    0: { color: 'processing', label: '进行中' },
    1: { color: 'warning', label: '待审核' },
    2: { color: 'success', label: '审核通过' },
    3: { color: 'error', label: '审核拒绝' },
    4: { color: 'green', label: '已发奖' },
    5: { color: 'default', label: '已放弃' },
    6: { color: 'magenta', label: '已撤销' },
  };

export const rewardStatusMap: Record<
  number,
  { color: string; label: string }
> = {
  0: { color: 'default', label: '未发' },
  1: { color: 'success', label: '已发' },
  2: { color: 'error', label: '发放失败' },
  3: { color: 'magenta', label: '已撤销' },
};

export const querySchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    fieldName: 'quest_id',
    label: '任务 ID',
    componentProps: { min: 1 },
  },
  {
    component: 'InputNumber',
    fieldName: 'user_id',
    label: '用户 ID',
    componentProps: { min: 1 },
  },
  {
    component: 'Select',
    fieldName: 'claim_status',
    label: '领取状态',
    componentProps: {
      allowClear: true,
      options: [
        { label: '进行中', value: 0 },
        { label: '待审核', value: 1 },
        { label: '审核通过', value: 2 },
        { label: '审核拒绝', value: 3 },
        { label: '已发奖', value: 4 },
        { label: '已放弃', value: 5 },
        { label: '已撤销', value: 6 },
      ],
    },
  },
];

export function useColumns(
  onActionClick?: (params: {
    code: string;
    row: QuestClaimResult;
  }) => void,
): VxeGridProps['columns'] {
  return [
    { field: 'seq', title: $t('common.table.id'), type: 'seq', width: 50 },
    { field: 'id', title: '记录 ID', width: 90 },
    { field: 'quest_id', title: '任务 ID', width: 90 },
    { field: 'user_id', title: '用户 ID', width: 90 },
    {
      field: 'claim_status',
      title: '领取状态',
      width: 110,
      cellRender: { name: 'CellTag', props: { colorMap: claimStatusMap } },
    },
    {
      field: 'reward_status',
      title: '奖励状态',
      width: 110,
      cellRender: { name: 'CellTag', props: { colorMap: rewardStatusMap } },
    },
    { field: 'claim_time', title: '领取时间', width: 168 },
    { field: 'submit_time', title: '提交时间', width: 168 },
    { field: 'review_time', title: '审核时间', width: 168 },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 110,
      slots: { default: 'operation_default' },
    },
  ];
}
