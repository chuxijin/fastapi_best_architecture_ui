import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { BankResult } from '#/api';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入题库名称或编码',
    },
    fieldName: 'keyword',
    label: '关键词',
    formItemClass: 'md:col-span-1',
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      allowClear: true,
      api: async () => {
        const { getSysCategoryTreeApi } = await import('#/api');
        return getSysCategoryTreeApi({});
      },
      class: 'w-full',
      labelField: 'name',
      valueField: 'id',
      childrenField: 'children',
      placeholder: '请选择分类',
    },
    fieldName: 'cat_id',
    label: '所属分类',
    formItemClass: 'md:col-span-1',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      placeholder: '请选择状态',
      options: [
        { label: '上架', value: 1 },
        { label: '下架', value: 0 },
      ],
    },
    fieldName: 'status',
    label: '状态',
    formItemClass: 'md:col-span-1',
  },
];

export const statusMap: Record<number, { color: string; label: string }> = {
  0: { label: '下架', color: 'red' },
  1: { label: '上架', color: 'green' },
};

export const scopeMap: Record<number, string> = {
  1: '公开',
  2: '私有',
  3: 'VIP',
};

export function useColumns(
  onActionClick?: OnActionClickFn<BankResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'id',
      title: 'ID',
      width: 80,
    },
    {
      field: 'info',
      title: '题库信息',
      minWidth: 400,
      align: 'left',
      treeNode: true,
      slots: { default: 'info_default' },
    },
    {
      field: 'detail',
      title: '详情',
      width: 200,
      slots: { default: 'detail_default' },
    },
    {
      field: 'time',
      title: '时间',
      width: 200,
      slots: { default: 'time_default' },
    },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      width: 330,
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
            text: '增加子题库',
          },
          {
            code: 'toggle',
            text: (row: BankResult) => (row.status === 1 ? '下架' : '上架'),
          },
          {
            code: 'share',
            text: '分享',
          },
          'edit',
          {
            code: 'operation',
            text: '运营',
            icon: undefined,
            items: [
              { code: 'members', text: '题库学员' },
              { code: 'activation-codes', text: '题库激活码' },
              { code: 'video-analysis', text: '解析视频' },
              { code: 'text-analysis', text: '文字解析' },
              { code: 'invitation-cards', text: '题库邀请卡' },
              { code: 'group-guide', text: '引导加群' },
              { code: 'gift-management', text: '赠品管理' },
              { code: 'daily-practice', text: '每日刷题记录' },
              { code: 'card-records', text: '邀请卡记录' },
              { code: 'custom-popup', text: '专属弹窗' },
            ],
          },
          {
            code: 'tools',
            text: '工具',
          },
        ],
      },
    },
  ];
}

export const formSchema: VbenFormSchema[] = [
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
        return getSysCategoryTreeApi({});
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
    component: 'ApiSelect',
    componentProps: {
      allowClear: true,
      api: async () => {
        const { getBankListApi } = await import('#/api');
        const data = await getBankListApi({});
        return data.map((item: any) => ({
          label: item.name,
          value: item.id,
        }));
      },
      class: 'w-full',
      placeholder: '请选择父题库（可选）',
    },
    fieldName: 'parent_id',
    label: '所属父题库',
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
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入封面地址',
    },
    fieldName: 'cover_url',
    label: '封面地址',
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '上架', value: 1 },
        { label: '下架', value: 0 },
      ],
    },
    fieldName: 'status',
    label: '状态',
    defaultValue: 1,
  },
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择可见范围',
      options: [
        { label: '公开', value: 1 },
        { label: '私有', value: 2 },
        { label: 'VIP', value: 3 },
      ],
    },
    fieldName: 'scope',
    label: '可见范围',
    defaultValue: 1,
  },
];
