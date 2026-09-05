import type { VbenFormSchema } from '@vben/common-ui';

import type { OnActionClickParams, VxeGridProps } from '#/adapter/vxe-table';
import type { MemoryDeckResult } from '#/api/memory-card';

import { h } from 'vue';

import { Tag } from 'antdv-next';

export const DOMAIN_CATEGORY_OPTIONS = [
  { label: '考研', value: 1 },
  { label: '四六级', value: 40 },
  { label: '考公', value: 1400 },
];

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'keyword',
    label: '关键词',
    componentProps: {
      placeholder: '卡组名称 / 编码',
    },
  },
  {
    component: 'Select',
    fieldName: 'category_id',
    label: '领域',
    componentProps: {
      options: DOMAIN_CATEGORY_OPTIONS,
      allowClear: true,
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: {
      options: [
        { label: '上架', value: 'active' },
        { label: '下架', value: 'disabled' },
        { label: '归档', value: 'archived' },
      ],
      allowClear: true,
    },
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '卡组名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'code',
    label: '业务编码',
    componentProps: {
      placeholder: '留空自动生成',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '描述',
  },
  {
    component: 'Select',
    fieldName: 'category_id',
    label: '领域',
    componentProps: {
      options: DOMAIN_CATEGORY_OPTIONS,
      placeholder: '选择领域',
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'daily_new_limit',
    label: '每日新卡上限',
    defaultValue: 20,
  },
  {
    component: 'InputNumber',
    fieldName: 'daily_review_limit',
    label: '每日复习上限',
    defaultValue: 200,
  },
  {
    component: 'InputNumber',
    fieldName: 'sort_order',
    label: '排序',
    defaultValue: 0,
  },
  {
    component: 'RadioGroup',
    fieldName: 'status',
    label: '状态',
    defaultValue: 'active',
    componentProps: {
      options: [
        { label: '上架', value: 'active' },
        { label: '下架', value: 'disabled' },
        { label: '归档', value: 'archived' },
      ],
    },
  },
];

export function useColumns(
  onActionClick: (params: OnActionClickParams<MemoryDeckResult>) => void,
): VxeGridProps['columns'] {
  return [
    { title: 'ID', field: 'id', width: 60 },
    { title: '卡组名称', field: 'name', minWidth: 140 },
    { title: '编码', field: 'code', width: 130 },
    { title: '卡数', field: 'card_count', width: 70 },
    {
      title: '领域',
      field: 'category_id',
      width: 90,
      slots: {
        default: ({ row }) => {
          const found = DOMAIN_CATEGORY_OPTIONS.find(
            (item) => item.value === row.category_id,
          );
          return found ? h(Tag, { color: 'geekblue' }, () => found.label) : '—';
        },
      },
    },
    { title: '每日新卡', field: 'daily_new_limit', width: 90 },
    { title: '每日复习', field: 'daily_review_limit', width: 90 },
    {
      title: '状态',
      field: 'status',
      width: 80,
      slots: {
        default: ({ row }) => {
          const map: Record<string, [string, string]> = {
            active: ['success', '上架'],
            disabled: ['error', '下架'],
            archived: ['default', '归档'],
          };
          const [color, text] = map[row.status] ?? ['default', row.status];
          return h(Tag, { color }, () => text);
        },
      },
    },
    { title: '创建时间', field: 'created_time', width: 160 },
    {
      title: '操作',
      field: 'action',
      fixed: 'right',
      width: 140,
      slots: {
        default: ({ row }) => {
          return h('div', { class: 'flex gap-2' }, [
            h(
              'a',
              {
                class: 'text-primary cursor-pointer',
                onClick: () => onActionClick({ code: 'edit', row }),
              },
              '编辑',
            ),
            h(
              'a',
              {
                class: 'text-error cursor-pointer',
                onClick: () => onActionClick({ code: 'delete', row }),
              },
              '删除',
            ),
          ]);
        },
      },
    },
  ];
}
