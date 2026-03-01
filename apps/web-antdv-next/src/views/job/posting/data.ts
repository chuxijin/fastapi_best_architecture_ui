import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';

import { z } from '#/adapter/form';
import { DictEnum, getDictOptions } from '#/utils/dict';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'company_name',
    label: '公司名称',
  },
  {
    component: 'Input',
    fieldName: 'company_type',
    label: '公司类型',
  },
  {
    component: 'Input',
    fieldName: 'work_location',
    label: '工作地点',
  },
  {
    component: 'Input',
    fieldName: 'recruitment_object',
    label: '招聘对象',
  },
  {
    component: 'Input',
    fieldName: 'position',
    label: '岗位名称',
  },
  {
    component: 'Input',
    fieldName: 'industry',
    label: '所属行业',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: getDictOptions(DictEnum.RECRUITMENT_TYPE) || [
        { label: '秋招', value: '秋招' },
        { label: '春招', value: '春招' },
        { label: '社招', value: '社招' },
        { label: '校招', value: '校招' },
      ],
    },
    fieldName: 'recruitment_type',
    label: '招聘类型',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '已投递', value: '已投递' },
        { label: '已笔试', value: '已笔试' },
        { label: '已面试', value: '已面试' },
        { label: '已挂', value: '已挂' },
        { label: '面试通过', value: '面试通过' },
        { label: '暂不投递', value: '暂不投递' },
      ],
    },
    fieldName: 'application_status',
    label: '投递状态',
  },
];

export function useColumns(): VxeGridProps['columns'] {
  return [
    {
      field: 'company_name',
      title: '公司名称',
      align: 'center',
      fixed: 'left',
      width: 150,
      minWidth: 120,
    },
    {
      field: 'company_type',
      title: '公司类型',
      width: 120,
      minWidth: 100,
      slots: { default: 'company_type_default' },
    },
    {
      field: 'industry',
      title: '所属行业',
      width: 140,
      minWidth: 120,
      formatter: ({ cellValue }: { cellValue: null | string }) => {
        return cellValue || '-';
      },
    },
    {
      field: 'work_location',
      title: '工作地点',
      width: 160,
      minWidth: 150,
      formatter: ({ cellValue }: { cellValue: null | string }) => {
        return cellValue || '-';
      },
    },
    {
      field: 'position',
      title: '岗位',
      width: 150,
      minWidth: 120,
      slots: { default: 'position_default' },
    },
    {
      field: 'recruitment_info',
      title: '招聘信息',
      width: 160,
      minWidth: 150,
      slots: { default: 'recruitment_info_default' },
    },
    {
      field: 'delivery_period',
      title: '投递时间',
      width: 200,
      minWidth: 180,
      slots: { default: 'delivery_period_default' },
    },
    {
      field: 'referral_code',
      title: '内推码/免笔试',
      width: 140,
      minWidth: 120,
      slots: { default: 'referral_code_default' },
    },
    {
      field: 'salary_range',
      title: '薪资范围',
      width: 130,
      minWidth: 120,
    },
    {
      field: 'remark',
      title: '备注',
      width: 100,
      minWidth: 80,
      slots: { default: 'remark_default' },
    },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 260,
      minWidth: 240,
      slots: { default: 'operation_default' },
    },
  ];
}

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'company_name',
    label: '公司名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'company_type',
    label: '公司类型',
  },
  {
    component: 'Input',
    fieldName: 'industry',
    label: '所属行业',
  },
  {
    component: 'Input',
    fieldName: 'recruitment_type',
    label: '招聘类型',
  },
  {
    component: 'Input',
    fieldName: 'work_location',
    label: '工作地点',
  },
  {
    component: 'Input',
    fieldName: 'recruitment_object',
    label: '招聘对象',
  },
  {
    component: 'Input',
    fieldName: 'position',
    label: '岗位',
    rules: 'required',
  },
  {
    component: 'DatePicker',
    componentProps: {
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      showTime: true,
    },
    fieldName: 'delivery_start',
    label: '投递开始日期',
  },
  {
    component: 'DatePicker',
    componentProps: {
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      showTime: true,
    },
    fieldName: 'delivery_end',
    label: '投递截止日期',
  },
  {
    component: 'Input',
    fieldName: 'delivery_link',
    label: '投递链接',
    rules: z.string().url('请输入有效的URL地址').optional(),
  },
  {
    component: 'Textarea',
    componentProps: {
      rows: 4,
    },
    fieldName: 'recruitment_announcement',
    label: '招聘公告',
  },
  {
    component: 'Input',
    fieldName: 'referral_code',
    label: '内推码',
  },
  {
    component: 'Textarea',
    componentProps: {
      rows: 3,
    },
    fieldName: 'remark',
    label: '备注',
  },
  {
    component: 'Input',
    fieldName: 'salary_range',
    label: '薪资范围',
  },
  {
    component: 'Switch',
    componentProps: {
      checkedValue: true,
      unCheckedValue: false,
    },
    defaultValue: false,
    fieldName: 'is_exempt_from_written_test',
    label: '是否免笔试',
  },
  {
    component: 'Input',
    fieldName: 'logo_url',
    label: '公司Logo URL',
  },
];
