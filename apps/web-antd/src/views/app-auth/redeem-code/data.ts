import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      placeholder: '请选择应用',
      options: [],
    },
    fieldName: 'application_id',
    label: '应用',
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: '请输入批次号',
    },
    fieldName: 'batch_no',
    label: '批次号',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '未使用', value: false },
        { label: '已使用', value: true },
      ],
      placeholder: '请选择使用状态',
    },
    fieldName: 'is_used',
    label: '使用状态',
  },
];

export const schema: VbenFormSchema[] = [
  // 第一行：应用和批次号
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择应用',
      options: [],
    },
    fieldName: 'application_id',
    label: '应用',
    rules: 'required',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入批次号',
    },
    fieldName: 'batch_no',
    label: '批次号',
    rules: 'required',
    formItemClass: 'col-span-1',
  },
  // 第二行：有效天数和最大设备数
  {
    component: 'InputNumber',
    componentProps: {
      min: 1,
      max: 3650,
      placeholder: '请输入有效天数',
    },
    fieldName: 'duration_days',
    label: '有效天数',
    rules: 'required',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 1,
      max: 100,
      placeholder: '请输入最大设备数',
    },
    fieldName: 'max_devices',
    label: '最大设备数',
    formItemClass: 'col-span-1',
  },
  // 备注
  {
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入备注',
      rows: 3,
    },
    fieldName: 'remark',
    label: '备注',
    formItemClass: 'col-span-2',
  },
  {
    component: 'Divider',
    componentProps: {
      orientation: 'left',
    },
    fieldName: 'divider1',
    label: '生成参数',
    formItemClass: 'col-span-2',
  },
  // 第三行：生成数量和密钥长度
  {
    component: 'InputNumber',
    componentProps: {
      min: 1,
      max: 1000,
      placeholder: '请输入生成数量',
    },
    fieldName: 'generation_params.count',
    label: '生成数量',
    rules: 'required',
    formItemClass: 'col-span-1',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 8,
      max: 32,
      placeholder: '请输入密钥长度',
    },
    fieldName: 'generation_params.key_length',
    label: '密钥长度',
    formItemClass: 'col-span-1',
  },
  // 第四行：前缀和后缀
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入前缀（可选）',
    },
    fieldName: 'generation_params.prefix',
    label: '前缀',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入后缀（可选）',
    },
    fieldName: 'generation_params.suffix',
    label: '后缀',
    formItemClass: 'col-span-1',
  },
  // 第五行：分组长度和分隔符
  {
    component: 'InputNumber',
    componentProps: {
      min: 1,
      max: 16,
      placeholder: '请输入分组长度（可选）',
    },
    fieldName: 'generation_params.group_length',
    label: '分组长度',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入分隔符（默认为-）',
      maxlength: 1,
    },
    fieldName: 'generation_params.separator',
    label: '分隔符',
    formItemClass: 'col-span-1',
  },
  {
    component: 'Divider',
    componentProps: {
      orientation: 'left',
    },
    fieldName: 'divider2',
    label: '字符类型',
    formItemClass: 'col-span-2',
  },
  // 第六行：字符类型（四个选项同一行）
  {
    component: 'Checkbox',
    componentProps: {
      label: '大写字母',
    },
    fieldName: 'generation_params.char_types.uppercase',
    label: '大写字母',
    formItemClass: 'col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    component: 'Checkbox',
    componentProps: {
      label: '小写字母',
    },
    fieldName: 'generation_params.char_types.lowercase',
    label: '小写字母',
    formItemClass: 'col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    component: 'Checkbox',
    componentProps: {
      label: '数字',
    },
    fieldName: 'generation_params.char_types.digits',
    label: '数字',
    formItemClass: 'col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1',
  },
  {
    component: 'Checkbox',
    componentProps: {
      label: '特殊字符',
    },
    fieldName: 'generation_params.char_types.special',
    label: '特殊字符',
    formItemClass: 'col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1',
  },
];

export function useColumns(onActionClick: (params: any) => void): VxeGridPropTypes.Columns {
  return [
    {
      type: 'checkbox',
      width: 60,
    },
    {
      field: 'id',
      title: 'ID',
      width: 80,
    },
    {
      field: 'code',
      title: '兑换码',
      minWidth: 200,
      slots: {
        default: ({ row }: any) => {
          return h('span', {
            style: { fontFamily: 'monospace', fontSize: '14px' },
          }, row.code);
        },
      },
    },
    {
      field: 'batch_no',
      title: '批次号',
      width: 150,
    },
    {
      field: 'duration_days',
      title: '有效天数',
      width: 100,
      formatter: ({ cellValue }) => `${cellValue}天`,
    },
    {
      field: 'max_devices',
      title: '最大设备数',
      width: 100,
    },
    {
      field: 'is_used',
      title: '使用状态',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          return h(Tag, {
            color: row.is_used ? 'red' : 'green',
          }, () => row.is_used ? '已使用' : '未使用');
        },
      },
    },
    {
      field: 'used_by',
      title: '使用者',
      width: 150,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'used_time',
      title: '使用时间',
      width: 180,
      formatter: ({ cellValue }) => {
        return cellValue ? new Date(cellValue).toLocaleString() : '-';
      },
    },
    {
      field: 'expire_time',
      title: '过期时间',
      width: 180,
      formatter: ({ cellValue }) => {
        return cellValue ? new Date(cellValue).toLocaleString() : '永不过期';
      },
    },
    {
      field: 'created_time',
      title: '创建时间',
      width: 180,
      formatter: ({ cellValue }) => {
        return new Date(cellValue).toLocaleString();
      },
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => {
          const actions = [
            h('a', {
              onClick: () => onActionClick({ code: 'copy', row }),
            }, '复制'),
          ];

          if (!row.is_used) {
            actions.push(h('a', {
              style: { marginLeft: '8px', color: '#ff4d4f' },
              onClick: () => onActionClick({ code: 'delete', row }),
            }, '删除'));
          }

          return actions;
        },
      },
    },
  ];
}
