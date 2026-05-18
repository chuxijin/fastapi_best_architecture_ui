import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '搜索 code / name' },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: 'qbank 题库', value: 'qbank' },
        { label: 'content 资料', value: 'content' },
        { label: 'ai AI 能力', value: 'ai' },
        { label: 'render 题本导出', value: 'render' },
        { label: 'resource 资源下载', value: 'resource' },
      ],
      placeholder: '分类',
    },
    fieldName: 'category',
    label: '分类',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '生效', value: 'active' },
        { label: '停用', value: 'inactive' },
      ],
      placeholder: '状态',
    },
    fieldName: 'status',
    label: '状态',
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '如 qbank.advanced / ai.grading.premium' },
    fieldName: 'code',
    label: '权益编码',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '名称',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: 'qbank', value: 'qbank' },
        { label: 'content', value: 'content' },
        { label: 'ai', value: 'ai' },
        { label: 'render', value: 'render' },
        { label: 'resource', value: 'resource' },
      ],
    },
    fieldName: 'category',
    label: '分类',
    rules: 'required',
  },
  {
    component: 'Textarea',
    componentProps: { rows: 3 },
    fieldName: 'description',
    label: '描述',
  },
];

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { type: 'checkbox', width: 60 },
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: '权益编码', minWidth: 200 },
    { field: 'name', title: '名称', minWidth: 160 },
    {
      field: 'category',
      title: '分类',
      width: 120,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: 'cyan' }, () => row.category),
      },
    },
    {
      field: 'description',
      title: '描述',
      minWidth: 220,
      showOverflow: 'tooltip',
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: row.status === 'active' ? 'green' : 'default' }, () =>
            row.status === 'active' ? '生效' : '停用',
          ),
      },
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => [
          h(
            'a',
            { onClick: () => onActionClick({ code: 'edit', row }) },
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
