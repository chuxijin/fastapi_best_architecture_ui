import type { VbenFormSchema } from '@vben/common-ui';

import type { OnActionClickParams, VxeGridProps } from '#/adapter/vxe-table';
import type { SensitiveWordResult } from '#/api/sensitive-word';

import { h } from 'vue';

import { Tag } from 'antdv-next';

export const ACTION_OPTIONS = [
  { label: '替换', value: 'replace' },
  { label: '屏蔽打码', value: 'block' },
  { label: '拦截拒绝', value: 'reject' },
];

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'keyword',
    label: '关键词',
    componentProps: {
      placeholder: '敏感词',
    },
  },
  {
    component: 'Select',
    fieldName: 'action',
    label: '处理方式',
    componentProps: {
      options: ACTION_OPTIONS,
      allowClear: true,
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '状态',
    componentProps: {
      options: [
        { label: '启用', value: 'active' },
        { label: '停用', value: 'disabled' },
      ],
      allowClear: true,
    },
  },
];

export const schema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'word',
    label: '敏感词',
    rules: 'required',
    componentProps: {
      placeholder: '如：政府',
    },
  },
  {
    component: 'Select',
    fieldName: 'action',
    label: '处理方式',
    defaultValue: 'replace',
    componentProps: {
      options: ACTION_OPTIONS,
    },
  },
  {
    component: 'Select',
    fieldName: 'variants',
    label: '变体词库',
    componentProps: {
      mode: 'tags',
      placeholder: '输入拼音/谐音/缩写后回车，如 zf、zhèngfǔ',
      tokenSeparators: [',', '，'],
    },
  },
  {
    component: 'Input',
    fieldName: 'replacement',
    label: '替换词',
    componentProps: {
      placeholder: '替换模式必填，如：ZF',
    },
  },
  {
    component: 'RadioGroup',
    fieldName: 'status',
    label: '状态',
    defaultValue: 'active',
    componentProps: {
      options: [
        { label: '启用', value: 'active' },
        { label: '停用', value: 'disabled' },
      ],
    },
  },
  {
    component: 'Input',
    fieldName: 'remark',
    label: '备注',
  },
];

export function useColumns(
  onActionClick: (params: OnActionClickParams<SensitiveWordResult>) => void,
): VxeGridProps['columns'] {
  return [
    { title: 'ID', field: 'id', width: 60 },
    { title: '敏感词', field: 'word', minWidth: 140 },
    {
      title: '变体数',
      field: 'variants',
      width: 80,
      slots: { default: ({ row }) => String((row.variants ?? []).length) },
    },
    {
      title: '处理方式',
      field: 'action',
      width: 110,
      slots: {
        default: ({ row }) => {
          const map: Record<string, [string, string]> = {
            replace: ['blue', '替换'],
            block: ['orange', '屏蔽打码'],
            reject: ['red', '拦截拒绝'],
          };
          const [color, text] = map[row.action] ?? ['default', row.action];
          return h(Tag, { color }, () => text);
        },
      },
    },
    { title: '替换词', field: 'replacement', width: 120 },
    {
      title: '状态',
      field: 'status',
      width: 80,
      slots: {
        default: ({ row }) => {
          return row.status === 'active'
            ? h(Tag, { color: 'success' }, () => '启用')
            : h(Tag, { color: 'default' }, () => '停用');
        },
      },
    },
    { title: '备注', field: 'remark', minWidth: 120 },
    { title: '创建时间', field: 'created_time', width: 160 },
    {
      title: '操作',
      field: 'action',
      fixed: 'right',
      width: 140,
      slots: {
        default: ({ row }) => {
          return h('div', { class: 'flex gap-2' }, [
            h(
              'a',
              {
                class: 'text-primary cursor-pointer',
                onClick: () => onActionClick({ code: 'edit', row }),
              },
              '编辑',
            ),
            h(
              'a',
              {
                class: 'text-error cursor-pointer',
                onClick: () => onActionClick({ code: 'delete', row }),
              },
              '删除',
            ),
          ]);
        },
      },
    },
  ];
}

/** ============ 命中日志 ============ */

export const hitLogQuerySchema: VbenFormSchema[] = [
  {
    component: 'Input',
    fieldName: 'keyword',
    label: '关键词',
    componentProps: {
      placeholder: '词 / 变体 / 内容摘要',
    },
  },
  {
    component: 'Select',
    fieldName: 'action',
    label: '处理方式',
    componentProps: {
      options: ACTION_OPTIONS,
      allowClear: true,
    },
  },
];

export function useHitLogColumns(): VxeGridProps['columns'] {
  return [
    { title: 'ID', field: 'id', width: 60 },
    { title: '用户 ID', field: 'user_id', width: 80 },
    { title: '敏感词', field: 'word', minWidth: 120 },
    { title: '命中变体', field: 'keyword', minWidth: 120 },
    {
      title: '处理方式',
      field: 'action',
      width: 110,
      slots: {
        default: ({ row }) => {
          const map: Record<string, [string, string]> = {
            replace: ['blue', '替换'],
            block: ['orange', '屏蔽打码'],
            reject: ['red', '拦截拒绝'],
          };
          const [color, text] = map[row.action] ?? ['default', row.action];
          return h(Tag, { color }, () => text);
        },
      },
    },
    { title: '次数', field: 'hit_count', width: 70 },
    { title: '内容类型', field: 'target_type', width: 110 },
    { title: '内容 ID', field: 'target_id', width: 80 },
    { title: '内容摘要', field: 'snippet', minWidth: 200 },
    { title: '命中时间', field: 'created_time', width: 160 },
  ];
}
