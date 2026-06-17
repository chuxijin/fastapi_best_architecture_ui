import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

import { getSysCategoryTreeApi } from '#/api/category';
import { getBankListApi } from '#/api/knowledge-store';

export const RESOURCE_TYPE_OPTIONS = [
  { label: '题库 (qbank)', value: 'qbank' },
  { label: '内容 (content)', value: 'content' },
  { label: '视频 (video)', value: 'video' },
  { label: '直播 (live)', value: 'live' },
  { label: '分类 (category)', value: 'category' },
];

export const GRANT_MODE_OPTIONS = [
  { label: '订阅准入 (access)', value: 'access' },
  { label: '试看 (trial)', value: 'trial' },
  { label: '限免 (free_pass)', value: 'free_pass' },
  { label: '单点购买 (ownership_required)', value: 'ownership_required' },
];

export const RULE_STATUS_OPTIONS = [
  { label: '生效中 (active)', value: 'active' },
  { label: '草稿 (draft)', value: 'draft' },
  { label: '归档 (archived)', value: 'archived' },
];

// =====================================================
// 资源名称解析: 按 resource_type 懒加载,进程内缓存
// content / video / live 当前无管理端列表 API,只保留原始 ID
// =====================================================

type ResourceOption = { label: string; value: number };

const RESOLVABLE_TYPES = new Set(['category', 'qbank']);

const resourceOptionCache = new Map<string, ResourceOption[]>();
const resourceOptionLoading = new Map<string, Promise<ResourceOption[]>>();

export async function loadResourceOptions(
  type: string,
): Promise<ResourceOption[]> {
  if (!RESOLVABLE_TYPES.has(type)) return [];
  if (resourceOptionCache.has(type)) return resourceOptionCache.get(type) ?? [];
  if (resourceOptionLoading.has(type)) {
    return resourceOptionLoading.get(type) ?? [];
  }
  const promise = (async () => {
    let options: ResourceOption[] = [];
    if (type === 'qbank') {
      const banks = await getBankListApi({});
      options = (banks || []).map((b) => ({
        label: `${b.name} (#${b.id})`,
        value: b.id,
      }));
    } else if (type === 'category') {
      const tree = await getSysCategoryTreeApi({ status: true });
      const walk = (nodes: any[], depth: number) => {
        nodes.forEach((n) => {
          const prefix = '— '.repeat(depth);
          options.push({
            label: `${prefix}${n.name} (#${n.id})`,
            value: n.id,
          });
          if (n.children?.length) walk(n.children, depth + 1);
        });
      };
      walk(tree || [], 0);
    }
    resourceOptionCache.set(type, options);
    resourceOptionLoading.delete(type);
    return options;
  })();
  resourceOptionLoading.set(type, promise);
  return promise;
}

export async function enrichResourceNames<
  T extends { resource_id: number; resource_type: string },
>(rows: T[]): Promise<Array<T & { _resource_name: string }>> {
  const types = [...new Set(rows.map((r) => r.resource_type))].filter((t) =>
    RESOLVABLE_TYPES.has(t),
  );
  await Promise.all(types.map((t) => loadResourceOptions(t)));
  return rows.map((row) => {
    const options = resourceOptionCache.get(row.resource_type);
    const match = options?.find((o) => o.value === row.resource_id);
    return { ...row, _resource_name: match?.label ?? '' };
  });
}

export function clearResourceOptionCache(type?: string) {
  if (type) {
    resourceOptionCache.delete(type);
    resourceOptionLoading.delete(type);
  } else {
    resourceOptionCache.clear();
    resourceOptionLoading.clear();
  }
}

export const querySchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: RESOURCE_TYPE_OPTIONS,
      placeholder: '资源类型',
    },
    fieldName: 'resource_type',
    label: '资源类型',
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '资源 ID',
      min: 1,
      style: { width: '100%' },
    },
    fieldName: 'resource_id',
    label: '资源 ID',
  },
  {
    component: 'Input',
    componentProps: { placeholder: '权益编码' },
    fieldName: 'entitlement_code',
    label: '权益编码',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: GRANT_MODE_OPTIONS,
      placeholder: '授权模式',
    },
    fieldName: 'grant_mode',
    label: '授权模式',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: RULE_STATUS_OPTIONS,
      placeholder: '状态',
    },
    fieldName: 'status',
    label: '状态',
  },
];

export const createSchema: VbenFormSchema[] = [
  {
    component: 'Select',
    componentProps: {
      options: RESOURCE_TYPE_OPTIONS,
      placeholder: '请选择资源类型',
    },
    defaultValue: 'qbank',
    fieldName: 'resource_type',
    label: '资源类型',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      optionFilterProp: 'label',
      placeholder: '请选择资源',
      popupMatchSelectWidth: 480,
      showSearch: true,
      style: { width: '100%' },
    },
    fieldName: 'resource_id',
    label: '资源',
    rules: 'required',
    dependencies: {
      componentProps: async (values: any) => {
        const type = values.resource_type;
        if (!RESOLVABLE_TYPES.has(type)) {
          return { options: [] };
        }
        const options = await loadResourceOptions(type);
        return {
          allowClear: true,
          options,
          optionFilterProp: 'label',
          placeholder: `请选择${type === 'qbank' ? '题库' : '分类'}`,
          popupMatchSelectWidth: 480,
          showSearch: true,
          style: { width: '100%' },
        };
      },
      if(values: any) {
        return RESOLVABLE_TYPES.has(values.resource_type);
      },
      triggerFields: ['resource_type'],
    },
  },
  {
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入资源 ID (该类型暂无名称查询接口)',
      min: 1,
      style: { width: '100%' },
    },
    fieldName: 'resource_id_raw',
    label: '资源 ID',
    rules: 'required',
    dependencies: {
      if(values: any) {
        return (
          values.resource_type && !RESOLVABLE_TYPES.has(values.resource_type)
        );
      },
      triggerFields: ['resource_type'],
    },
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      optionFilterProp: 'label',
      placeholder: '请选择权益编码',
      popupMatchSelectWidth: 560,
      showSearch: true,
      style: { width: '100%' },
    },
    fieldName: 'entitlement_code',
    label: '权益编码',
    rules: 'required',
  },
  {
    component: 'Select',
    componentProps: {
      options: GRANT_MODE_OPTIONS,
      placeholder: '请选择授权模式',
    },
    defaultValue: 'access',
    fieldName: 'grant_mode',
    label: '授权模式',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 0,
      placeholder: '优先级,数值越大越优先',
      style: { width: '100%' },
    },
    defaultValue: 0,
    fieldName: 'priority',
    label: '优先级',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: '生效开始时间,不选表示立即生效',
      showTime: true,
      style: { width: '100%' },
      valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
    },
    fieldName: 'valid_from',
    label: '生效开始时间',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: '生效结束时间,不选表示永久',
      showTime: true,
      style: { width: '100%' },
      valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
    },
    fieldName: 'valid_to',
    label: '生效结束时间',
  },
  {
    component: 'Switch',
    defaultValue: true,
    fieldName: 'inherit_to_children',
    label: '级联子资源',
  },
];

export const editSchema: VbenFormSchema[] = [
  {
    component: 'Input',
    componentProps: { disabled: true },
    fieldName: 'resource_type',
    label: '资源类型',
    help: '创建后不可修改',
  },
  {
    component: 'Input',
    componentProps: { disabled: true },
    fieldName: 'resource_display',
    label: '资源',
    help: '创建后不可修改',
  },
  {
    component: 'Input',
    componentProps: { disabled: true },
    fieldName: 'entitlement_code',
    label: '权益编码',
    help: '创建后不可修改',
  },
  {
    component: 'Select',
    componentProps: {
      options: GRANT_MODE_OPTIONS,
    },
    fieldName: 'grant_mode',
    label: '授权模式',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, style: { width: '100%' } },
    fieldName: 'priority',
    label: '优先级',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: '生效开始时间,不选表示立即生效',
      showTime: true,
      style: { width: '100%' },
      valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
    },
    fieldName: 'valid_from',
    label: '生效开始时间',
  },
  {
    component: 'DatePicker',
    componentProps: {
      placeholder: '生效结束时间,不选表示永久',
      showTime: true,
      style: { width: '100%' },
      valueFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
    },
    fieldName: 'valid_to',
    label: '生效结束时间',
  },
  {
    component: 'Switch',
    fieldName: 'inherit_to_children',
    label: '级联子资源',
  },
  {
    component: 'Select',
    componentProps: { options: RULE_STATUS_OPTIONS },
    fieldName: 'status',
    label: '状态',
  },
];

const RESOURCE_TYPE_LABEL: Record<string, string> = {
  qbank: '题库',
  content: '内容',
  video: '视频',
  live: '直播',
  category: '分类',
};

const RESOURCE_TYPE_COLOR: Record<string, string> = {
  qbank: 'geekblue',
  content: 'purple',
  video: 'cyan',
  live: 'magenta',
  category: 'gold',
};

const GRANT_MODE_LABEL: Record<string, string> = {
  access: '订阅准入',
  trial: '试看',
  free_pass: '限免',
  ownership_required: '单点购买',
};

const GRANT_MODE_COLOR: Record<string, string> = {
  access: 'blue',
  trial: 'orange',
  free_pass: 'green',
  ownership_required: 'purple',
};

const STATUS_LABEL: Record<string, string> = {
  active: '生效中',
  archived: '已归档',
  draft: '草稿',
};

const STATUS_COLOR: Record<string, string> = {
  active: 'green',
  archived: 'default',
  draft: 'orange',
};

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridPropTypes.Columns {
  return [
    { type: 'checkbox', width: 60 },
    { field: 'id', title: 'ID', width: 80 },
    {
      field: 'resource_type',
      title: '资源类型',
      width: 110,
      slots: {
        default: ({ row }: any) =>
          h(
            Tag,
            { color: RESOURCE_TYPE_COLOR[row.resource_type] || 'default' },
            () => RESOURCE_TYPE_LABEL[row.resource_type] || row.resource_type,
          ),
      },
    },
    {
      field: 'resource_id',
      title: '资源',
      minWidth: 220,
      slots: {
        default: ({ row }: any) => {
          const name: string = row._resource_name || '';
          if (name) {
            return h('div', { style: 'line-height: 1.4;' }, [
              h(
                'div',
                { style: 'font-weight: 500; color: rgba(0,0,0,0.85);' },
                name,
              ),
            ]);
          }
          return h(
            'span',
            { style: 'color: rgba(0,0,0,0.45);' },
            `#${row.resource_id}`,
          );
        },
      },
    },
    { field: 'entitlement_code', title: '权益编码', minWidth: 200 },
    {
      field: 'grant_mode',
      title: '授权模式',
      width: 130,
      slots: {
        default: ({ row }: any) =>
          h(
            Tag,
            { color: GRANT_MODE_COLOR[row.grant_mode] || 'default' },
            () => GRANT_MODE_LABEL[row.grant_mode] || row.grant_mode,
          ),
      },
    },
    { field: 'priority', title: '优先级', width: 90 },
    {
      field: 'valid_period',
      title: '生效区间',
      minWidth: 280,
      formatter: ({ row }: any) => {
        const period = row.valid_period;
        if (!period || (!period.valid_from && !period.valid_to)) return '永久';
        const from = period.valid_from
          ? new Date(period.valid_from).toLocaleString()
          : '立即';
        const to = period.valid_to
          ? new Date(period.valid_to).toLocaleString()
          : '永久';
        return `${from} ~ ${to}`;
      },
    },
    {
      field: 'inherit_to_children',
      title: '级联子资源',
      width: 110,
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: row.inherit_to_children ? 'blue' : 'default' }, () =>
            row.inherit_to_children ? '是' : '否',
          ),
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }: any) =>
          h(
            Tag,
            { color: STATUS_COLOR[row.status] || 'default' },
            () => STATUS_LABEL[row.status] || row.status,
          ),
      },
    },
    {
      field: 'created_time',
      title: '创建时间',
      width: 170,
      formatter: ({ cellValue }) =>
        cellValue ? new Date(cellValue).toLocaleString() : '-',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: {
        default: ({ row }: any) => [
          h(
            'a',
            {
              style: { color: '#1677ff', marginRight: '12px' },
              onClick: () => onActionClick({ code: 'edit', row }),
            },
            '编辑',
          ),
          h(
            'a',
            {
              style: { color: '#ff4d4f' },
              onClick: () => onActionClick({ code: 'delete', row }),
            },
            '删除',
          ),
        ],
      },
    },
  ];
}
