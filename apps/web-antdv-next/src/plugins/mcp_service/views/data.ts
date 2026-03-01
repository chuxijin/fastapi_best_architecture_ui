import type { VxeGridPropTypes } from '@vben/plugins/vxe-table';

import type { McpConfigItem } from '#/plugins/mcp_service/api';

import { h } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { Button, Tooltip } from 'ant-design-vue';

const EditIcon = createIconifyIcon('material-symbols:edit-outline');
const DeleteIcon = createIconifyIcon('material-symbols:delete-outline');

export const useColumns = (
  onActionClick: (params: { code: string; row: McpConfigItem }) => void,
): VxeGridPropTypes.Columns<McpConfigItem> => [
  { type: 'checkbox', width: 50, fixed: 'left' },
  { title: 'ID', field: 'id', width: 90, fixed: 'left' },
  { title: 'MCP 名称', field: 'mcp', width: 180 },
  { title: '字段', field: 'field', width: 180 },
  {
    title: '值',
    field: 'value',
    minWidth: 280,
    showOverflow: 'tooltip',
    slots: {
      default: ({ row }: any) => {
        const text = JSON.stringify(row.value ?? {}, null, 0);
        const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
        return h(Tooltip, { title: text }, () =>
          h('code', { class: 'text-xs' }, preview),
        );
      },
    },
  },
  {
    title: '操作',
    width: 200,
    fixed: 'right',
    slots: {
      default: ({ row }: any) => [
        h(
          Button,
          {
            type: 'primary',
            size: 'small',
            class: 'mr-2',
            icon: h(EditIcon),
            onClick: () => onActionClick({ code: 'edit', row }),
          },
          () => '编辑',
        ),
        h(
          Button,
          {
            type: 'primary',
            danger: true,
            size: 'small',
            icon: h(DeleteIcon),
            onClick: () => onActionClick({ code: 'delete', row }),
          },
          () => '删除',
        ),
      ],
    },
  },
];
