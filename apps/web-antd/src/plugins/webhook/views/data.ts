import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridPropTypes } from '@vben/plugins/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

import type { WebhookEvent } from '../api';

// 查询表单配置
export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'event_type',
    label: '事件类型',
    componentProps: {
      placeholder: '请输入事件类型',
    },
  },
  {
    component: 'Input',
    fieldName: 'source',
    label: '事件来源',
    componentProps: {
      placeholder: '请输入事件来源',
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '处理状态',
    componentProps: {
      placeholder: '请选择状态',
      options: [
        { label: '失败', value: 0 },
        { label: '成功', value: 1 },
        { label: '待处理', value: 2 },
      ],
    },
  },
];

// 测试表单配置
export const testSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'event_type',
    label: '事件类型',
    rules: 'required',
    componentProps: {
      placeholder: '例如: user.created',
    },
  },
  {
    component: 'Textarea',
    fieldName: 'data',
    label: '事件数据',
    rules: 'required',
    componentProps: {
      placeholder: '请输入JSON格式的事件数据',
      rows: 6,
    },
  },
];

// 获取状态颜色
const getStatusColor = (status: number) => {
  const colors = { 0: 'red', 1: 'green', 2: 'orange' };
  return colors[status as keyof typeof colors] || 'default';
};

// 获取状态文本
const getStatusText = (status: number) => {
  const texts = { 0: '失败', 1: '成功', 2: '待处理' };
  return texts[status as keyof typeof texts] || '未知';
};

// 表格列配置
export const useColumns = (
  onActionClick: (params: { code: string; row: WebhookEvent }) => void,
): VxeGridPropTypes.Columns<WebhookEvent> => [
  {
    type: 'checkbox',
    width: 50,
  },
  {
    title: 'ID',
    field: 'id',
    width: 80,
  },
  {
    title: '事件类型',
    field: 'event_type',
    width: 150,
  },
  {
    title: '事件来源',
    field: 'source',
    width: 150,
  },
  {
    title: '处理状态',
    field: 'status',
    width: 100,
    cellRender: ({ row }) => {
      return h(Tag, {
        color: getStatusColor(row.status),
      }, () => getStatusText(row.status));
    },
  },
  {
    title: '重试次数',
    field: 'retry_count',
    width: 100,
  },
  {
    title: '事件数据',
    field: 'payload',
    width: 200,
    cellRender: ({ row }) => {
      const text = typeof row.payload === 'string' ? row.payload : JSON.stringify(row.payload);
      return h('div', {
        style: {
          maxWidth: '180px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        title: text,
      }, text);
    },
  },
  {
    title: '创建时间',
    field: 'created_time',
    width: 180,
  },
  {
    title: '操作',
    width: 150,
    fixed: 'right',
    cellRender: ({ row }) => {
      return h('div', { class: 'flex gap-2' }, [
        h('a', {
          class: 'text-blue-500 hover:text-blue-700',
          onClick: () => onActionClick({ code: 'view', row }),
        }, '查看'),
        h('a', {
          class: 'text-red-500 hover:text-red-700',
          onClick: () => onActionClick({ code: 'delete', row }),
        }, '删除'),
      ]);
    },
  },
];
