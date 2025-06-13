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
      // 这里需要动态加载应用列表
      options: [],
    },
    fieldName: 'application_id',
    label: '应用',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '启用', value: true },
        { label: '停用', value: false },
      ],
      placeholder: '请选择状态',
    },
    fieldName: 'is_active',
    label: '状态',
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      placeholder: '请选择应用',
      // 这里需要动态加载应用列表
      options: [],
    },
    fieldName: 'application_id',
    label: '应用',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入套餐名称',
    },
    fieldName: 'name',
    label: '套餐名称',
    rules: 'required',
  },
  {
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入套餐描述',
      rows: 3,
    },
    fieldName: 'description',
    label: '套餐描述',
  },
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
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 0,
      precision: 2,
      placeholder: '请输入原价',
    },
    fieldName: 'original_price',
    label: '原价（元）',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 0,
      max: 1,
      step: 0.01,
      precision: 2,
      placeholder: '请输入折扣率（0-1）',
    },
    fieldName: 'discount_rate',
    label: '折扣率',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: '请选择折扣开始时间',
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
    },
    fieldName: 'discount_start_time',
    label: '折扣开始时间',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: '请选择折扣结束时间',
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
    },
    fieldName: 'discount_end_time',
    label: '折扣结束时间',
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
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 0,
      max: 999,
      placeholder: '请输入排序',
    },
    fieldName: 'sort_order',
    label: '排序',
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
      field: 'application_name',
      title: '应用名称',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '套餐名称',
      minWidth: 150,
    },
    {
      field: 'description',
      title: '套餐描述',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'duration_days',
      title: '有效天数',
      width: 100,
      formatter: ({ cellValue }) => `${cellValue}天`,
    },
    {
      field: 'original_price',
      title: '原价',
      width: 100,
      formatter: ({ cellValue }) => `¥${cellValue}`,
    },
    {
      field: 'current_price',
      title: '现价',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          // 计算当前价格
          let currentPrice = parseFloat(row.original_price);

          // 如果有折扣率，检查折扣时间并计算折扣价
          if (row.discount_rate) {
            const now = new Date();
            const discountStart = row.discount_start_time ? new Date(row.discount_start_time) : null;
            const discountEnd = row.discount_end_time ? new Date(row.discount_end_time) : null;

            // 检查是否在折扣时间范围内
            const isInDiscountPeriod = (!discountStart || now >= discountStart) &&
                                     (!discountEnd || now <= discountEnd);

            if (isInDiscountPeriod) {
              currentPrice = currentPrice * parseFloat(row.discount_rate);
            }
          }

          const isDiscount = currentPrice !== parseFloat(row.original_price);
          return h('span', {
            style: { color: isDiscount ? '#ff4d4f' : '#000' },
          }, `¥${currentPrice.toFixed(2)}`);
        },
      },
    },
    {
      field: 'discount_rate',
      title: '折扣率',
      width: 100,
      formatter: ({ cellValue }) => {
        return cellValue ? `${(cellValue * 100).toFixed(0)}%` : '-';
      },
    },
    {
      field: 'max_devices',
      title: '最大设备数',
      width: 100,
    },
    {
      field: 'is_active',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          return h(Tag, {
            color: row.is_active ? 'green' : 'red',
          }, () => row.is_active ? '启用' : '停用');
        },
      },
    },
    {
      field: 'sort_order',
      title: '排序',
      width: 80,
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
      width: 160,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => [
          h('a', {
            onClick: () => onActionClick({ code: 'edit', row }),
          }, '编辑'),
          h('a', {
            style: { marginLeft: '8px', color: '#ff4d4f' },
            onClick: () => onActionClick({ code: 'delete', row }),
          }, '删除'),
        ],
      },
    },
  ];
}
