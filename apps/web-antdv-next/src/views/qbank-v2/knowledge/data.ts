import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GetKnowledgeSystemListItem } from '#/api';

export const querySchema: VbenFormSchema[] = [];

export function useColumns(
  onActionClick?: OnActionClickFn<GetKnowledgeSystemListItem>,
): VxeGridProps['columns'] {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: '体系编码', width: 120 },
    { field: 'name', title: '体系名称', minWidth: 160 },
    { field: 'version', title: '版本', width: 80 },
    {
      field: 'status',
      title: '状态',
      width: 80,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: '草稿', value: 'draft' },
          { color: 'success', label: '启用', value: 'active' },
          { color: 'warning', label: '归档', value: 'archived' },
        ],
      },
    },
    { field: 'created_time', title: '创建时间', width: 168 },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      fixed: 'right',
      width: 200,
      cellRender: {
        name: 'CellOperation',
        attrs: { nameField: 'name', onClick: onActionClick },
        options: [{ code: 'tree', text: '知识点树' }, 'edit', 'delete'],
      },
    },
  ];
}

export const formSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'code',
    label: '体系编码',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: '体系名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'version',
    label: '版本',
    rules: 'required',
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: '说明',
    componentProps: { rows: 3 },
  },
];
