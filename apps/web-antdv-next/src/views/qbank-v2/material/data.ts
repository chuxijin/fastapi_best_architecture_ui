import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GetMaterialListItem } from '#/api';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '请输入材料标题或编码' },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      placeholder: '请选择版本状态',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '已发布', value: 'published' },
        { label: '已停用', value: 'retired' },
      ],
    },
    fieldName: 'revision_status',
    label: '版本状态',
  },
];

export const statusMap: Record<string, { color: string; label: string }> = {
  active: { label: '启用', color: 'success' },
  disabled: { label: '停用', color: 'error' },
  archived: { label: '归档', color: 'warning' },
};

export const revisionStatusMap: Record<
  string,
  { color: string; label: string }
> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '已发布', color: 'success' },
  retired: { label: '已停用', color: 'warning' },
};

export function useColumns(
  onActionClick?: OnActionClickFn<GetMaterialListItem>,
): VxeGridProps['columns'] {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: '材料编码', width: 120 },
    { field: 'title', title: '标题', minWidth: 200 },
    {
      field: 'status',
      title: '状态',
      width: 80,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '启用', value: 'active' },
          { color: 'error', label: '停用', value: 'disabled' },
          { color: 'warning', label: '归档', value: 'archived' },
        ],
      },
    },
    {
      field: 'revision_status',
      title: '版本状态',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: '草稿', value: 'draft' },
          { color: 'success', label: '已发布', value: 'published' },
          { color: 'warning', label: '已停用', value: 'retired' },
        ],
      },
    },
    { field: 'updated_time', title: '更新时间', width: 168 },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      fixed: 'right',
      width: 260,
      cellRender: {
        name: 'CellOperation',
        attrs: { nameField: 'code', onClick: onActionClick },
        options: [
          { code: 'annotate', text: '标注' },
          { code: 'detail', text: '详情' },
          'edit',
        ],
      },
    },
  ];
}

export const formSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'code',
    label: '材料编码',
    rules: 'required',
  },
  { component: 'Input', fieldName: 'title', label: '标题', rules: 'required' },
  {
    component: 'Textarea',
    fieldName: 'content',
    label: '正文',
    rules: 'required',
    componentProps: { rows: 6 },
  },
  { component: 'Input', fieldName: 'source_name', label: '来源' },
  { component: 'Input', fieldName: 'source_url', label: '来源地址' },
];
