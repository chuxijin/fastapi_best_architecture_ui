import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { GkGangweiResult } from '#/api';

import { $t } from '@vben/locales';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    fieldName: 'year',
    label: '年度',
  },
  {
    component: 'Input',
    fieldName: 'org_name',
    label: '单位名称',
  },
  {
    component: 'Input',
    fieldName: 'org_region',
    label: '单位地区',
  },
  {
    component: 'Input',
    fieldName: 'position_name',
    label: '职位名称',
  },
  {
    component: 'Input',
    fieldName: 'position_code',
    label: '职位代码',
  },
];

export function useColumns(
  onActionClick?: OnActionClickFn<GkGangweiResult>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'seq',
      title: $t('common.table.id'),
      type: 'seq',
      width: 50,
    },
    { field: 'year', title: '年度', width: 80 },
    { field: 'position_code', title: '职位代码', width: 120 },
    { field: 'position_name', title: '职位名称', minWidth: 200 },
    { field: 'org_name', title: '单位名称', minWidth: 250 },
    { field: 'org_region', title: '单位地区', width: 120 },
    { field: 'org_level', title: '单位层级', width: 100 },
    { field: 'recruit_num', title: '招收人数', width: 100 },
    { field: 'education_requirement', title: '学历要求', width: 120 },
    { field: 'apply_count', title: '报名数', width: 100 },
    { field: 'pass_count', title: '审核通过', width: 100 },
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
      width: 150,
      cellRender: {
        attrs: {
          nameField: 'position_name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
    },
  ];
}

export const schema: VbenFormSchema[] = [
  {
    component: 'InputNumber',
    fieldName: 'year',
    label: '年度',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'position_code',
    label: '职位代码',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'org_region',
    label: '单位地区',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'serial_no',
    label: '序号',
  },
  {
    component: 'Input',
    fieldName: 'org_code',
    label: '单位代码',
  },
  {
    component: 'Input',
    fieldName: 'org_name',
    label: '单位名称',
  },
  {
    component: 'Input',
    fieldName: 'position_name',
    label: '职位名称',
  },
  {
    component: 'Input',
    fieldName: 'org_system',
    label: '单位系统',
  },
  {
    component: 'Input',
    fieldName: 'org_level',
    label: '单位层级',
  },
  {
    component: 'Input',
    fieldName: 'work_location',
    label: '工作地点',
  },
  {
    component: 'Input',
    fieldName: 'job_rank',
    label: '职级',
  },
  {
    component: 'Input',
    fieldName: 'exam_type',
    label: '试卷类型',
  },
  {
    component: 'InputNumber',
    fieldName: 'recruit_num',
    label: '招收人数',
  },
  {
    component: 'Input',
    fieldName: 'recruit_scope',
    label: '招考范围',
  },
  {
    component: 'Input',
    fieldName: 'education_requirement',
    label: '学历要求',
  },
  {
    component: 'Input',
    fieldName: 'degree_requirement',
    label: '学位要求',
  },
  {
    component: 'Textarea',
    fieldName: 'major_requirement',
    label: '专业要求',
  },
  {
    component: 'Textarea',
    fieldName: 'other_requirement',
    label: '其他要求',
  },
];
