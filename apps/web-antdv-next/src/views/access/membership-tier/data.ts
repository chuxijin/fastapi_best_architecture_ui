import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '搜索档位编码 / 名称' },
    fieldName: 'keyword',
    label: '关键词',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '生效', value: 'active' },
        { label: '草稿', value: 'draft' },
        { label: '归档', value: 'archived' },
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
    componentProps: { placeholder: '如 FREE / VIP / SVIP' },
    fieldName: 'code',
    label: '档位编码',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '如 SVIP会员' },
    fieldName: 'name',
    label: '档位名称',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, placeholder: '数值越大档位越高' },
    defaultValue: 0,
    fieldName: 'weight',
    label: '档位权重',
    rules: 'required',
  },
  {
    component: 'Switch',
    componentProps: { checkedChildren: '付费', unCheckedChildren: '免费' },
    defaultValue: false,
    fieldName: 'is_paid',
    label: '付费会员',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '如 #7C3AED' },
    fieldName: 'badge_color',
    label: '徽章颜色',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0 },
    defaultValue: 0,
    fieldName: 'display_order',
    label: '显示顺序',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '生效', value: 'active' },
        { label: '草稿', value: 'draft' },
        { label: '归档', value: 'archived' },
      ],
    },
    defaultValue: 'active',
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'Textarea',
    componentProps: { rows: 3, placeholder: '档位定位和展示说明' },
    fieldName: 'description',
    label: '描述',
  },
];

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { field: 'id', title: 'ID', width: 80 },
    {
      field: 'code',
      title: '档位',
      width: 130,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: row.badge_color || 'blue' }, () => row.code),
      },
    },
    { field: 'name', title: '名称', minWidth: 150 },
    { field: 'weight', title: '权重', width: 90 },
    {
      field: 'is_paid',
      title: '会员性质',
      width: 110,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: row.is_paid ? 'gold' : 'default' }, () =>
            row.is_paid ? '付费会员' : '免费用户',
          ),
      },
    },
    { field: 'display_order', title: '排序', width: 80 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: row.status === 'active' ? 'green' : 'default' }, () =>
            row.status === 'active' ? '生效' : row.status,
          ),
      },
    },
    { field: 'description', title: '描述', minWidth: 220, showOverflow: 'tooltip' },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => [
          h('a', { onClick: () => onActionClick({ code: 'edit', row }) }, '编辑'),
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

