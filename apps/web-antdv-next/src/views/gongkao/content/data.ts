import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GkContentListResult } from '#/api';

import { h } from 'vue';

import { $t } from '@vben/locales';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'title',
    label: '标题',
    componentProps: {
      placeholder: '搜索标题...',
    },
  },
  {
    component: 'Select',
    fieldName: 'is_published',
    label: '状态',
    componentProps: {
      allowClear: true,
      options: [
        { label: '已发布', value: true },
        { label: '草稿', value: false },
      ],
    },
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<GkContentListResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'title', title: '标题', minWidth: 200 },
    { field: 'slug', title: '别名', width: 180 },
    {
      field: 'tags',
      title: '标签',
      minWidth: 150,
      slots: {
        default: ({ row }: { row: GkContentListResult }) => {
          if (!row.tags || row.tags.length === 0) return '-';
          return row.tags.map((tag) =>
            h(Tag, { color: 'blue', key: tag }, () => tag),
          );
        },
      },
    },
    {
      field: 'is_published',
      title: '状态',
      width: 80,
      slots: {
        default: ({ row }: { row: GkContentListResult }) => {
          return h(
            Tag,
            { color: row.is_published ? 'green' : 'default' },
            () => (row.is_published ? '已发布' : '草稿'),
          );
        },
      },
    },
    {
      field: 'is_pinned',
      title: '置顶',
      width: 70,
      slots: {
        default: ({ row }: { row: GkContentListResult }) => {
          return row.is_pinned ? h(Tag, { color: 'orange' }, () => '是') : '-';
        },
      },
    },
    { field: 'view_count', title: '浏览', width: 80 },
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
