import type { VbenFormSchema } from '#/adapter/form';

export const basicInfoSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入题库标题',
    },
    fieldName: 'name',
    label: '题库标题',
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
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入题库简介',
      rows: 3,
    },
    fieldName: 'desc',
    label: '题库简介',
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      allowClear: true,
      api: async () => {
        const { getSysCategoryTreeApi } = await import('#/api');
        return getSysCategoryTreeApi({
          app_code: 'question_bank',
          type: '题库',
        });
      },
      class: 'w-full',
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      placeholder: '请选择分类',
    },
    fieldName: 'cat_id',
    label: '所属分类',
    rules: 'required',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      options: [
        { label: '普通题库(含题目)', value: 10 },
        { label: '合集目录(仅含子题库)', value: 20 },
      ],
    },
    fieldName: 'type',
    label: '题库类型',
    defaultValue: 10,
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择题库难度',
      options: [
        { label: '简单', value: 1 },
        { label: '中等', value: 2 },
        { label: '困难', value: 3 },
      ],
    },
    fieldName: 'diff_id',
    label: '题库难度',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择题库状态',
      options: [
        { label: '草稿', value: 0 },
        { label: '已发布', value: 1 },
        { label: '已下架', value: 2 },
      ],
    },
    fieldName: 'status',
    label: '题库状态',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择题库范围',
      options: [
        { label: '公开', value: 0 },
        { label: '私有', value: 1 },
      ],
    },
    fieldName: 'scope',
    label: '题库范围',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入已购买人数',
      min: 0,
      class: 'w-full',
    },
    fieldName: 'buy_count',
    label: '已购买人数',
  },
];

export const coverSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入题库封面地址或上传文件',
    },
    fieldName: 'cover_url',
    label: '题库封面',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入方形封面地址或上传文件',
    },
    fieldName: 'square_cover_url',
    label: '方形封面',
  },
];

export const tagSchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      mode: 'tags',
      placeholder: '请输入或选择题库标签',
      class: 'w-full',
    },
    fieldName: 'tags',
    label: '题库标签',
  },
];

export const teacherSchema: VbenFormSchema[] = [
  {
    component: 'ApiSelect',
    componentProps: {
      mode: 'multiple',
      allowClear: true,
      api: async () => {
        return [
          { label: '教师1', value: 1 },
          { label: '教师2', value: 2 },
        ];
      },
      class: 'w-full',
      placeholder: '请选择题库教师',
    },
    fieldName: 'teacher_ids',
    label: '题库教师',
  },
];

export const priceSchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入划线价格',
      min: 0,
      precision: 2,
      class: 'w-full',
    },
    fieldName: 'original_price',
    label: '划线价格',
  },
  {
    component: 'Switch',
    componentProps: {
      checkedChildren: '开启',
      unCheckedChildren: '关闭',
    },
    fieldName: 'points_enabled',
    label: '积分兑换',
    defaultValue: false,
  },
  {
    component: 'Switch',
    componentProps: {
      checkedChildren: '展示',
      unCheckedChildren: '隐藏',
    },
    dependencies: {
      show: (values) => {
        return Boolean(values.points_enabled);
      },
      triggerFields: ['points_enabled'],
    },
    fieldName: 'points_shop_visible',
    label: '积分商城展示',
    defaultValue: true,
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择兑换方式',
      options: [
        { label: '积分加现金', value: 'points_cash' },
        { label: '仅积分', value: 'points_only' },
      ],
    },
    dependencies: {
      show: (values) => {
        return Boolean(values.points_enabled);
      },
      triggerFields: ['points_enabled'],
    },
    fieldName: 'points_exchange_type',
    label: '兑换方式',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入积分占比（0-100）',
      min: 0,
      max: 100,
      precision: 2,
      class: 'w-full',
    },
    dependencies: {
      show: (values) => {
        return Boolean(values.points_enabled);
      },
      triggerFields: ['points_enabled'],
    },
    fieldName: 'points_ratio',
    label: '积分占比 (%)',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入可抵扣的积分数量',
      min: 0,
      class: 'w-full',
    },
    dependencies: {
      show: (values) => {
        return Boolean(values.points_enabled);
      },
      triggerFields: ['points_enabled'],
    },
    fieldName: 'points_deduction_amount',
    label: '积分按数量抵扣',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入积分汇率，例如 1 积分 = 1 ¥',
      min: 0,
      precision: 2,
      class: 'w-full',
    },
    dependencies: {
      show: (values) => {
        return Boolean(values.points_enabled);
      },
      triggerFields: ['points_enabled'],
    },
    fieldName: 'points_exchange_rate',
    label: '积分汇率 (¥)',
  },
  {
    component: 'Switch',
    componentProps: {
      checkedChildren: '开启',
      unCheckedChildren: '关闭',
    },
    dependencies: {
      show: (values) => {
        return Boolean(values.points_enabled);
      },
      triggerFields: ['points_enabled'],
    },
    fieldName: 'points_partial_enabled',
    label: '部分积分抵扣',
    defaultValue: false,
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入题库价格',
      min: 0,
      precision: 2,
      class: 'w-full',
    },
    fieldName: 'price',
    label: '题库价格',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择价格时效',
      options: [
        { label: '永久', value: 'permanent' },
        { label: '1个月', value: '1month' },
        { label: '3个月', value: '3months' },
        { label: '6个月', value: '6months' },
        { label: '1年', value: '1year' },
      ],
    },
    fieldName: 'price_validity',
    label: '价格时效',
  },
];

export const analysisSchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入视频解析划线价格',
      min: 0,
      precision: 2,
      class: 'w-full',
    },
    fieldName: 'video_analysis_original_price',
    label: '视频解析划线价格',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入视频解析价格',
      min: 0,
      precision: 2,
      class: 'w-full',
    },
    fieldName: 'video_analysis_price',
    label: '视频解析价格',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入文字解析划线价格',
      min: 0,
      precision: 2,
      class: 'w-full',
    },
    fieldName: 'text_analysis_original_price',
    label: '文字解析划线价格',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入文字解析价格',
      min: 0,
      precision: 2,
      class: 'w-full',
    },
    fieldName: 'text_analysis_price',
    label: '文字解析价格',
  },
];
