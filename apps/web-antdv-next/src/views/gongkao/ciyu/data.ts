import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GkCiyuResult } from '#/api';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'word',
    label: '词语',
  },
  {
    component: 'Input',
    fieldName: 'category',
    label: '分类',
  },
  {
    component: 'Select',
    fieldName: 'emotion',
    label: '感情色彩',
    componentProps: {
      allowClear: true,
      options: [
        { label: '褒义', value: '褒义' },
        { label: '贬义', value: '贬义' },
        { label: '中性', value: '中性' },
      ],
    },
  },
  {
    component: 'Select',
    fieldName: 'frequency',
    label: '考频',
    componentProps: {
      allowClear: true,
      options: [
        { label: '高频', value: 3 },
        { label: '中频', value: 2 },
        { label: '低频', value: 1 },
      ],
    },
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<GkCiyuResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'word', title: '词语', width: 120 },
    { field: 'pinyin', title: '拼音', width: 180 },
    { field: 'meaning', title: '释义', minWidth: 300 },
    { field: 'category', title: '分类', width: 100 },
    {
      field: 'emotion',
      title: '感情色彩',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '褒义', value: '褒义' },
          { color: 'error', label: '贬义', value: '贬义' },
          { color: 'default', label: '中性', value: '中性' },
        ],
      },
    },
    {
      field: 'frequency',
      title: '考频',
      width: 80,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'error', label: '高频', value: 3 },
          { color: 'warning', label: '中频', value: 2 },
          { color: 'default', label: '低频', value: 1 },
        ],
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
          nameField: 'word',
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
    fieldName: 'word',
    label: '词语',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'pinyin',
    label: '拼音',
  },
  {
    component: 'Textarea',
    fieldName: 'meaning',
    label: '释义',
  },
  {
    component: 'Input',
    fieldName: 'synonym',
    label: '近义词',
  },
  {
    component: 'Input',
    fieldName: 'antonym',
    label: '反义词',
  },
  {
    component: 'Textarea',
    fieldName: 'example',
    label: '例句',
  },
  {
    component: 'Input',
    fieldName: 'category',
    label: '分类',
  },
  {
    component: 'Input',
    fieldName: 'source',
    label: '出处',
  },
  {
    component: 'Select',
    fieldName: 'emotion',
    label: '感情色彩',
    componentProps: {
      options: [
        { label: '褒义', value: '褒义' },
        { label: '贬义', value: '贬义' },
        { label: '中性', value: '中性' },
      ],
    },
  },
  {
    component: 'Textarea',
    fieldName: 'confusion',
    label: '易混辨析',
  },
  {
    component: 'Select',
    fieldName: 'frequency',
    label: '考频',
    componentProps: {
      options: [
        { label: '高频', value: 3 },
        { label: '中频', value: 2 },
        { label: '低频', value: 1 },
      ],
    },
  },
];
