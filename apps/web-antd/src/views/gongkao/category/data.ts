import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GkCategoryResult } from '#/api';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '名称',
  },
  {
    component: 'Select',
    fieldName: 'type',
    label: '类型',
    componentProps: {
      allowClear: true,
      options: [
        { label: '申论', value: 'shenlun' },
        { label: '行测', value: 'xingce' },
        { label: '面试', value: 'mianshi' },
      ],
    },
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<GkCategoryResult>,
): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '名称', minWidth: 200, treeNode: true },
    { field: 'type', title: '类型', width: 120 },
    { field: 'description', title: '描述', minWidth: 250 },
    { field: 'sort_order', title: '排序', width: 80 },
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
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [{ code: 'add', text: '新增子分类' }, 'edit', 'delete'],
      },
    },
  ];
}

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '名称',
    rules: 'required',
  },
  {
    component: 'Select',
    fieldName: 'type',
    label: '类型',
    rules: 'required',
    componentProps: {
      options: [
        { label: '申论', value: 'shenlun' },
        { label: '行测', value: 'xingce' },
        { label: '面试', value: 'mianshi' },
      ],
    },
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '描述',
  },
  {
    component: 'InputNumber',
    fieldName: 'sort_order',
    label: '排序',
    defaultValue: 0,
  },
  {
    component: 'InputNumber',
    fieldName: 'parent_id',
    label: '父级ID',
    componentProps: {
      show: false,
    },
  },
];
