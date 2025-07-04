import type { VbenFormSchema } from '@vben/common-ui';
import type { VxeGridPropTypes } from '@vben/plugins/vxe-table';

import { h } from 'vue';

import { Tag, Button, Space, Tooltip, message } from 'ant-design-vue';
import { createIconifyIcon } from '@vben/icons';

// 创建图标组件
const ViewIcon = createIconifyIcon('material-symbols:visibility-outline');
const DeleteIcon = createIconifyIcon('material-symbols:delete-outline');
const RetryIcon = createIconifyIcon('material-symbols:refresh-rounded');
const CopyIcon = createIconifyIcon('material-symbols:content-copy-outline');

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

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  // 确保文本中的Unicode转义序列被正确处理
  const processedText = text.replace(/\\u[\dA-F]{4}/gi, (match: string) => {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });

  navigator.clipboard.writeText(processedText).then(() => {
    message.success('复制成功');
  }).catch(() => {
    message.error('复制失败');
  });
};

// 表格列配置
export const useColumns = (
  onActionClick: (params: { code: string; row: WebhookEvent }) => void,
): VxeGridPropTypes.Columns<WebhookEvent> => [
  {
    type: 'checkbox',
    width: 50,
    fixed: 'left',
  },
  {
    title: 'ID',
    field: 'id',
    width: 80,
    fixed: 'left',
  },
  {
    title: '事件类型',
    field: 'event_type',
    width: 180,
    slots: {
      default: ({ row }: any) => {
        return h('div', { class: 'flex items-center gap-2' }, [
          h(Tag, { color: 'blue' }, () => row.event_type),
        ]);
      },
    },
  },
  {
    title: '事件来源',
    field: 'source',
    width: 160,
    slots: {
      default: ({ row }: any) => {
        const text = row.source || '未知';
        return h(Tooltip, { title: text }, () =>
          h('div', {
            style: {
              maxWidth: '140px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }, text)
        );
      },
    },
  },
  {
    title: '处理状态',
    field: 'status',
    width: 120,
    slots: {
      default: ({ row }: any) => {
        return h(Tag, {
          color: getStatusColor(row.status),
        }, () => getStatusText(row.status));
      },
    },
  },
  {
    title: '重试次数',
    field: 'retry_count',
    width: 100,
    slots: {
      default: ({ row }: any) => {
        const color = row.retry_count > 0 ? 'orange' : 'default';
        return h(Tag, { color }, () => row.retry_count.toString());
      },
    },
  },
  {
    title: '错误信息',
    field: 'error_message',
    width: 150,
    slots: {
      default: ({ row }: any) => {
        if (!row.error_message) {
          return h('span', { class: 'text-gray-400' }, '-');
        }
        return h(Tooltip, { title: row.error_message }, () =>
          h('div', {
            style: {
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#ff4d4f',
            },
          }, row.error_message)
        );
      },
    },
  },
  {
    title: '处理时间',
    field: 'processed_at',
    width: 160,
    slots: {
      default: ({ row }: any) => {
        if (!row.processed_at) {
          return h('span', { class: 'text-gray-400' }, '-');
        }
        return h('span', { class: 'text-sm' }, row.processed_at);
      },
    },
  },
  {
    title: '创建时间',
    field: 'created_time',
    width: 160,
    slots: {
      default: ({ row }: any) => {
        return h('span', { class: 'text-sm' }, row.created_time);
      },
    },
  },
  {
    title: '数据预览',
    field: 'payload',
    width: 200,
    slots: {
      default: ({ row }: any) => {
        // 处理payload数据，尝试解析JSON并正确显示Unicode字符
        let text = '';
        try {
          if (typeof row.payload === 'string') {
            // 尝试解析JSON
            const parsedPayload = JSON.parse(row.payload);
            // 重新格式化，确保Unicode字符不被转义
            text = JSON.stringify(parsedPayload);
          } else {
            text = JSON.stringify(row.payload);
          }
        } catch (e) {
          // 如果解析失败，使用原始字符串并尝试解码Unicode
          text = typeof row.payload === 'string'
            ? row.payload.replace(/\\u[\dA-F]{4}/gi, (match: string) =>
                String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)))
            : String(row.payload);
        }

        const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;

        return h('div', { class: 'flex items-center gap-2' }, [
          h(Tooltip, { title: text }, () =>
            h('code', {
              style: {
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                background: '#f5f5f5',
                padding: '2px 4px',
                borderRadius: '2px',
                fontSize: '12px',
              },
            }, preview)
          ),
          h(Button, {
            type: 'text',
            size: 'small',
            icon: h(CopyIcon, { class: 'size-3' }),
            onClick: () => copyToClipboard(text),
          }),
        ]);
      },
    },
  },
  {
    title: '操作',
    width: 280,
    fixed: 'right',
    slots: {
      default: ({ row }: any) => {
        return h(Space, { size: 'small' }, () => [
          h(Tooltip, { title: '查看详情' }, () =>
            h(Button, {
              type: 'primary',
              size: 'small',
              icon: h(ViewIcon, { class: 'size-4' }),
              onClick: () => onActionClick({ code: 'view', row }),
            }, () => '详情')
          ),

                    // 重试按钮（所有状态都显示）
          h(Tooltip, { title: '重试此事件' }, () =>
            h(Button, {
              type: 'default',
              size: 'small',
              icon: h(RetryIcon, { class: 'size-4' }),
              onClick: () => onActionClick({ code: 'retry', row }),
            }, () => '重试')
          ),

          h(Tooltip, { title: '删除此事件' }, () =>
            h(Button, {
              type: 'primary',
              danger: true,
              size: 'small',
              icon: h(DeleteIcon, { class: 'size-4' }),
              onClick: () => onActionClick({ code: 'delete', row }),
            }, () => '删除')
          ),
        ]);
      },
    },
  },
];
