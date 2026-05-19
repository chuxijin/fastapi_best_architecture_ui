import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '请输入模板编码 / 名称' },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入 Pack code' },
    fieldName: 'pack_code',
    label: 'Pack',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '请输入领域 code' },
    fieldName: 'domain_code',
    label: '领域',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '生效', value: 'active' },
        { label: '停用', value: 'inactive' },
      ],
      placeholder: '请选择状态',
    },
    fieldName: 'status',
    label: '状态',
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '如 sub.kaoyan.svip.annual' },
    fieldName: 'code',
    label: '模板编码',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '如 考研全家桶年卡' },
    fieldName: 'name',
    label: '模板名称',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      listHeight: 360,
      maxTagCount: 'responsive',
      mode: 'multiple',
      optionFilterProp: 'label',
      options: [],
      placeholder: '请选择关联 Pack',
      popupMatchSelectWidth: 560,
      showSearch: true,
      style: { width: '100%' },
    },
    fieldName: 'pack_codes',
    label: '关联 Pack',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      listHeight: 360,
      maxTagCount: 'responsive',
      mode: 'multiple',
      optionFilterProp: 'label',
      options: [],
      placeholder: '请选择关联领域',
      popupMatchSelectWidth: 520,
      showSearch: true,
      style: { width: '100%' },
    },
    fieldName: 'domain_codes',
    label: '关联领域',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 1, max: 3650, placeholder: '订阅天数' },
    fieldName: 'duration_days',
    label: '有效天数',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, placeholder: '单位: 分' },
    fieldName: 'price_cents',
    label: '现价(分)',
    rules: 'required',
  },
  {
    component: 'Textarea',
    componentProps: { rows: 3, placeholder: '订阅描述' },
    fieldName: 'description',
    label: '描述',
  },
];

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { type: 'checkbox', width: 60 },
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: '模板编码', minWidth: 200 },
    { field: 'name', title: '模板名称', minWidth: 160 },
    {
      field: 'pack_codes',
      title: 'Pack',
      minWidth: 160,
      formatter: ({ row }: any) =>
        (row.pack_codes || row.packs?.map((pack: any) => pack.code) || []).join(
          ', ',
        ),
    },
    {
      field: 'domain_codes',
      title: '领域',
      minWidth: 160,
      slots: {
        default: ({ row }: any) =>
          (row.domain_codes || []).map((code: string) =>
            h(
              Tag,
              { color: 'blue', style: { marginRight: '4px' } },
              () => code,
            ),
          ),
      },
    },
    {
      field: 'duration_days',
      title: '有效期',
      width: 100,
      formatter: ({ cellValue }) => `${cellValue} 天`,
    },
    {
      field: 'price_cents',
      title: '现价',
      width: 100,
      formatter: ({ cellValue }) =>
        `¥${(Number(cellValue || 0) / 100).toFixed(2)}`,
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: row.status === 'active' ? 'green' : 'default' }, () =>
            row.status === 'active' ? '生效' : '停用',
          ),
      },
    },
    {
      field: 'created_time',
      title: '创建时间',
      width: 170,
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString() : '-',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => [
          h(
            'a',
            { onClick: () => onActionClick({ code: 'detail', row }) },
            '详情',
          ),
          h(
            'a',
            {
              style: { marginLeft: '8px' },
              onClick: () => onActionClick({ code: 'edit', row }),
            },
            '编辑',
          ),
          h(
            'a',
            {
              style: { marginLeft: '8px' },
              onClick: () => onActionClick({ code: 'genCode', row }),
            },
            '生成激活码',
          ),
          h(
            'a',
            {
              style: { marginLeft: '8px', color: '#ff4d4f' },
              onClick: () => onActionClick({ code: 'delete', row }),
            },
            '删除',
          ),
        ],
      },
    },
  ];
}
