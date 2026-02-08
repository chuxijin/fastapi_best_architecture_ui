import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GkGuanmeiResult } from '#/api';

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
  onActionClick?: OnActionClickFn<GkGuanmeiResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'daily_date', title: '日期', width: 120 },
    {
      field: 'left_content',
      title: '左栏内容',
      minWidth: 200,
      formatter: ({ cellValue }) => {
        // 显示前50个字符
        if (cellValue && cellValue.length > 50) {
          return `${cellValue.replaceAll(/<[^>]+>/g, '').slice(0, 50)}...`;
        }
        return cellValue?.replace(/<[^>]+>/g, '') || '';
      },
    },
    {
      field: 'right_content',
      title: '右栏内容',
      minWidth: 200,
      formatter: ({ cellValue }) => {
        if (cellValue && cellValue.length > 50) {
          return `${cellValue.replaceAll(/<[^>]+>/g, '').slice(0, 50)}...`;
        }
        return cellValue?.replace(/<[^>]+>/g, '') || '';
      },
    },
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
    formItemClass: 'col-span-2',
    componentProps: {
      valueFormat: 'YYYY-MM-DD',
    },
  },
  {
    component: 'WangEditor',
    fieldName: 'left_content',
    label: '左栏内容（文段）',
    formItemClass: 'col-span-1',
    componentProps: {
      height: 400,
    },
  },
  {
    component: 'WangEditor',
    fieldName: 'right_content',
    label: '右栏内容（解析）',
    formItemClass: 'col-span-1',
    componentProps: {
      height: 400,
    },
  },
];
