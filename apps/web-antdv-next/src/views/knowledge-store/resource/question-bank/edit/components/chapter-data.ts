import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { ChapterTreeResult } from '#/api';

export const formSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入章节名称',
    },
    fieldName: 'name',
    label: '章节名称',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入章节编码',
    },
    fieldName: 'code',
    label: '章节编码',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入排序权重',
      min: 0,
      class: 'w-full',
    },
    fieldName: 'sort_order',
    label: '排序权重',
    defaultValue: 0,
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<ChapterTreeResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'id',
      title: 'ID',
      width: 80,
    },
    {
      field: 'name',
      title: '章节名称',
      minWidth: 150,
      align: 'left',
      treeNode: true,
    },
    {
      field: 'code',
      title: '章节编码',
      width: 150,
    },
    {
      field: 'level',
      title: '层级',
      width: 80,
    },
    {
      field: 'sort_order',
      title: '排序',
      width: 80,
    },
    {
      field: 'q_count',
      title: '题目数',
      width: 100,
    },
    {
      field: 'created_time',
      title: '创建时间',
      width: 180,
    },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      width: 400,
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'add',
            text: '添加子章节',
          },
          'edit',
          {
            code: 'share',
            text: '分享',
          },
          {
            code: 'question',
            text: '题目管理',
          },
          {
            code: 'import',
            text: '题目导入',
          },
          'delete',
        ],
      },
    },
  ];
}
