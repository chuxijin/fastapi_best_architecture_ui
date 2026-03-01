import type { VbenFormSchema } from '#/adapter/form';
import type {
  DifficultyType,
  OnActionClickFn,
  QuestionListItem,
  QuestionType,
  VxeGridProps,
} from '#/adapter/vxe-table';

/**
 * 题型映射（字符串类型）
 */
export const questionTypeMap: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  judgement: '判断题',
  fill: '填空题',
  shortAnswer: '简答题',
  material: '材料题',
};

/**
 * 难度映射（字符串类型）
 */
export const difficultyMap: Record<DifficultyType, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

/**
 * 审核状态映射
 */
export const reviewStatusMap: Record<number, { color: string; label: string }> =
  {
    0: { label: '待审核', color: 'orange' },
    10: { label: '已通过', color: 'green' },
    20: { label: '已拒绝', color: 'red' },
  };

/**
 * 题型选项
 */
const questionTypeOptions: Array<{ label: string; value: QuestionType }> = [
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'judgement' },
  { label: '填空题', value: 'fill' },
  { label: '简答题', value: 'shortAnswer' },
];

/**
 * 难度选项
 */
const difficultyOptions: Array<{ label: string; value: DifficultyType }> = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
];

/**
 * 查询表单 Schema
 */
export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: '请输入题目关键词',
    },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: questionTypeOptions,
      placeholder: '请选择题型',
    },
    fieldName: 'type',
    label: '题型',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: difficultyOptions,
      placeholder: '请选择难度',
    },
    fieldName: 'difficulty',
    label: '难度',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '已启用', value: true },
        { label: '已停用', value: false },
      ],
      placeholder: '请选择状态',
    },
    fieldName: 'is_active',
    label: '状态',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '待审核', value: 0 },
        { label: '已通过', value: 10 },
        { label: '已拒绝', value: 20 },
      ],
      placeholder: '请选择审核状态',
    },
    fieldName: 'review_status',
    label: '审核状态',
  },
];

/**
 * 表格列定义
 */
export function useColumns(
  onActionClick?: OnActionClickFn<QuestionListItem>,
): VxeGridProps['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
      fixed: 'left',
    },
    {
      field: 'id',
      title: 'ID',
      width: 80,
      fixed: 'left',
    },
    {
      field: 'stem',
      title: '题目',
      minWidth: 300,
      align: 'left',
      showOverflow: 'tooltip',
    },
    {
      field: 'type',
      title: '题型',
      width: 100,
      formatter: ({ cellValue }) =>
        questionTypeMap[cellValue as QuestionType] || '未知',
    },
    {
      field: 'difficulty',
      title: '难度',
      width: 100,
      formatter: ({ cellValue }) =>
        difficultyMap[cellValue as DifficultyType] || '未知',
    },
    {
      field: 'chapter_name',
      title: '章节',
      width: 150,
      formatter: ({ cellValue }) => cellValue || '未分配',
    },
    {
      field: 'score',
      title: '分值',
      width: 80,
    },
    {
      field: 'knowledge_point',
      title: '考点',
      width: 150,
      showOverflow: 'tooltip',
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'is_active',
      title: '状态',
      width: 80,
      slots: { default: 'is_active_default' },
    },
    {
      field: 'review_status',
      title: '审核状态',
      width: 100,
      slots: { default: 'review_status_default' },
    },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      width: 200,
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'stem',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'preview',
            text: '预览',
          },
          'edit',
          'delete',
        ],
      },
    },
  ];
}
