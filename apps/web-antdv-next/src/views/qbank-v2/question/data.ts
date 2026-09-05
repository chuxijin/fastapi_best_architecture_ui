import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GetQuestionListItem } from '#/api';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      filterOption: (input: string, option: any) =>
        (option.label || '').toLowerCase().includes(input.toLowerCase()),
      placeholder: '请选择所属题库',
      showSearch: true,
    },
    fieldName: 'bank_id',
    label: '所属题库',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入题干或编码' },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      placeholder: '请选择题型',
      options: [
        { label: '单选题', value: 'single_choice' },
        { label: '多选题', value: 'multiple_choice' },
        { label: '判断题', value: 'true_false' },
        { label: '填空题', value: 'fill_blank' },
        { label: '简答题', value: 'short_answer' },
        { label: '综合题', value: 'composite' },
        { label: '交互题', value: 'interactive' },
      ],
    },
    fieldName: 'question_type',
    label: '题型',
  },
];

export const questionTypeMap: Record<string, { color: string; label: string }> =
  {
    single_choice: { label: '单选', color: 'blue' },
    multiple_choice: { label: '多选', color: 'green' },
    true_false: { label: '判断', color: 'orange' },
    fill_blank: { label: '填空', color: 'purple' },
    short_answer: { label: '简答', color: 'cyan' },
    composite: { label: '综合', color: 'red' },
    interactive: { label: '交互', color: 'magenta' },
  };

export const statusMap: Record<string, { color: string; label: string }> = {
  active: { label: '启用', color: 'success' },
  disabled: { label: '停用', color: 'error' },
  archived: { label: '归档', color: 'warning' },
};

export function useColumns(
  onActionClick?: OnActionClickFn<GetQuestionListItem>,
): VxeGridProps['columns'] {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: '题目编码', width: 120 },
    {
      field: 'stem',
      title: '题干预览',
      minWidth: 240,
      formatter({ cellValue }) {
        if (!cellValue) return '-';
        const plainText = String(cellValue)
          .replaceAll(/<[^>]+>/g, '')
          .trim();
        return plainText.length > 60
          ? `${plainText.slice(0, 60)}...`
          : plainText;
      },
    },
    {
      field: 'question_type',
      title: '题型',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: '单选', value: 'single_choice' },
          { color: 'green', label: '多选', value: 'multiple_choice' },
          { color: 'orange', label: '判断', value: 'true_false' },
          { color: 'purple', label: '填空', value: 'fill_blank' },
          { color: 'cyan', label: '简答', value: 'short_answer' },
          { color: 'red', label: '综合', value: 'composite' },
          { color: 'magenta', label: '交互', value: 'interactive' },
        ],
      },
    },
    { field: 'default_score', title: '默认分值', width: 80 },
    { field: 'difficulty', title: '难度', width: 70 },
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
    { field: 'created_time', title: '创建时间', width: 168 },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      fixed: 'right',
      width: 200,
      cellRender: {
        name: 'CellOperation',
        attrs: { nameField: 'code', onClick: onActionClick },
        options: [{ code: 'detail', text: '详情' }, 'edit'],
      },
    },
  ];
}
