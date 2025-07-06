import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';

import { $t } from '@vben/locales';
import { DRIVE_TYPE_OPTIONS, DRIVE_TYPE_TAG_OPTIONS, SYNC_METHOD_OPTIONS } from '#/api';

// 同步配置查询表单配置
export const syncConfigQuerySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入备注',
    },
    fieldName: 'remark',
    label: '备注',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        ...DRIVE_TYPE_OPTIONS,
      ],
      placeholder: '请选择网盘类型',
    },
    fieldName: 'type',
    label: '网盘类型',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: true },
        { label: '禁用', value: false },
      ],
      placeholder: '请选择状态',
    },
    fieldName: 'enable',
    label: '状态',
  },
];

// 同步配置表格列配置
export function useSyncConfigColumns(
  onActionClick?: OnActionClickFn<any>,
  onStatusChange?: (row: any, newVal: boolean) => Promise<boolean>,
): VxeGridProps['columns'] {
  return [
    {
      field: 'id',
      title: 'ID',
      width: 80,
      align: 'center',
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'type',
      title: '网盘类型',
      width: 120,
      cellRender: {
        name: 'CellTag',
        options: [...DRIVE_TYPE_TAG_OPTIONS],
      },
    },
    {
      field: 'src_path',
      title: '源路径',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'dst_path',
      title: '目标路径',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'method',
      title: '同步方式',
      width: 120,
      cellRender: {
        name: 'CellTag',
        options: SYNC_METHOD_OPTIONS.map((option, index) => ({
          color: index === 0 ? 'blue' : index === 1 ? 'orange' : 'red',
          label: option.label,
          value: option.value,
        })),
      },
    },
    {
      field: 'enable',
      title: '状态',
      width: 80,
      align: 'center',
      slots: { default: 'enable' },
    },
    {
      field: 'execution_status',
      title: '执行状态',
      width: 120,
      align: 'center',
      slots: { default: 'execution_status' },
    },
    {
      field: 'last_sync',
      title: '最后同步',
      width: 180,
      formatter: ({ row }) => {
        return row.last_sync ? new Date(row.last_sync).toLocaleString() : '未同步';
      },
    },
    {
      field: 'operation',
      title: $t('page.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 280,
      cellRender: {
        attrs: {
          nameField: 'remark',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'execute',
            text: '执行',
            color: 'success',
          },
          'edit',
          {
            code: 'copy',
            text: '复制',
            color: 'primary',
          },
          {
            code: 'logs',
            text: '记录',
          },
          {
            code: 'delete',
            text: '删除',
          },
        ],
      },
    },
  ];
}

// 同步配置表单配置
export const syncConfigFormSchema: VbenFormSchema[] = [
  {
    component: 'Switch',
    fieldName: 'enable',
    label: '启用状态',
    defaultValue: true,
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入备注信息',
    },
    fieldName: 'remark',
    label: '备注',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      options: DRIVE_TYPE_OPTIONS,
      placeholder: '请选择网盘类型',
    },
    fieldName: 'type',
    label: '网盘类型',
    rules: 'required',
  },
  {
    component: 'ApiSelect',
    componentProps: {
      api: async (params: any) => {
        // 这里需要根据网盘类型动态加载账号
        return [];
      },
      placeholder: '请选择关联账号',
    },
    fieldName: 'user_id',
    label: '关联账号',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入或选择源路径',
      readonly: true,
    },
    fieldName: 'src_path',
    label: '源路径',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入或选择目标路径',
      readonly: true,
    },
    fieldName: 'dst_path',
    label: '目标路径',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '增量同步', value: 'incremental' },
        { label: '完全同步', value: 'full' },
        { label: '覆盖同步', value: 'overwrite' },
      ],
      placeholder: '请选择同步方式',
    },
    fieldName: 'method',
    label: '同步方式',
    defaultValue: 'incremental',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '正常速度', value: 0 },
        { label: '慢速', value: 1 },
        { label: '快速', value: 2 },
      ],
      placeholder: '请选择递归速度',
    },
    fieldName: 'speed',
    label: '递归速度',
    defaultValue: 0,
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入Cron表达式（可选）',
    },
    fieldName: 'cron',
    label: '定时执行',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: '请选择截止时间（可选）',
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
    },
    fieldName: 'end_time',
    label: '截止时间',
  },
];
