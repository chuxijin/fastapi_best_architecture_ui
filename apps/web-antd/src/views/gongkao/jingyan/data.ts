import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GkJingyanResult } from '#/api';

import { $t } from '@vben/locales';

import { getGkCategoryListApi } from '#/api/gongkao';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'title',
    label: '标题',
  },
  {
    component: 'ApiSelect',
    fieldName: 'type',
    label: '分类',
    componentProps: {
      allowClear: true,
      placeholder: '请选择分类',
      api: async () => {
        const data = await getGkCategoryListApi({ size: 100 });
        return data.items.map((item) => ({
          label: item.name,
          value: item.name,
        }));
      },
    },
  },
  {
    component: 'Input',
    fieldName: 'author',
    label: '作者',
  },
  {
    component: 'Input',
    fieldName: 'tags',
    label: '标签',
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<GkJingyanResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'title', title: '标题', minWidth: 200 },
    { field: 'type', title: '分类', width: 120 },
    { field: 'author', title: '作者', width: 100 },
    { field: 'tags', title: '标签', width: 150 },
    { field: 'summary', title: '摘要', minWidth: 250 },
    { field: 'view_count', title: '阅读量', width: 100 },
    { field: 'daily_date', title: '发布日期', width: 120 },
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
          nameField: 'title',
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
    fieldName: 'title',
    label: '标题',
    rules: 'required',
  },
  {
    component: 'ApiSelect',
    fieldName: 'type',
    label: '分类',
    rules: 'required',
    componentProps: {
      allowClear: true,
      placeholder: '请选择分类',
      api: async () => {
        const data = await getGkCategoryListApi({ size: 100 });
        return data.items.map((item) => ({
          label: item.name,
          value: item.name,
        }));
      },
    },
  },
  {
    component: 'Input',
    fieldName: 'author',
    label: '作者',
  },
  {
    component: 'Input',
    fieldName: 'tags',
    label: '标签',
  },
  {
    component: 'DatePicker',
    fieldName: 'daily_date',
    label: '发布日期',
    componentProps: {
      valueFormat: 'YYYY-MM-DD',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'summary',
    label: '摘要',
  },
  {
    component: 'Textarea',
    fieldName: 'content',
    label: '内容',
    rules: 'required',
  },
];
