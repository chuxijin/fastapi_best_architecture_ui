import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GetBankListItem } from '#/api';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '请输入题库名称或编码' },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      placeholder: '请选择类型',
      options: [
        { label: '练习', value: 'practice' },
        { label: '试卷', value: 'paper' },
        { label: '模考', value: 'mock' },
      ],
    },
    fieldName: 'bank_kind',
    label: '题库类型',
  },
];

export const bankKindMap: Record<string, { color: string; label: string }> = {
  practice: { label: '练习', color: 'blue' },
  paper: { label: '试卷', color: 'orange' },
  mock: { label: '模考', color: 'purple' },
};

export const visibilityMap: Record<string, { color: string; label: string }> = {
  private: { label: '私有', color: 'default' },
  internal: { label: '内部', color: 'blue' },
  public: { label: '公开', color: 'success' },
};

export function useColumns(
  onActionClick?: OnActionClickFn<GetBankListItem>,
): VxeGridProps['columns'] {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: '题库编码', width: 120 },
    { field: 'name', title: '题库名称', minWidth: 180 },
    {
      field: 'bank_kind',
      title: '类型',
      width: 90,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: '练习', value: 'practice' },
          { color: 'orange', label: '试卷', value: 'paper' },
          { color: 'purple', label: '模考', value: 'mock' },
        ],
      },
    },
    { field: 'question_count', title: '题目数', width: 80 },
    {
      field: 'visibility',
      title: '可见范围',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: '私有', value: 'private' },
          { color: 'blue', label: '内部', value: 'internal' },
          { color: 'success', label: '公开', value: 'public' },
        ],
      },
    },
    { field: 'created_time', title: '创建时间', width: 168 },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      fixed: 'right',
      width: 220,
      cellRender: {
        name: 'CellOperation',
        attrs: { nameField: 'name', onClick: onActionClick },
        options: [{ code: 'detail', text: '编排管理' }, 'edit'],
      },
    },
  ];
}

export const formSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '请输入题库编码' },
    fieldName: 'code',
    label: '题库编码',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入题库名称' },
    fieldName: 'name',
    label: '题库名称',
    rules: 'required',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '练习', value: 'practice' },
        { label: '试卷', value: 'paper' },
        { label: '模考', value: 'mock' },
      ],
    },
    defaultValue: 'practice',
    fieldName: 'bank_kind',
    label: '题库类型',
    rules: 'required',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '私有', value: 'private' },
        { label: '内部', value: 'internal' },
        { label: '公开', value: 'public' },
      ],
    },
    defaultValue: 'public',
    fieldName: 'visibility',
    label: '可见范围',
  },
  {
    component: 'Textarea',
    componentProps: { placeholder: '请输入题库描述', rows: 3 },
    fieldName: 'description',
    label: '描述',
  },
];
