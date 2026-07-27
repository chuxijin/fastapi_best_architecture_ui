import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import type { MyDriveAccount } from '#/api';

import { $t } from '@vben/locales';

const providerOptions = [
  { color: 'blue', label: '百度网盘', value: 'baidu' },
  { color: 'cyan', label: '夸克网盘', value: 'quark' },
  { color: 'purple', label: '迅雷网盘', value: 'thunder' },
];

export const myDriveAccountQuerySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: providerOptions,
      placeholder: '请选择网盘类型',
    },
    fieldName: 'provider',
    label: '网盘类型',
  },
];

export function getProviderOptions() {
  return providerOptions;
}

export function useMyDriveAccountColumns(): VxeGridProps['columns'] {
  return [
    { field: 'id', title: 'ID', width: 80 },
    {
      field: 'avatar_url',
      title: '头像',
      slots: { default: 'avatar' },
      width: 80,
    },
    { field: 'display_name', title: '显示名称', minWidth: 140 },
    { field: 'username', title: '网盘用户名', minWidth: 140 },
    {
      field: 'provider',
      title: '网盘类型',
      cellRender: { name: 'CellTag', options: providerOptions },
      width: 120,
    },
    { field: 'external_account_id', title: '账户标识', minWidth: 160 },
    {
      field: 'quota',
      title: '容量使用',
      slots: { default: 'usage' },
      minWidth: 180,
    },
    {
      field: 'vip_level',
      title: '会员等级',
      slots: { default: 'vip' },
      width: 110,
    },
    {
      field: 'status',
      title: '状态',
      slots: { default: 'status' },
      width: 100,
    },
    { field: 'last_profile_synced_at', title: '最近同步资料', minWidth: 180 },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      fixed: 'right',
      slots: { default: 'operation' },
      width: 240,
    },
  ];
}

export function formatFileSize(size: null | number): string {
  if (!size) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );
  return `${Number.parseFloat((size / 1024 ** index).toFixed(2))} ${units[index]}`;
}

export function getUsagePercent(account: MyDriveAccount): number {
  if (!account.quota || !account.used) return 0;
  return Math.round((account.used / account.quota) * 100);
}
