import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { QuestResult } from '#/api';

import { $t } from '@vben/locales';

const questStatusMap: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '草稿' },
  1: { color: 'processing', label: '进行中' },
  2: { color: 'warning', label: '已暂停' },
  3: { color: 'error', label: '已结束' },
};

const questTypeMap: Record<string, { color: string; label: string }> = {
  manual: { color: 'blue', label: '手动领取' },
  auto: { color: 'green', label: '自动触发' },
};

const rewardTypeMap: Record<string, { color: string; label: string }> = {
  feature: { color: 'cyan', label: '功能权益' },
  points: { color: 'gold', label: '经验/积分' },
  vip: { color: 'purple', label: '会员' },
  chaoji_course: { color: 'orange', label: '超级考研课程' },
};

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'keyword',
    label: '关键词',
    componentProps: {
      placeholder: '任务名称或任务码',
    },
    formItemClass: 'md:col-span-1',
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: {
      allowClear: true,
      options: [
        { label: '草稿', value: 0 },
        { label: '进行中', value: 1 },
        { label: '已暂停', value: 2 },
        { label: '已结束', value: 3 },
      ],
    },
    formItemClass: 'md:col-span-1',
  },
  {
    component: 'Select',
    fieldName: 'quest_type',
    label: '任务类型',
    componentProps: {
      allowClear: true,
      options: [
        { label: '手动领取', value: 'manual' },
        { label: '自动触发', value: 'auto' },
      ],
    },
    formItemClass: 'md:col-span-1',
  },
];

function mapToOptions(map: Record<string | number, { color: string; label: string }>) {
  return Object.entries(map).map(([key, item]) => {
    const num = Number(key);
    const value = Number.isNaN(num) ? key : num;
    return { value, ...item };
  });
}

const questStatusOptions = mapToOptions(questStatusMap);
const questTypeOptions = mapToOptions(questTypeMap);
const rewardTypeOptions = mapToOptions(rewardTypeMap);

export function useColumns(
  onActionClick?: OnActionClickFn<QuestResult>,
): VxeGridProps['columns'] {
  return [
    { field: 'seq', title: $t('common.table.id'), type: 'seq', width: 50 },
    { field: 'code', title: '任务码', width: 160 },
    {
      field: 'quest_type',
      title: '任务类型',
      width: 100,
      cellRender: { name: 'CellTag', options: questTypeOptions },
    },
    { field: 'name', title: '任务名称', minWidth: 180 },
    { field: 'brief', title: '简介', minWidth: 180 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: { name: 'CellTag', options: questStatusOptions },
    },
    {
      field: 'reward_type',
      title: '奖励类型',
      width: 110,
      cellRender: { name: 'CellTag', options: rewardTypeOptions },
    },
    {
      field: 'quota_progress',
      title: '名额进度',
      width: 120,
      formatter: ({ row }) => {
        const r = row as QuestResult;
        return r.total_quota === 0
          ? `${r.claimed_count} / 不限`
          : `${r.claimed_count} / ${r.total_quota}`;
      },
    },
    { field: 'sort', title: '排序', width: 80 },
    {
      field: 'created_time',
      title: $t('common.table.created_time'),
      width: 168,
    },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 150,
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
    },
  ];
}

// 表单 schema(detail 字段交给 HaloEditor 单独处理, 不在此 schema 内)
export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'code',
    label: '任务码',
    rules: 'required',
    componentProps: {
      placeholder: '人类可读, 用于检索/分享',
      maxLength: 64,
    },
  },
  {
    component: 'Select',
    fieldName: 'quest_type',
    label: '任务类型',
    defaultValue: 'manual',
    rules: 'required',
    componentProps: {
      options: [
        { label: '手动领取', value: 'manual' },
        { label: '自动触发', value: 'auto' },
      ],
    },
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '任务名称',
    rules: 'required',
    componentProps: { maxLength: 128 },
  },
  {
    component: 'Input',
    fieldName: 'brief',
    label: '任务简介',
    rules: 'required',
    componentProps: { placeholder: '一句话描述', maxLength: 255 },
  },
  {
    component: 'Textarea',
    fieldName: 'info',
    label: '任务信息',
    componentProps: { rows: 2, maxLength: 500, placeholder: '卡片摘要信息' },
  },
  {
    component: 'Input',
    fieldName: 'cover_image',
    label: '封面图 URL',
    componentProps: { maxLength: 500 },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    defaultValue: 0,
    componentProps: {
      options: [
        { label: '草稿', value: 0 },
        { label: '进行中', value: 1 },
        { label: '已暂停', value: 2 },
        { label: '已结束', value: 3 },
      ],
    },
  },
  {
    component: 'Select',
    fieldName: 'reward_type',
    label: '奖励类型',
    defaultValue: 'points',
    componentProps: {
      options: [
        { label: '经验/积分', value: 'points' },
        { label: '会员', value: 'vip' },
        { label: '功能权益', value: 'feature' },
        { label: '超级考研课程', value: 'chaoji_course' },
      ],
    },
  },
  {
    component: 'DatePicker',
    fieldName: 'start_time',
    label: '开始时间',
    componentProps: { showTime: true, valueFormat: 'YYYY-MM-DD HH:mm:ss' },
  },
  {
    component: 'DatePicker',
    fieldName: 'end_time',
    label: '结束时间',
    componentProps: { showTime: true, valueFormat: 'YYYY-MM-DD HH:mm:ss' },
  },
  {
    component: 'InputNumber',
    fieldName: 'total_quota',
    label: '总名额',
    defaultValue: 0,
    componentProps: { min: 0, placeholder: '0 表示不限' },
  },
  {
    component: 'InputNumber',
    fieldName: 'max_claims_per_user',
    label: '单用户最大领取次数',
    defaultValue: 1,
    componentProps: { min: 1 },
  },
  {
    component: 'InputNumber',
    fieldName: 'claim_expire_seconds',
    label: '领取后完成期限(秒)',
    defaultValue: 0,
    componentProps: { min: 0, placeholder: '0 表示不限时' },
  },
  {
    component: 'Switch',
    fieldName: 'submission_required',
    label: '需提交内容',
    defaultValue: true,
  },
  {
    component: 'Switch',
    fieldName: 'review_required',
    label: '需人工审核',
    defaultValue: true,
  },
  {
    component: 'InputNumber',
    fieldName: 'sort',
    label: '排序',
    defaultValue: 0,
    componentProps: { placeholder: '数字越小越靠前' },
  },
  {
    component: 'InputNumber',
    fieldName: 'reward_amount',
    label: '积分数量',
    defaultValue: 0,
    componentProps: { min: 0 },
    formItemClass: 'reward-field reward-field-points',
  },
  {
    component: 'InputNumber',
    fieldName: 'reward_days',
    label: '会员天数',
    defaultValue: 0,
    componentProps: { min: 1 },
    formItemClass: 'reward-field reward-field-vip',
  },
  {
    component: 'Input',
    fieldName: 'reward_feature_code',
    label: '权益标识',
    formItemClass: 'reward-field reward-field-feature',
  },
  {
    component: 'InputNumber',
    fieldName: 'reward_product_id',
    label: '商品 ID',
    componentProps: { min: 1 },
    formItemClass: 'reward-field reward-field-chaoji_course',
  },
];

// 奖励类型对应的表单字段配置
export const rewardFieldMap: Record<
  string,
  { field: string; label: string; placeholder: string }[]
> = {
  points: [
    {
      field: 'reward_amount',
      label: '积分数量',
      placeholder: '发放的经验/积分数量',
    },
  ],
  vip: [
    { field: 'reward_days', label: '会员天数', placeholder: '赠送的会员天数' },
  ],
  feature: [
    {
      field: 'reward_feature_code',
      label: '权益标识',
      placeholder: '功能权益标识码, 如 premium_question',
    },
  ],
  chaoji_course: [
    {
      field: 'reward_product_id',
      label: '商品 ID',
      placeholder: '超级考研商品 ID',
    },
  ],
};

// 状态映射用于其他组件
export { questStatusMap, questTypeMap, rewardTypeMap };
