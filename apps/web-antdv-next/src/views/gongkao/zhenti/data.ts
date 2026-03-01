import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GkZhentiQuestionResult } from '#/api';

import { $t } from '@vben/locales';

import { getSysCategoryTreeApi } from '#/api';
import { getGkZhentiMaterialListApi } from '#/api/gongkao';

// 真题分类 API 封装
const getZhentiCategoryApi = () =>
  getSysCategoryTreeApi({ app_code: 'gongkao', type: '科目' });

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
    component: 'ApiTreeSelect',
    fieldName: 'category_id',
    label: '分类',
    componentProps: {
      allowClear: true,
      placeholder: '请选择分类',
      api: getZhentiCategoryApi,
      class: 'w-[200px]',
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      showSearch: true,
      treeNodeFilterProp: 'name',
    },
  },
  {
    component: 'ApiSelect',
    fieldName: 'material_id',
    label: '材料',
    componentProps: {
      allowClear: true,
      placeholder: '按材料筛选',
      showSearch: true,
      optionFilterProp: 'label',
      class: 'w-[200px]',
      api: async () => {
        const data = await getGkZhentiMaterialListApi({
          size: 200,
          status: true,
        });
        return data.items.map((item) => ({
          label: `[${item.year || '未知'}] ${item.title}`,
          value: item.id,
        }));
      },
    },
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
      width: 200,
      cellRender: {
        attrs: {
          nameField: 'title',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'answers', 'delete'],
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
    component: 'ApiTreeSelect',
    fieldName: 'category_id',
    label: '分类',
    rules: 'required',
    componentProps: {
      allowClear: true,
      placeholder: '请选择分类',
      api: getZhentiCategoryApi,
      class: 'w-full',
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      showSearch: true,
      treeNodeFilterProp: 'name',
    },
  },
  {
    component: 'ApiTreeSelect',
    fieldName: '_material_category',
    label: '材料分类',
    componentProps: {
      allowClear: true,
      placeholder: '筛选材料分类',
      api: getZhentiCategoryApi,
      class: 'w-full',
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      showSearch: true,
      treeNodeFilterProp: 'name',
    },
  },
  {
    component: 'InputNumber',
    fieldName: '_material_year',
    label: '材料年份',
    componentProps: {
      placeholder: '筛选年份',
      class: 'w-full',
    },
  },
  {
    component: 'ApiSelect',
    fieldName: 'material_ids',
    label: '关联材料',
    dependencies: {
      componentProps: async (values) => {
        const params: Record<string, any> = { size: 200, status: true };
        if (values._material_category) {
          params.category_id = values._material_category;
        }
        if (values._material_year) {
          params.year = values._material_year;
        }
        const data = await getGkZhentiMaterialListApi(params);
        return {
          options: data.items.map((item) => ({
            label: `[${item.year || '未知'}] ${item.title}`,
            value: item.id,
          })),
        };
      },
      triggerFields: ['_material_category', '_material_year'],
    },
    componentProps: {
      allowClear: true,
      mode: 'multiple',
      placeholder: '请选择关联材料',
      showSearch: true,
      optionFilterProp: 'label',
      class: 'w-full',
      dropdownStyle: { minWidth: '400px' },
    },
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

export const materialSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'title',
    label: '标题',
    rules: 'required',
  },
  {
    component: 'ApiTreeSelect',
    fieldName: 'category_id',
    label: '分类',
    rules: 'required',
    componentProps: {
      allowClear: true,
      placeholder: '请选择分类',
      api: getZhentiCategoryApi,
      class: 'w-full',
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      showSearch: true,
      treeNodeFilterProp: 'name',
    },
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
    component: 'Textarea',
    fieldName: 'content',
    label: '内容',
    rules: 'required',
    componentProps: {
      rows: 6,
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

// 客观题题型
const OBJECTIVE_TYPES = new Set(['判断题', '单选题', '多选题']);

export const answerSchema: VbenFormSchema[] = [
  // 隐藏字段：存储题目类型
  {
    component: 'Input',
    fieldName: '_question_type',
    label: '',
    formItemClass: 'hidden',
    componentProps: {
      class: 'hidden',
    },
  },
  // 隐藏字段：存储题目 ID
  {
    component: 'InputNumber',
    fieldName: 'question_id',
    label: '',
    formItemClass: 'hidden',
    componentProps: {
      class: 'hidden',
    },
  },
  {
    component: 'Input',
    fieldName: 'source',
    label: '答案来源',
    rules: 'required',
    componentProps: {
      placeholder: '如：粉笔、华图、官方',
    },
  },
  // 客观题答案（单选/多选/判断）
  {
    component: 'Input',
    fieldName: 'answer_keys',
    label: '答案',
    dependencies: {
      show: (values) => OBJECTIVE_TYPES.has(values._question_type),
    },
    componentProps: {
      placeholder: '如：A 或 ABD',
    },
    help: '客观题答案，单选填一个选项，多选填多个选项如 ABD',
  },
  // 主观题答案
  {
    component: 'Textarea',
    fieldName: 'answer',
    label: '参考答案',
    dependencies: {
      show: (values) => !OBJECTIVE_TYPES.has(values._question_type),
    },
    componentProps: {
      rows: 4,
      placeholder: '主观题参考答案',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'analysis',
    label: '答案解析',
    componentProps: {
      rows: 4,
      placeholder: '答案解析说明',
    },
  },
  {
    component: 'Input',
    fieldName: 'analysis_video_url',
    label: '视频解析',
    componentProps: {
      placeholder: '视频解析链接',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'reference_materials',
    label: '参考资料',
    componentProps: {
      rows: 2,
      placeholder: '参考资料或出处',
    },
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
    fieldName: 'is_official',
    label: '官方答案',
  },
];
