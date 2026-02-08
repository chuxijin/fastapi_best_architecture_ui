import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeGridProps } from '#/adapter/vxe-table';
import type { CoulddriveDriveAccountDetail } from '#/api';

import { $t } from '@vben/locales';

import { DictEnum, getDictOptions } from '#/api';

// 用户信息查询表单配置
export function getUserInfoFormSchema(
  isEditMode: boolean = false,
): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        options: getDictOptions(DictEnum.DRIVE_TYPE),
        placeholder: '请选择网盘类型',
        disabled: isEditMode, // 编辑模式下禁用网盘类型选择
      },
      fieldName: 'drive_type',
      label: '网盘类型',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入认证令牌',
        type: 'password',
      },
      fieldName: 'auth_token',
      label: '认证令牌',
      rules: 'required',
    },
  ];
}

// 关系列表查询表单配置
export const relationshipQuerySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '好友', value: 'friend' },
        { label: '群组', value: 'group' },
      ],
      placeholder: '请选择关系类型',
    },
    fieldName: 'relationship_type',
    label: '关系类型',
  },
];

// 用户列表查询表单配置
export const userListQuerySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      options: [
        { label: '全部', value: '' },
        ...getDictOptions(DictEnum.DRIVE_TYPE),
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
        { label: '有效', value: true },
        { label: '无效', value: false },
      ],
      placeholder: '请选择有效性',
    },
    fieldName: 'is_valid',
    label: '账号有效性',
  },
];

// 关系列表表格列配置
export function useRelationshipColumns(): VxeGridProps['columns'] {
  return [
    {
      field: 'uname',
      title: '用户名/群名',
      minWidth: 150,
      formatter: ({ row }) => {
        const isGroup = 'gid' in row;
        return isGroup ? row.name : row.uname;
      },
    },
    {
      field: 'nick_name',
      title: '昵称',
      width: 150,
      formatter: ({ row }) => {
        const isGroup = 'gid' in row;
        return isGroup ? '-' : (row as any).nick_name || '-';
      },
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: '好友', value: 'friend' },
          { color: 'green', label: '群组', value: 'group' },
        ],
      },
      formatter: ({ row }) => {
        const isGroup = 'gid' in row;
        return isGroup ? 'group' : 'friend';
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      formatter: ({ row }) => {
        const isGroup = 'gid' in row;
        if (isGroup) {
          return row.status || '-';
        } else {
          return (row as any).is_friend === 1 ? '已添加' : '未添加';
        }
      },
    },
    {
      field: 'id',
      title: 'ID',
      width: 120,
      formatter: ({ row }) => {
        const isGroup = 'gid' in row;
        return isGroup ? row.gid : row.uk.toString();
      },
    },
  ];
}

// 用户列表表格列配置
export function useUserListColumns(
  onActionClick?: OnActionClickFn<CoulddriveDriveAccountDetail>,
): VxeGridProps['columns'] {
  // 格式化文件大小
  function formatFileSize(bytes: null | number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  return [
    {
      field: 'avatar_url',
      title: '头像',
      width: 80,
      slots: { default: 'avatar' },
    },
    {
      field: 'username',
      title: '用户名',
      minWidth: 100,
    },
    {
      field: 'type',
      title: '网盘类型',
      width: 120,
      cellRender: {
        name: 'CellTag',
        options: getDictOptions(DictEnum.DRIVE_TYPE),
      },
    },
    {
      field: 'quota',
      title: '总空间',
      minWidth: 100,
      formatter: ({ row }) => {
        return formatFileSize(row.quota || null);
      },
    },
    {
      field: 'used',
      title: '已使用',
      minWidth: 100,
      formatter: ({ row }) => {
        return formatFileSize(row.used || null);
      },
    },
    {
      field: 'usage_rate',
      title: '使用率',
      minWidth: 150,
      slots: { default: 'usage' },
    },
    {
      field: 'is_vip',
      title: 'VIP状态',
      width: 110,
      slots: { default: 'vip' },
    },
    {
      field: 'is_valid',
      title: '账号状态',
      width: 90,
      slots: { default: 'status' },
    },
    {
      field: 'created_time',
      title: '创建时间',
      minWidth: 160,
      formatter: ({ row }) => {
        return new Date(row.created_time).toLocaleString();
      },
    },
    {
      field: 'operation',
      title: $t('common.table.operation'),
      align: 'center',
      fixed: 'right',
      width: 200,
      cellRender: {
        attrs: {
          nameField: 'username',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'refresh',
            text: '刷新',
          },
          {
            code: 'edit',
            text: '编辑',
          },
          {
            code: 'relationship',
            text: '关系',
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
