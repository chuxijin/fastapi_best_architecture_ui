import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GetCollectionCatalogItem } from '#/api';

import { getCollectionCatalogApi } from '#/api';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'keyword',
    label: '合集名称',
  },
];

export const statusMap: Record<string, { color: string; label: string }> = {
  draft: { label: '草稿', color: 'default' },
  active: { label: '启用', color: 'success' },
  archived: { label: '归档', color: 'warning' },
};

export const visibilityMap: Record<string, { color: string; label: string }> = {
  private: { label: '私有', color: 'default' },
  internal: { label: '内部', color: 'blue' },
  public: { label: '公开', color: 'success' },
};

export function useColumns(
  onActionClick?: OnActionClickFn<GetCollectionCatalogItem>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'name',
      title: '合集名称',
      minWidth: 220,
      treeNode: true,
      slots: { default: 'name_default' },
    },
    { field: 'code', title: '合集编码', width: 140 },
    {
      field: 'visibility',
      title: '可见范围',
      width: 90,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: '私有', value: 'private' },
          { color: 'blue', label: '内部', value: 'internal' },
          { color: 'success', label: '公开', value: 'public' },
        ],
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 80,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: '草稿', value: 'draft' },
          { color: 'success', label: '启用', value: 'active' },
          { color: 'warning', label: '归档', value: 'archived' },
        ],
      },
    },
    { field: 'sort_order', title: '排序', width: 60 },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      fixed: 'right',
      width: 260,
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'add', text: '新增子合集' },
          { code: 'banks', text: '题库挂载' },
          'edit',
          'delete',
        ],
      },
    },
  ];
}

export const formSchema: VbenFormSchema[] = [
  {
    component: 'ApiTreeSelect',
    componentProps: {
      allowClear: true,
      api: getCollectionCatalogApi,
      childrenField: 'children',
      class: 'w-full',
      labelField: 'name',
      placeholder: '请选择父级合集（留空为顶级合集）',
      valueField: 'id',
    },
    fieldName: 'parent_id',
    label: '上级合集',
  },
  {
    component: 'Input',
    fieldName: 'code',
    label: '合集编码',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '合集名称',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'sort_order',
    label: '排序',
    defaultValue: 0,
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '说明',
    componentProps: { rows: 3 },
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '公开', value: 'public' },
        { label: '内部', value: 'internal' },
        { label: '私有', value: 'private' },
      ],
    },
    defaultValue: 'public',
    fieldName: 'visibility',
    label: '可见范围',
  },
];
