import type { VbenFormSchema } from '@vben/common-ui';

import type { OnActionClickParams, VxeGridProps } from '#/adapter/vxe-table';
import type { MemoryCardResult } from '#/api/memory-card';

import { h } from 'vue';

import { Tag } from 'antdv-next';

export const CARD_TYPE_LABELS: Record<string, string> = {
  cloze: '多玩法素材',
  correction: '多玩法素材',
};

export const RESPONSE_MODE_LABELS: Record<string, string> = {
  input: '输入填空',
  reveal: '点击揭晓',
  choice: '选择填空',
  select_replace: '选区改错',
};

export function buildQuerySchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '关键词',
      componentProps: {
        placeholder: '标题 / 编码',
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
        ],
        allowClear: true,
      },
    },
  ];
}

export function useColumns(
  onActionClick: (params: OnActionClickParams<MemoryCardResult>) => void,
): VxeGridProps['columns'] {
  return [
    { title: 'ID', field: 'id', width: 60 },
    { title: '标题', field: 'title', minWidth: 180 },
    { title: '分组', field: 'group_name', minWidth: 100 },
    { title: '卡组', field: 'deck_name', minWidth: 120 },
    {
      title: '素材类型',
      field: 'card_type',
      width: 90,
      slots: {
        default: ({ row }) => {
          return h(
            Tag,
            { color: 'purple' },
            () => CARD_TYPE_LABELS[row.card_type] ?? row.card_type,
          );
        },
      },
    },
    {
      title: '默认玩法',
      field: 'response_mode',
      width: 100,
      slots: {
        default: ({ row }) => {
          return RESPONSE_MODE_LABELS[row.response_mode] ?? row.response_mode;
        },
      },
    },
    { title: '版本', field: 'revision_no', width: 70 },
    {
      title: '状态',
      field: 'status',
      width: 80,
      slots: {
        default: ({ row }) => {
          return row.status === 'active'
            ? h(Tag, { color: 'success' }, () => '上架')
            : h(Tag, { color: 'error' }, () => '下架');
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
