import type { VbenFormSchema } from '@vben/common-ui';
import type { OnActionClickParams, VxeGridProps } from '#/adapter/vxe-table';
import type { VocabBookResult } from '#/api/vocab';

import { h } from 'vue';
import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'keyword',
    label: '关键词',
    componentProps: {
      placeholder: '请输入词书名称',
    },
  },
  {
    component: 'Select',
    fieldName: 'is_official',
    label: '类型',
    componentProps: {
      options: [
        { label: '官方', value: true },
        { label: '用户', value: false },
      ],
      allowClear: true,
    },
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '词书名称',
    rules: 'required',
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '描述',
  },
  {
    component: 'Input',
    fieldName: 'category',
    label: '分类',
    defaultValue: 'custom',
    rules: 'required',
  },
  {
    component: 'Switch',
    fieldName: 'is_official',
    label: '是否官方',
    defaultValue: false,
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
    defaultValue: 1,
    componentProps: {
      options: [
        { label: '上架', value: 1 },
        { label: '下架', value: 0 },
      ],
    },
  },
];

export function useColumns(
  onActionClick: (params: OnActionClickParams<VocabBookResult>) => void,
): VxeGridProps['columns'] {
  return [
    { title: 'ID', field: 'id', width: 60 },
    { title: '词书名称', field: 'name', minWidth: 150 },
    { title: '分类', field: 'category', width: 120 },
    { title: '词数', field: 'word_count', width: 80 },
    {
      title: '类型',
      field: 'is_official',
      width: 80,
      slots: {
        default: ({ row }) => {
          return row.is_official
            ? h(Tag, { color: 'blue' }, () => '官方')
            : h(Tag, {}, () => '用户');
        },
      },
    },
    {
      title: '状态',
      field: 'status',
      width: 80,
      slots: {
        default: ({ row }) => {
          return row.status === 1
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
