import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { MallProductResult } from '#/api';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '商品名称',
  },
  {
    component: 'Select',
    fieldName: 'product_type',
    label: '商品类型',
    componentProps: {
      allowClear: true,
      options: [
        { label: '虚拟商品', value: 'virtual' },
        { label: '实物商品', value: 'physical' },
      ],
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: {
      allowClear: true,
      options: [
        { label: '草稿', value: 'draft' },
        { label: '在售', value: 'on_sale' },
        { label: '下架', value: 'off_sale' },
      ],
    },
  },
];

const productTypeMap: Record<string, { color: string; label: string }> = {
  virtual: { color: 'blue', label: '虚拟' },
  physical: { color: 'green', label: '实物' },
};

const productStatusMap: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  on_sale: { color: 'success', label: '在售' },
  off_sale: { color: 'warning', label: '已下架' },
  deleted: { color: 'error', label: '已删除' },
};

export function useColumns(
  onActionClick?: OnActionClickFn<MallProductResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'name', title: '商品名称', minWidth: 200 },
    { field: 'subtitle', title: '副标题', minWidth: 150 },
    {
      field: 'product_type',
      title: '类型',
      width: 90,
      cellRender: {
        name: 'CellTag',
        props: {
          colorMap: productTypeMap,
        },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: {
        name: 'CellTag',
        props: {
          colorMap: productStatusMap,
        },
      },
    },
    { field: 'sort_order', title: '排序', width: 80 },
    { field: 'sales_count', title: '销量', width: 80 },
    { field: 'view_count', title: '浏览量', width: 90 },
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
      width: 150,
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
    },
  ];
}

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'name',
    label: '商品名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'subtitle',
    label: '副标题',
  },
  {
    component: 'InputNumber',
    fieldName: 'category_id',
    label: '分类 ID',
    rules: 'required',
  },
  {
    component: 'Select',
    fieldName: 'product_type',
    label: '商品类型',
    defaultValue: 'virtual',
    componentProps: {
      options: [
        { label: '虚拟商品', value: 'virtual' },
        { label: '实物商品', value: 'physical' },
      ],
    },
  },
  {
    component: 'Input',
    fieldName: 'cover_image',
    label: '封面图 URL',
  },
  {
    component: 'InputNumber',
    fieldName: 'sort_order',
    label: '排序权重',
    defaultValue: 0,
  },
  {
    component: 'InputNumber',
    fieldName: 'virtual_sales',
    label: '虚拟销量',
    defaultValue: 0,
  },
  {
    component: 'Textarea',
    fieldName: 'detail',
    label: '商品详情',
  },
];
