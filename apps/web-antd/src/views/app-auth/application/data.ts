import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入应用名称',
    },
    fieldName: 'name',
    label: '应用名称',
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
    component: 'Input',
    componentProps: {
      placeholder: '请输入应用名称',
    },
    fieldName: 'name',
    label: '应用名称',
    rules: 'required',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入应用标识',
    },
    fieldName: 'app_key',
    label: '应用标识',
    rules: 'required',
  },
  {
    component: 'Textarea',
    componentProps: {
      placeholder: '请输入应用描述',
      rows: 3,
    },
    fieldName: 'description',
    label: '应用描述',
  },
  {
    component: 'Input',
    componentProps: {
      placeholder: '请输入应用图标URL',
    },
    fieldName: 'icon',
    label: '应用图标',
  },
  {
    component: 'Switch',
    componentProps: {
      checkedChildren: '是',
      unCheckedChildren: '否',
    },
    fieldName: 'is_free',
    label: '是否免费',
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
      field: 'name',
      title: '应用名称',
      minWidth: 150,
    },
    {
      field: 'app_key',
      title: '应用标识',
      minWidth: 120,
    },
    {
      field: 'description',
      title: '应用描述',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'is_free',
      title: '是否免费',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          return h(Tag, {
            color: row.is_free ? 'green' : 'orange',
          }, () => row.is_free ? '免费' : '付费');
        },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) => {
          return h(Tag, {
            color: row.status === 1 ? 'green' : 'red',
          }, () => row.status === 1 ? '启用' : '停用');
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
