import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { CmsSlotResult } from '#/api';

import { $t } from '@vben/locales';

export const slotStatusMap: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '草稿' },
  1: { color: 'success', label: '上线' },
  2: { color: 'warning', label: '已下线' },
};

export const slotTypeMap: Record<string, { color: string; label: string }> = {
  banner: { color: 'blue', label: '轮播图' },
  curtain: { color: 'purple', label: '幕布' },
  float: { color: 'cyan', label: '悬浮球' },
  notice: { color: 'gold', label: '公告条' },
  popup: { color: 'magenta', label: '弹窗' },
  splash: { color: 'geekblue', label: '启动页' },
};

export const targetUserTypeMap: Record<
  number,
  { color: string; label: string }
> = {
  0: { color: 'default', label: '全部' },
  1: { color: 'green', label: '新用户' },
  2: { color: 'gold', label: '会员' },
  3: { color: 'blue', label: '普通用户' },
  99: { color: 'magenta', label: '自定义' },
};

const slotTypeOptions = [
  { label: '幕布 (curtain)', value: 'curtain' },
  { label: '轮播图 (banner)', value: 'banner' },
  { label: '弹窗 (popup)', value: 'popup' },
  { label: '启动页 (splash)', value: 'splash' },
  { label: '悬浮球 (float)', value: 'float' },
  { label: '公告条 (notice)', value: 'notice' },
];

const jumpTypeOptions = [
  { label: '不跳转', value: 'none' },
  { label: 'H5 链接', value: 'url' },
  { label: '小程序内页', value: 'miniprogram' },
  { label: '悬赏任务', value: 'quest' },
  { label: '通用文章', value: 'content' },
  { label: '自定义', value: 'custom' },
];

const targetUserTypeOptions = [
  { label: '全部用户', value: 0 },
  { label: '新用户(7 天内)', value: 1 },
  { label: '会员', value: 2 },
  { label: '普通用户', value: 3 },
  { label: '自定义条件', value: 99 },
];

const statusOptions = [
  { label: '草稿', value: 0 },
  { label: '上线', value: 1 },
  { label: '已下线', value: 2 },
];

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'keyword',
    label: '关键词',
    componentProps: { placeholder: '业务码 / 名称 / 标题' },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: { allowClear: true, options: statusOptions },
  },
  {
    component: 'Select',
    fieldName: 'slot_type',
    label: '形态',
    componentProps: { allowClear: true, options: slotTypeOptions },
  },
  {
    component: 'Input',
    fieldName: 'scene',
    label: '场景',
    componentProps: { placeholder: '如 app_launch / home / ...' },
  },
];

export function useColumns(
  _onActionClick?: OnActionClickFn<CmsSlotResult>,
): VxeGridProps['columns'] {
  return [
    { field: 'seq', title: $t('common.table.id'), type: 'seq', width: 50 },
    { field: 'code', title: '业务码', width: 160 },
    { field: 'name', title: '名称', minWidth: 160 },
    {
      field: 'slot_type',
      title: '形态',
      width: 110,
      cellRender: { name: 'CellTag', props: { colorMap: slotTypeMap } },
    },
    { field: 'scene', title: '场景', width: 130 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: { name: 'CellTag', props: { colorMap: slotStatusMap } },
    },
    { field: 'priority', title: '优先级', width: 80 },
    {
      field: 'target_user_type',
      title: '分群',
      width: 110,
      cellRender: { name: 'CellTag', props: { colorMap: targetUserTypeMap } },
    },
    { field: 'jump_type', title: '跳转', width: 110 },
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
      width: 200,
      slots: { default: 'operation_default' },
    },
  ];
}

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'code',
    label: '业务码',
    rules: 'required',
    componentProps: { maxLength: 64 },
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '内部名称',
    rules: 'required',
    componentProps: { maxLength: 128 },
  },
  {
    component: 'Select',
    fieldName: 'slot_type',
    label: '形态',
    rules: 'required',
    componentProps: { options: slotTypeOptions },
  },
  {
    component: 'Input',
    fieldName: 'scene',
    label: '触发场景',
    rules: 'required',
    componentProps: {
      maxLength: 64,
      placeholder: 'app_launch / home / practice / ...',
    },
  },
  {
    component: 'Input',
    fieldName: 'title',
    label: '标题',
    componentProps: { maxLength: 255 },
  },
  {
    component: 'Input',
    fieldName: 'subtitle',
    label: '副标题/摘要',
    componentProps: { maxLength: 255 },
  },
  {
    component: 'Input',
    fieldName: 'image_url',
    label: '主图 URL',
    componentProps: { maxLength: 500 },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    defaultValue: 0,
    componentProps: { options: statusOptions },
  },
  {
    component: 'InputNumber',
    fieldName: 'priority',
    label: '优先级',
    defaultValue: 0,
    componentProps: { placeholder: '数字越大越靠前' },
  },
  {
    component: 'DatePicker',
    fieldName: 'start_time',
    label: '投放开始时间',
    componentProps: { showTime: true, valueFormat: 'YYYY-MM-DD HH:mm:ss' },
  },
  {
    component: 'DatePicker',
    fieldName: 'end_time',
    label: '投放结束时间',
    componentProps: { showTime: true, valueFormat: 'YYYY-MM-DD HH:mm:ss' },
  },
  {
    component: 'Select',
    fieldName: 'jump_type',
    label: '跳转类型',
    defaultValue: 'none',
    componentProps: { options: jumpTypeOptions },
  },
  {
    component: 'Input',
    fieldName: 'jump_target',
    label: '跳转目标',
    componentProps: {
      maxLength: 500,
      placeholder: 'URL 或业务 ID(如 quest_id)',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'jump_extra_text',
    label: '跳转扩展(JSON)',
    componentProps: { rows: 2, placeholder: '可选 JSON' },
  },
  {
    component: 'Select',
    fieldName: 'target_user_type',
    label: '目标分群',
    defaultValue: 0,
    componentProps: { options: targetUserTypeOptions },
  },
  {
    component: 'InputNumber',
    fieldName: 'target_min_member_level',
    label: '最低会员等级',
    defaultValue: 0,
    componentProps: { min: 0, placeholder: '0 不限' },
  },
  {
    component: 'Textarea',
    fieldName: 'target_extra_text',
    label: '分群扩展(JSON)',
    componentProps: { rows: 2, placeholder: '可选 JSON' },
  },
  {
    component: 'InputNumber',
    fieldName: 'max_show_per_user',
    label: '单用户终生展示上限',
    defaultValue: 0,
    componentProps: { min: 0, placeholder: '0 不限' },
  },
  {
    component: 'InputNumber',
    fieldName: 'max_show_per_day_per_user',
    label: '单用户每日展示上限',
    defaultValue: 0,
    componentProps: { min: 0, placeholder: '0 不限' },
  },
  {
    component: 'InputNumber',
    fieldName: 'close_dismiss_count',
    label: '关闭 N 次后不再展示',
    defaultValue: 0,
    componentProps: { min: 0, placeholder: '0 不限' },
  },
  {
    component: 'Switch',
    fieldName: 'can_close',
    label: '允许用户关闭',
    defaultValue: true,
  },
  {
    component: 'Textarea',
    fieldName: 'extra_text',
    label: '形态扩展(JSON)',
    componentProps: { rows: 2, placeholder: '可选 JSON, 形态特有字段兜底' },
  },
];
