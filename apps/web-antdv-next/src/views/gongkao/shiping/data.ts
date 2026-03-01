import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GkShipingResult } from '#/api';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'title',
    label: '标题',
  },
  {
    component: 'Input',
    fieldName: 'source',
    label: '来源',
  },
  {
    component: 'Input',
    fieldName: 'author',
    label: '作者',
  },
  {
    component: 'DatePicker',
    fieldName: 'daily_date',
    label: '日期',
    componentProps: {
      valueFormat: 'YYYY-MM-DD',
    },
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<GkShipingResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'title', title: '标题', minWidth: 200 },
    { field: 'source', title: '来源', width: 120 },
    { field: 'author', title: '作者', width: 100 },
    { field: 'keywords', title: '关键词', width: 150 },
    { field: 'daily_date', title: '日期', width: 120 },
    { field: 'view_count', title: '阅读量', width: 100 },
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
    component: 'Input',
    fieldName: 'source',
    label: '来源',
  },
  {
    component: 'Input',
    fieldName: 'author',
    label: '作者',
  },
  {
    component: 'Input',
    fieldName: 'keywords',
    label: '关键词',
  },
  {
    component: 'DatePicker',
    fieldName: 'daily_date',
    label: '日期',
    componentProps: {
      valueFormat: 'YYYY-MM-DD',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'content',
    label: '内容',
  },
  {
    component: 'Textarea',
    fieldName: 'sidebar',
    label: '右边栏内容',
  },
  {
    component: 'Textarea',
    fieldName: 'mind_map',
    label: '思维导图',
  },
];
