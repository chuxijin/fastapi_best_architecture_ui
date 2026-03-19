import type { VbenFormSchema } from '#/adapter/form';
import type { DifficultyType, QuestionType, UsageType } from '#/api';

/**
 * 题型选项（字符串类型）
 */
export const questionTypeOptions: Array<{
  label: string;
  value: QuestionType;
}> = [
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'judgement' },
  { label: '填空题', value: 'fill' },
  { label: '简答题', value: 'shortAnswer' },
];

/**
 * 难度选项（字符串类型）
 */
export const difficultyOptions: Array<{
  label: string;
  value: DifficultyType;
}> = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
];

/**
 * 用途选项
 */
export const usageOptions: Array<{ label: string; value: UsageType }> = [
  { label: '全部', value: 'all' },
  { label: '考试', value: 'exam' },
  { label: '练习', value: 'practice' },
];

/**
 * 创建题目表单 Schema
 */
export function createQuestionFormSchema(
  bankId: number,
  chapterOptions: Array<{ label: string; value: number }>,
): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        options: questionTypeOptions,
        placeholder: '请选择题型',
      },
      fieldName: 'type',
      label: '题型',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: chapterOptions,
        placeholder: '请选择章节（可选）',
        allowClear: true,
      },
      fieldName: 'chapter_id',
      label: '所属章节',
    },
    {
      component: 'Select',
      componentProps: {
        options: difficultyOptions,
        placeholder: '请选择难度',
        allowClear: true,
      },
      fieldName: 'difficulty',
      label: '难度',
      defaultValue: 'medium',
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入分值',
        min: 0,
        step: 0.5,
        class: 'w-full',
      },
      fieldName: 'score',
      label: '分值',
      rules: 'required',
      defaultValue: 1,
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入题干（支持富文本）',
        rows: 4,
      },
      fieldName: 'stem',
      label: '题干',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入考点（多个用逗号分隔）',
      },
      fieldName: 'knowledge_point',
      label: '考点',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入来源',
      },
      fieldName: 'source',
      label: '来源',
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入年份',
        min: 1900,
        max: new Date().getFullYear(),
        class: 'w-full',
      },
      fieldName: 'year',
      label: '年份',
    },
    {
      component: 'Select',
      componentProps: {
        options: usageOptions,
        placeholder: '请选择用途',
      },
      fieldName: 'usage',
      label: '用途',
      defaultValue: 'all',
    },
    {
      component: 'Switch',
      componentProps: {
        checkedChildren: '启用',
        unCheckedChildren: '停用',
      },
      fieldName: 'is_active',
      label: '状态',
      defaultValue: true,
    },
  ];
}

/**
 * 创建题目解析表单 Schema
 */
export function createQuestionAnalysisFormSchema(
  questionType: QuestionType,
): VbenFormSchema[] {
  const schemas: VbenFormSchema[] = [];

  // 根据题型不同，答案输入方式不同
  switch (questionType) {
    case 'fill': {
      // 填空：输入多个答案（逗号分隔）
      schemas.push({
        component: 'Input',
        componentProps: {
          placeholder: '请输入正确答案（多个空用逗号分隔）',
        },
        fieldName: 'answer',
        label: '正确答案',
        rules: 'required',
      });

      break;
    }
    case 'judgement':
    case 'single': {
      // 单选/判断：输入单个答案
      schemas.push({
        component: 'Input',
        componentProps: {
          placeholder: '请输入正确答案（如：A）',
        },
        fieldName: 'answer',
        label: '正确答案',
        rules: 'required',
      });

      break;
    }
    case 'multiple': {
      // 多选：输入多个答案（逗号分隔）
      schemas.push({
        component: 'Input',
        componentProps: {
          placeholder: '请输入正确答案（多个答案用逗号分隔，如：A,C,D）',
        },
        fieldName: 'answer',
        label: '正确答案',
        rules: 'required',
      });

      break;
    }
    case 'shortAnswer': {
      // 简答：输入关键词
      schemas.push({
        component: 'Input',
        componentProps: {
          placeholder: '请输入关键词（多个关键词用逗号分隔）',
        },
        fieldName: 'keywords',
        label: '关键词',
        rules: 'required',
      });

      break;
    }
    // No default
  }

  // 解析内容
  schemas.push({
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入解析内容（支持富文本）',
      rows: 5,
    },
    fieldName: 'content',
    label: '解析内容',
    rules: 'required',
  });

  return schemas;
}
