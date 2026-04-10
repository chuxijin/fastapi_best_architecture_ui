import type { VbenFormSchema } from '#/adapter/form';

const QUESTION_BANK_CATEGORY_TREE_PARAMS = {
  app_code: 'youanshang',
  type: 'product_catalog',
  status: true,
} as const;

export const basicInfoSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入题库名称',
    },
    fieldName: 'name',
    label: '题库名称',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入题库编码',
    },
    fieldName: 'code',
    label: '题库编码',
    rules: 'required',
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      allowClear: true,
      api: async () => {
        const { getSysCategoryTreeApi } = await import('#/api');
        return getSysCategoryTreeApi(QUESTION_BANK_CATEGORY_TREE_PARAMS);
      },
      childrenField: 'children',
      class: 'w-full',
      labelField: 'name',
      placeholder: '请选择分类',
      valueField: 'id',
    },
    fieldName: 'cat_id',
    label: '所属分类',
    rules: 'required',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '普通题库', value: 1 },
        { label: '试卷', value: 2 },
        { label: '合集', value: 3 },
      ],
    },
    defaultValue: 1,
    fieldName: 'bank_type',
    label: '题库类型',
    rules: 'required',
  },
  {
    component: 'ApiSelect',
    componentProps: {
      allowClear: true,
      api: async () => {
        const { getBankListApi } = await import('#/api');
        const banks = await getBankListApi({});
        const flatten = (items: any[]): any[] => {
          return items.flatMap((item) => {
            const current = [{ label: item.name, value: item.id }];
            const children = Array.isArray(item.children)
              ? flatten(item.children)
              : [];
            return [...current, ...children];
          });
        };
        return flatten(banks || []);
      },
      class: 'w-full',
      placeholder: '请选择父题库（可选）',
    },
    fieldName: 'parent_id',
    label: '所属父题库',
  },
  {
    component: 'InputNumber',
    componentProps: {
      class: 'w-full',
      min: 0,
      precision: 2,
      step: 0.1,
    },
    fieldName: 'difficulty',
    label: '题库难度',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '练习 (1)', value: 1 },
        { label: '考试 (2)', value: 2 },
        { label: '练习 + 考试 (3)', value: 3 },
        { label: '模考 (4)', value: 4 },
        { label: '错题重练 (8)', value: 8 },
      ],
      placeholder: '请选择场景掩码',
    },
    defaultValue: 1,
    fieldName: 'scene_mask',
    label: '场景掩码',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '上架', value: 1 },
        { label: '下架', value: 0 },
      ],
      placeholder: '请选择状态',
    },
    defaultValue: 1,
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '公开', value: 1 },
        { label: '私有', value: 2 },
        { label: 'VIP', value: 3 },
      ],
      placeholder: '请选择可见范围',
    },
    defaultValue: 1,
    fieldName: 'scope',
    label: '可见范围',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入封面地址',
    },
    fieldName: 'cover_url',
    label: '封面地址',
  },
  {
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入题库描述',
      rows: 3,
    },
    fieldName: 'desc',
    label: '题库描述',
  },
];
