import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { SysCategoryTreeResult } from '#/api';

import { $t } from '@vben/locales';

import { getSysCategoryTreeApi } from '#/api';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'app_code',
    label: '应用标识',
    componentProps: {
      placeholder: '如：gongkao',
    },
  },
  {
    component: 'Input',
    fieldName: 'type',
    label: '分类类型',
    componentProps: {
      placeholder: '如：zhenti',
    },
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '分类名称',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '启用', value: true },
        { label: '禁用', value: false },
      ],
    },
    fieldName: 'status',
    label: $t('common.form.status'),
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<SysCategoryTreeResult>,
): VxeGridProps['columns'] {
  return [
    { field: 'app_code', title: '应用标识', width: 120 },
    { field: 'type', title: '分类类型', width: 120 },
    {
      field: 'name',
      title: '分类名称',
      align: 'left',
      treeNode: true,
      minWidth: 200,
    },
    { field: 'code', title: '编码', width: 120 },
    { field: 'sort_order', title: '排序', width: 80 },
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
      field: 'is_system',
      title: '系统分类',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'warning', label: '是', value: true },
          { color: 'default', label: '否', value: false },
        ],
      },
    },
    { field: 'remark', title: '备注', width: 150 },
    {
      field: 'created_time',
      title: $t('common.table.created_time'),
      width: 168,
      formatter: 'formatDateTime',
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
        options: [
          {
            code: 'add',
            text: '新增下级',
          },
          'edit',
          {
            code: 'delete',
            disabled: (row: SysCategoryTreeResult) => {
              return row.is_system;
            },
          },
        ],
      },
    },
  ];
}

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'app_code',
    label: '应用标识',
    rules: 'required',
    componentProps: {
      placeholder: '如：gongkao',
    },
    help: '用于区分不同应用的分类数据',
  },
  {
    component: 'Input',
    fieldName: 'type',
    label: '分类类型',
    componentProps: {
      placeholder: '如：科目、考试类型',
    },
    defaultValue: 'default',
    help: '同一应用下可以有多种分类类型',
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '分类名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'code',
    label: '分类编码',
    componentProps: {
      placeholder: '可选，用于程序标识',
    },
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      allowClear: true,
      api: getSysCategoryTreeApi,
      class: 'w-full',
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      showSearch: true,
      treeNodeFilterProp: 'name',
    },
    fieldName: 'parent_id',
    label: '父级分类',
  },
  {
    component: 'Input',
    fieldName: 'icon',
    label: '图标',
    componentProps: {
      placeholder: '图标名称或 URL',
    },
  },
  {
    component: 'Input',
    fieldName: 'color',
    label: '颜色',
    componentProps: {
      placeholder: '如：#1890ff',
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'sort_order',
    label: '排序',
    defaultValue: 0,
    componentProps: {
      min: 0,
      class: 'w-full',
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
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: [
        { label: '是', value: true },
        { label: '否', value: false },
      ],
      optionType: 'button',
    },
    defaultValue: false,
    fieldName: 'is_system',
    label: '系统分类',
    help: '系统分类禁止删除',
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '描述',
    componentProps: {
      rows: 2,
    },
  },
  {
    component: 'Textarea',
    fieldName: 'remark',
    label: '备注',
    componentProps: {
      rows: 2,
    },
  },
];
