import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入设备名称',
    },
    fieldName: 'device_name',
    label: '设备名称',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: [
        { label: '在线', value: 1 },
        { label: '离线', value: 0 },
      ],
      placeholder: '请选择状态',
    },
    fieldName: 'status',
    label: '状态',
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入设备ID',
    },
    fieldName: 'device_id',
    label: '设备ID',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入设备名称',
    },
    fieldName: 'device_name',
    label: '设备名称',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入设备类型',
    },
    fieldName: 'device_type',
    label: '设备类型',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入操作系统信息',
    },
    fieldName: 'os_info',
    label: '操作系统',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入IP地址',
    },
    fieldName: 'ip_address',
    label: 'IP地址',
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
      field: 'device_id',
      title: '设备ID',
      minWidth: 200,
      slots: {
        default: ({ row }: any) => [
          h('span', {
            style: { fontFamily: 'monospace', fontSize: '14px' },
          }, row.device_id),
        ],
      },
    },
    {
      field: 'device_name',
      title: '设备名称',
      minWidth: 150,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'device_type',
      title: '设备类型',
      width: 120,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'os_info',
      title: '操作系统',
      minWidth: 150,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'ip_address',
      title: 'IP地址',
      width: 140,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          return h(Tag, {
            color: row.status === 1 ? 'green' : 'red',
          }, () => row.status === 1 ? '在线' : '离线');
        },
      },
    },
    {
      field: 'first_seen',
      title: '首次发现',
      width: 180,
      formatter: ({ cellValue }) => {
        return new Date(cellValue).toLocaleString();
      },
    },
    {
      field: 'last_seen',
      title: '最后活跃',
      width: 180,
      formatter: ({ cellValue }) => {
        return cellValue ? new Date(cellValue).toLocaleString() : '-';
      },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => [
          h('a', {
            onClick: () => onActionClick({ code: 'view', row }),
          }, '查看'),
          h('a', {
            style: { marginLeft: '8px' },
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
