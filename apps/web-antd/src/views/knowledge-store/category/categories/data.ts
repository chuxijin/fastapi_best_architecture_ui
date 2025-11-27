import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { CategoryTreeResult } from '#/api';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入分类名称',
    },
    fieldName: 'name',
    label: '分类名称',
  },
];

export const catTypeMap: Record<number, string> = {
  0: '全部',
  1: '题库',
  2: '词库',
  3: '资料包',
  4: '商城',
};

export function useColumns(
  onActionClick?: OnActionClickFn<CategoryTreeResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'name',
      title: '分类名称',
      minWidth: 150,
      treeNode: true,
      align: 'left',
      fixed: 'left',
    },
    { field: 'code', title: '分类编码', width: 150 },
    {
      field: 'cat_type',
      title: '分类类型',
      width: 100,
      slots: { default: 'cat_type' },
    },
    { field: 'sort_order', title: '排序', width: 80 },
    {
      field: 'is_active',
      title: '状态',
      width: 80,
      slots: { default: 'status' },
    },
    { field: 'created_time', title: '创建时间', width: 180 },
    {
      field: 'operation',
      title: '操作',
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
            text: '新增子分类',
          },
          'edit',
          'delete',
        ],
      },
    },
  ];
}

export const formSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入分类名称',
    },
    fieldName: 'name',
    label: '分类名称',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入分类编码',
    },
    fieldName: 'code',
    label: '分类编码',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择分类类型',
      options: [
        { label: '全部', value: 0 },
        { label: '题库', value: 1 },
        { label: '词库', value: 2 },
        { label: '资料包', value: 3 },
        { label: '商城', value: 4 },
      ],
    },
    fieldName: 'cat_type',
    label: '分类类型',
    rules: 'required',
    defaultValue: 1,
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      allowClear: true,
      api: async () => {
        const { getQbankCategoryTreeApi } = await import('#/api');
        return getQbankCategoryTreeApi({});
      },
      class: 'w-full',
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      placeholder: '请选择父级分类',
    },
    fieldName: 'parent_id',
    label: '父级分类',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入排序',
      min: 0,
      style: { width: '100%' },
    },
    fieldName: 'sort_order',
    label: '排序',
    defaultValue: 0,
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '启用', value: true },
        { label: '禁用', value: false },
      ],
    },
    fieldName: 'is_active',
    label: '状态',
    defaultValue: true,
  },
];
