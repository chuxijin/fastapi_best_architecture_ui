import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import type {
  MyDriveSpace,
  MyDriveSyncRuleSet,
} from '#/api';

const providerLabels: Record<string, string> = {
  baidu: '百度网盘',
  quark: '夸克网盘',
  thunder: '迅雷网盘',
};

const spaceTypeLabels: Record<string, string> = {
  friend: '好友分享',
  group: '群组分享',
  personal: '个人空间',
  share_link: '分享链接',
};

function getProviderLabel(provider: string): string {
  return providerLabels[provider] || provider;
}

function getSpaceTypeLabel(spaceType: string): string {
  return spaceTypeLabels[spaceType] || spaceType;
}

export const syncConfigQuerySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { placeholder: '请输入同步名称' },
    fieldName: 'name',
    label: '同步名称',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '全量同步', value: 'full' },
        { label: '增量同步', value: 'incremental' },
        { label: '覆盖同步', value: 'overwrite' },
      ],
      placeholder: '请选择同步方式',
    },
    fieldName: 'sync_method',
    label: '同步方式',
  },
];

export function createSyncConfigFormSchema(
  spaces: MyDriveSpace[],
  ruleSets: MyDriveSyncRuleSet[],
): VbenFormSchema[] {
  const spaceOptions = spaces.map((space) => ({
    label: `${space.name} · ${getProviderLabel(space.provider)} · ${getSpaceTypeLabel(space.space_type)}`,
    value: space.id,
  }));

  return [
    {
      component: 'Input',
      componentProps: { maxlength: 128, placeholder: '例如：百度课程备份' },
      fieldName: 'name',
      label: '同步名称',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: { options: spaceOptions, placeholder: '选择来源空间' },
      fieldName: 'source_space_id',
      label: '来源文件空间',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: spaceOptions,
        placeholder: '选择目标个人空间',
      },
      fieldName: 'target_space_id',
      label: '目标个人空间',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '/' },
      defaultValue: '/',
      fieldName: 'source_path',
      label: '来源目录',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '/' },
      defaultValue: '/',
      fieldName: 'target_path',
      label: '目标目录',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '增量：保留目标已有内容', value: 'incremental' },
          { label: '全量：删除目标多余内容', value: 'full' },
          { label: '覆盖：先清空目标再同步', value: 'overwrite' },
        ],
      },
      defaultValue: 'incremental',
      fieldName: 'sync_method',
      label: '同步模式',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: ruleSets
          .filter((ruleSet) => ruleSet.is_enabled)
          .map((ruleSet) => ({ label: ruleSet.name, value: ruleSet.id })),
        placeholder: '不使用规则集',
      },
      fieldName: 'rule_set_id',
      label: '规则集',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '例如：0 0 * * *' },
      fieldName: 'cron',
      label: 'Cron 表达式',
    },
  ];
}

export function createSyncConfigColumns(
  describeSpace: (spaceId: number) => string,
): VxeGridProps['columns'] {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: '同步名称', minWidth: 160 },
    {
      field: 'source_space_id',
      title: '网盘类型',
      slots: { default: 'space_type' },
      width: 150,
    },
    {
      field: 'source_space_id',
      title: '来源',
      minWidth: 220,
      formatter: ({ cellValue, row }) =>
        `${describeSpace(cellValue)}${row.source_path}`,
    },
    {
      field: 'target_space_id',
      title: '目标',
      minWidth: 220,
      formatter: ({ cellValue, row }) =>
        `${describeSpace(cellValue)}${row.target_path}`,
    },
    {
      field: 'sync_method',
      title: '同步模式',
      width: 120,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'orange', label: '全量', value: 'full' },
          { color: 'blue', label: '增量', value: 'incremental' },
          { color: 'red', label: '覆盖', value: 'overwrite' },
        ],
      },
    },
    {
      field: 'is_enabled',
      title: '状态',
      slots: { default: 'is_enabled' },
      width: 90,
    },
    {
      field: 'execution_status',
      title: '执行状态',
      slots: { default: 'execution_status' },
      width: 120,
    },
    {
      field: 'last_synced_at',
      title: '最近同步',
      width: 180,
      formatter: ({ cellValue }) => cellValue || '尚未同步',
    },
    {
      field: 'operation',
      title: '操作',
      fixed: 'right',
      slots: { default: 'operation' },
      width: 330,
    },
  ];
}

export function createSyncTaskColumns(
  getConfigName: (configId: number) => string,
): VxeGridProps['columns'] {
  return [
    { field: 'id', title: '任务 ID', width: 90 },
    {
      field: 'config_id',
      title: '同步配置',
      minWidth: 160,
      formatter: ({ cellValue }) => getConfigName(cellValue),
    },
    {
      field: 'status',
      title: '状态',
      slots: { default: 'status' },
      width: 110,
    },
    {
      field: 'statistics',
      title: '执行统计',
      slots: { default: 'statistics' },
      minWidth: 200,
    },
    { field: 'error_message', title: '错误信息', minWidth: 180 },
    { field: 'created_time', title: '创建时间', width: 180 },
    {
      field: 'operation',
      title: '操作',
      slots: { default: 'operation' },
      width: 150,
    },
  ];
}
