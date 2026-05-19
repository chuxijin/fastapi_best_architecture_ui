import type { VbenFormSchema } from '@vben/common-ui';
import type { OnActionClickParams, VxeGridProps } from '#/adapter/vxe-table';
import type { VocabWordResult } from '#/api/vocab';

import { h } from 'vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'keyword',
    label: '关键词',
    componentProps: {
      placeholder: '请输入单词',
    },
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'word',
    label: '单词',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'phonetic_us',
    label: '美式音标',
  },
  {
    component: 'Input',
    fieldName: 'phonetic_uk',
    label: '英式音标',
  },
  {
    component: 'Input',
    fieldName: 'common_meaning',
    label: '常用释义',
  },
  {
    component: 'InputNumber',
    fieldName: 'frequency',
    label: '词频等级',
    defaultValue: 0,
  },
];

export function useColumns(
  onActionClick: (params: OnActionClickParams<VocabWordResult>) => void,
): VxeGridProps['columns'] {
  return [
    { title: 'ID', field: 'id', width: 60 },
    { title: '单词', field: 'word', minWidth: 150 },
    { title: '美音', field: 'phonetic_us', width: 120 },
    { title: '英音', field: 'phonetic_uk', width: 120 },
    { title: '常用释义', field: 'common_meaning', minWidth: 200 },
    { title: '词频', field: 'frequency', width: 80 },
    { title: '创建时间', field: 'created_time', width: 160 },
    {
      title: '操作',
      field: 'action',
      fixed: 'right',
      width: 140,
      slots: {
        default: ({ row }) => {
          return h(
            'div',
            { class: 'flex gap-2' },
            [
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
            ],
          );
        },
      },
    },
  ];
}
