import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GkZhentiQuestionResult } from '#/api';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'title',
    label: '题目',
  },
  {
    component: 'Select',
    fieldName: 'type',
    label: '题型',
    componentProps: {
      allowClear: true,
      options: [
        { label: '单选题', value: '单选题' },
        { label: '多选题', value: '多选题' },
        { label: '判断题', value: '判断题' },
        { label: '填空题', value: '填空题' },
        { label: '简答题', value: '简答题' },
        { label: '论述题', value: '论述题' },
        { label: '案例分析', value: '案例分析' },
      ],
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'category_id',
    label: '分类ID',
  },
  {
    component: 'InputNumber',
    fieldName: 'year',
    label: '年份',
  },
  {
    component: 'Input',
    fieldName: 'source',
    label: '来源',
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<GkZhentiQuestionResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'title', title: '题目', minWidth: 300 },
    { field: 'type', title: '题型', width: 100 },
    { field: 'category_id', title: '分类ID', width: 100 },
    { field: 'year', title: '年份', width: 80 },
    { field: 'source', title: '来源', width: 150 },
    { field: 'difficulty', title: '难度', width: 80 },
    { field: 'view_count', title: '浏览量', width: 100 },
    {
      field: 'status',
      title: '状态',
      width: 80,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '启用', value: true },
          { color: 'error', label: '禁用', value: false },
        ],
      },
    },
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
    label: '题目',
    rules: 'required',
  },
  {
    component: 'Select',
    fieldName: 'type',
    label: '题型',
    rules: 'required',
    componentProps: {
      options: [
        { label: '单选题', value: '单选题' },
        { label: '多选题', value: '多选题' },
        { label: '判断题', value: '判断题' },
        { label: '填空题', value: '填空题' },
        { label: '简答题', value: '简答题' },
        { label: '论述题', value: '论述题' },
        { label: '案例分析', value: '案例分析' },
      ],
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'category_id',
    label: '分类ID',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'material_id',
    label: '材料ID',
  },
  {
    component: 'InputNumber',
    fieldName: 'year',
    label: '年份',
  },
  {
    component: 'Input',
    fieldName: 'source',
    label: '来源',
  },
  {
    component: 'InputNumber',
    fieldName: 'difficulty',
    label: '难度',
    componentProps: {
      min: 1,
      max: 10,
      step: 0.1,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'score',
    label: '分值',
    componentProps: {
      min: 0,
    },
  },
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: [
        { label: '启用', value: true },
        { label: '禁用', value: false },
      ],
      optionType: 'button',
    },
    defaultValue: true,
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'InputNumber',
    fieldName: 'sort_order',
    label: '排序',
    defaultValue: 0,
  },
];
