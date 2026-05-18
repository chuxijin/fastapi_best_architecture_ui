import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '搜索 code / name' },
    fieldName: 'name',
    label: '关键词',
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
    componentProps: { placeholder: '如 kaoyan / kaogong / cet / jiaozi' },
    fieldName: 'code',
    label: '领域编码',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '如 考研 / 考公' },
    fieldName: 'name',
    label: '名称',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { placeholder: '关联 sys_category.id' },
    fieldName: 'cat_id',
    label: '关联分类 ID',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, max: 999 },
    fieldName: 'sort_order',
    label: '排序',
  },
];

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { type: 'checkbox', width: 60 },
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: '领域编码', minWidth: 140 },
    { field: 'name', title: '名称', minWidth: 140 },
    { field: 'cat_id', title: 'cat_id', width: 100 },
    { field: 'sort_order', title: '排序', width: 80 },
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
      field: 'created_time',
      title: '创建时间',
      width: 170,
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString() : '-',
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
