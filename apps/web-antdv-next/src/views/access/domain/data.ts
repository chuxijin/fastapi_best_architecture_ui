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
    componentProps: { placeholder: '父级领域 ID' },
    fieldName: 'parent_id',
    label: '父级领域 ID',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, max: 999 },
    fieldName: 'display_order',
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
    { field: 'parent_id', title: '父级 ID', width: 100 },
    { field: 'display_order', title: '排序', width: 80 },
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
