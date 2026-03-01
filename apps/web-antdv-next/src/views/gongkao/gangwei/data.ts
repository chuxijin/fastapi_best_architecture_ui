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
    fieldName: 'exam_type',
    label: '考试类型',
  },
  {
    component: 'Input',
    fieldName: 'region',
    label: '所属地区',
  },
  {
    component: 'Input',
    fieldName: 'dept_name',
    label: '部门名称',
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
    { field: 'exam_type', title: '考试类型', width: 100 },
    { field: 'position_code', title: '职位代码', width: 120 },
    { field: 'position_name', title: '职位名称', minWidth: 200 },
    { field: 'dept_name', title: '部门名称', minWidth: 250 },
    { field: 'region', title: '所属地区', width: 120 },
    { field: 'org_level', title: '机构层级', width: 100 },
    { field: 'recruit_num', title: '招考人数', width: 100 },
    { field: 'education', title: '学历', width: 100 },
    {
      title: '笔试分数',
      children: [
        { field: 'written_min_score', title: '最低', width: 80 },
        { field: 'written_avg_score', title: '平均', width: 80 },
        { field: 'written_max_score', title: '最高', width: 80 },
      ],
    },
    {
      title: '面试分数',
      children: [
        { field: 'interview_min_score', title: '最低', width: 80 },
        { field: 'interview_avg_score', title: '平均', width: 80 },
        { field: 'interview_max_score', title: '最高', width: 80 },
      ],
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
    fieldName: 'exam_type',
    label: '考试类型',
  },
  {
    component: 'Input',
    fieldName: 'position_code',
    label: '职位代码',
  },
  {
    component: 'Input',
    fieldName: 'serial_no',
    label: '序号',
  },
  {
    component: 'Input',
    fieldName: 'dept_code',
    label: '部门代码',
  },
  {
    component: 'Input',
    fieldName: 'dept_name',
    label: '部门名称',
  },
  {
    component: 'Input',
    fieldName: 'bureau',
    label: '用人司局',
  },
  {
    component: 'Input',
    fieldName: 'org_nature',
    label: '机构性质',
  },
  {
    component: 'Input',
    fieldName: 'org_level',
    label: '机构层级',
  },
  {
    component: 'Input',
    fieldName: 'position_name',
    label: '职位名称',
  },
  {
    component: 'Input',
    fieldName: 'position_attr',
    label: '职位属性',
  },
  {
    component: 'Input',
    fieldName: 'region',
    label: '所属地区',
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
    fieldName: 'exam_category',
    label: '考试类别',
  },
  {
    component: 'InputNumber',
    fieldName: 'recruit_num',
    label: '招考人数',
  },
  {
    component: 'Input',
    fieldName: 'recruit_scope',
    label: '招考范围',
  },
  {
    component: 'Input',
    fieldName: 'education',
    label: '学历',
  },
  {
    component: 'Input',
    fieldName: 'degree',
    label: '学位',
  },
  {
    component: 'Input',
    fieldName: 'politics',
    label: '政治面貌',
  },
  {
    component: 'Textarea',
    fieldName: 'major',
    label: '专业',
  },
  {
    component: 'Textarea',
    fieldName: 'other_requirement',
    label: '其他条件',
  },
];
