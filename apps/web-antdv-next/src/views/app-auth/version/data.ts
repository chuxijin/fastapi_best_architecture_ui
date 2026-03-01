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
        { label: '启用', value: 1 },
        { label: '停用', value: 0 },
      ],
      placeholder: '请选择状态',
    },
    fieldName: 'status',
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
      placeholder: '请输入版本名称',
    },
    fieldName: 'version_name',
    label: '版本名称',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入版本号',
    },
    fieldName: 'version_code',
    label: '版本号',
    rules: 'required',
  },
  {
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入版本描述',
      rows: 3,
    },
    fieldName: 'description',
    label: '版本描述',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入下载地址',
    },
    fieldName: 'download_url',
    label: '下载地址',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入文件大小',
    },
    fieldName: 'file_size',
    label: '文件大小',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入文件哈希',
    },
    fieldName: 'file_hash',
    label: '文件哈希',
  },
  {
    component: 'Switch',
    componentProps: {
      checkedChildren: '是',
      unCheckedChildren: '否',
    },
    fieldName: 'is_force_update',
    label: '强制更新',
  },
];

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
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
      field: 'application_id',
      title: '应用ID',
      width: 100,
    },
    {
      field: 'version_name',
      title: '版本名称',
      minWidth: 150,
    },
    {
      field: 'version_code',
      title: '版本号',
      width: 120,
      slots: {
        default: ({ row }) => [
          h(
            'span',
            {
              style: { fontFamily: 'monospace', fontSize: '14px' },
            },
            row.version_code,
          ),
        ],
      },
    },
    {
      field: 'description',
      title: '版本描述',
      minWidth: 200,
      showOverflow: 'tooltip',
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'file_size',
      title: '文件大小',
      width: 100,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'is_force_update',
      title: '强制更新',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          return h(
            Tag,
            {
              color: row.is_force_update ? 'red' : 'blue',
            },
            () => (row.is_force_update ? '是' : '否'),
          );
        },
      },
    },
    {
      field: 'is_latest',
      title: '最新版本',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          return h(
            Tag,
            {
              color: row.is_latest ? 'green' : 'default',
            },
            () => (row.is_latest ? '是' : '否'),
          );
        },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          return h(
            Tag,
            {
              color: row.status === 1 ? 'green' : 'red',
            },
            () => (row.status === 1 ? '启用' : '停用'),
          );
        },
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
      field: 'updated_time',
      title: '更新时间',
      width: 180,
      formatter: ({ cellValue }) => {
        return cellValue ? new Date(cellValue).toLocaleString() : '-';
      },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => [
          h(
            'a',
            {
              onClick: () => onActionClick({ code: 'edit', row }),
            },
            '编辑',
          ),
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
