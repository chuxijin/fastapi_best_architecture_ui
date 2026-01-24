import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GkShizhenResult } from '#/api';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
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
  onActionClick?: OnActionClickFn<GkShizhenResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'daily_date', title: '日期', width: 120 },
    { field: 'original', title: '原文', minWidth: 300 },
    { field: 'summary', title: '主要内容', minWidth: 300 },
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
          nameField: 'daily_date',
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
    component: 'DatePicker',
    fieldName: 'daily_date',
    label: '日期',
    componentProps: {
      valueFormat: 'YYYY-MM-DD',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'original',
    label: '原文',
  },
  {
    component: 'Textarea',
    fieldName: 'summary',
    label: '主要内容',
  },
];
