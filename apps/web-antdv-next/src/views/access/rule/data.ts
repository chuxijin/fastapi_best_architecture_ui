import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { AccessTrialPolicy } from '#/api/access';

import { h } from 'vue';

import { Tag } from 'ant-design-vue';

import { getSysCategoryTreeApi } from '#/api/category';
import { getCollectionCatalogApi } from '#/api/qbank-v2/catalog';
import { getBankApi, qbankV2GetBankListApi } from '#/api/qbank-v2/bank';

export const RESOURCE_TYPE_OPTIONS = [
  { label: '题库 (qbank)', value: 'qbank' },
  { label: '合集 (qbank_collection)', value: 'qbank_collection' },
  { label: '内容 (content)', value: 'content' },
  { label: '视频 (video)', value: 'video' },
  { label: '直播 (live)', value: 'live' },
  { label: '分类 (category)', value: 'category' },
];

export const GRANT_MODE_OPTIONS = [
  { label: '订阅准入 (access)', value: 'access' },
  { label: '计量配额 (metered)', value: 'metered' },
  { label: '限免 (free_pass)', value: 'free_pass' },
];

/**
 * 试看策略模式
 *
 * 试看不是权益凭证, 无需给用户发放任何 entitlement,
 * 直接挂在资源规则上作为"未命中权益时的降级放行策略"。
 */
export const TRIAL_MODE_OPTIONS = [
  { label: '按量试刷 (ordinal) — 前 N 个子资源免费', value: 'ordinal' },
  { label: '按比例试看 (fraction) — 前 X% 免费', value: 'fraction' },
  { label: '按篇试看 (excerpt) — 只展示前 N 字', value: 'excerpt' },
  { label: '按日体验 (daily_count) — 每日 N 次', value: 'daily_count' },
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

const RESOLVABLE_TYPES = new Set(['category', 'qbank', 'qbank_collection']);

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
    if (type === 'qbank_collection') {
      const catalog = await getCollectionCatalogApi();
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
      walk(catalog || [], 0);
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

/** 按关键词远程搜索题库(V2 接口), 用于新建规则时按名称定位 */
export async function searchBankOptions(
  keyword: string,
): Promise<ResourceOption[]> {
  const res = await qbankV2GetBankListApi({
    keyword: keyword?.trim() || undefined,
    page: 1,
    size: 20,
  });
  return (res?.items || []).map((b) => ({
    label: `${b.name} (#${b.id})`,
    value: b.id,
  }));
}

// 题库远程搜索回调由 RuleEditor 注入(内部需访问表单 api 更新 options)
let bankSearchHandler: ((keyword: string) => Promise<unknown>) | undefined;
export function registerBankSearchHandler(
  fn: (keyword: string) => Promise<unknown>,
) {
  bankSearchHandler = fn;
}

export function handleBankSearch(keyword: string) {
  if (bankSearchHandler) {
    void bankSearchHandler(keyword);
  }
}

export async function enrichResourceNames<
  T extends { resource_id: number; resource_type: string },
>(rows: T[]): Promise<Array<T & { _resource_name: string }>> {
  // 题库数量多, 按 ID 单查反查名称(并行), 不走全量加载
  const bankIds = [
    ...new Set(
      rows.filter((r) => r.resource_type === 'qbank').map((r) => r.resource_id),
    ),
  ];
  const bankNameById = new Map<number, string>();
  if (bankIds.length > 0) {
    const banks = await Promise.all(
      bankIds.map((id) =>
        getBankApi(id)
          .then((b) => ({ id, name: b.current_revision?.name || b.code }))
          .catch(() => null),
      ),
    );
    banks.forEach((b) => {
      if (b) bankNameById.set(b.id, b.name);
    });
  }

  const otherTypes = [
    ...new Set(rows.map((r) => r.resource_type)),
  ].filter((t) => t !== 'qbank' && RESOLVABLE_TYPES.has(t));
  await Promise.all(otherTypes.map((t) => loadResourceOptions(t)));

  return rows.map((row) => {
    if (row.resource_type === 'qbank') {
      return { ...row, _resource_name: bankNameById.get(row.resource_id) ?? '' };
    }
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
        if (type === 'qbank') {
          // 题库远程搜索: options 由 RuleEditor 通过 updateSchema 注入,
          // 这里不返回 options 字段, 避免 dependencies 覆盖 updateSchema 的结果
          return {
            allowClear: true,
            filterOption: false,
            showSearch: true,
            onSearch: (val: string) => handleBankSearch(val),
            placeholder: '输入题库名称/编码搜索',
            popupMatchSelectWidth: 480,
            style: { width: '100%' },
          };
        }
        const options = await loadResourceOptions(type);
        return {
          allowClear: true,
          options,
          optionFilterProp: 'label',
          placeholder: `请选择${RESOURCE_TYPE_LABEL[type] ?? '资源'}`,
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
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: TRIAL_MODE_OPTIONS,
      placeholder: '不配置表示该资源不可试看',
    },
    fieldName: 'trial_mode',
    label: '试看策略',
    help: '试看是未付费用户的体验策略，不需要给用户发放任何权益凭证',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 1,
      placeholder: '前 N 个子资源 / 每日 N 次',
      style: { width: '100%' },
    },
    fieldName: 'trial_limit',
    label: '试看次数',
    rules: 'required',
    dependencies: {
      if(values: any) {
        return ['daily_count', 'ordinal'].includes(values.trial_mode);
      },
      triggerFields: ['trial_mode'],
    },
  },
  {
    component: 'InputNumber',
    componentProps: {
      max: 1,
      min: 0.01,
      placeholder: '0.1 表示放行前 10%',
      step: 0.05,
      style: { width: '100%' },
    },
    fieldName: 'trial_ratio',
    label: '试看比例',
    rules: 'required',
    dependencies: {
      if(values: any) {
        return values.trial_mode === 'fraction';
      },
      triggerFields: ['trial_mode'],
    },
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 1,
      placeholder: '可见字数，如 300',
      style: { width: '100%' },
    },
    fieldName: 'trial_chars',
    label: '可见字数',
    rules: 'required',
    dependencies: {
      if(values: any) {
        return values.trial_mode === 'excerpt';
      },
      triggerFields: ['trial_mode'],
    },
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
    component: 'Select',
    componentProps: {
      allowClear: true,
      options: TRIAL_MODE_OPTIONS,
      placeholder: '不配置表示该资源不可试看',
    },
    fieldName: 'trial_mode',
    label: '试看策略',
    help: '试看是未付费用户的体验策略，不需要给用户发放任何权益凭证',
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 1,
      placeholder: '前 N 个子资源 / 每日 N 次',
      style: { width: '100%' },
    },
    fieldName: 'trial_limit',
    label: '试看次数',
    rules: 'required',
    dependencies: {
      if(values: any) {
        return ['daily_count', 'ordinal'].includes(values.trial_mode);
      },
      triggerFields: ['trial_mode'],
    },
  },
  {
    component: 'InputNumber',
    componentProps: {
      max: 1,
      min: 0.01,
      placeholder: '0.1 表示放行前 10%',
      step: 0.05,
      style: { width: '100%' },
    },
    fieldName: 'trial_ratio',
    label: '试看比例',
    rules: 'required',
    dependencies: {
      if(values: any) {
        return values.trial_mode === 'fraction';
      },
      triggerFields: ['trial_mode'],
    },
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 1,
      placeholder: '可见字数，如 300',
      style: { width: '100%' },
    },
    fieldName: 'trial_chars',
    label: '可见字数',
    rules: 'required',
    dependencies: {
      if(values: any) {
        return values.trial_mode === 'excerpt';
      },
      triggerFields: ['trial_mode'],
    },
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
  qbank_collection: '合集',
  content: '内容',
  video: '视频',
  live: '直播',
  category: '分类',
};

const RESOURCE_TYPE_COLOR: Record<string, string> = {
  qbank: 'geekblue',
  qbank_collection: 'cyan',
  content: 'purple',
  video: 'cyan',
  live: 'magenta',
  category: 'gold',
};

const GRANT_MODE_LABEL: Record<string, string> = {
  access: '订阅准入',
  free_pass: '限免',
  metered: '计量配额',
};

const GRANT_MODE_COLOR: Record<string, string> = {
  access: 'blue',
  free_pass: 'green',
  metered: 'orange',
};

const TRIAL_MODE_LABEL: Record<string, string> = {
  daily_count: '按日体验',
  excerpt: '按篇试看',
  fraction: '按比例试看',
  ordinal: '按量试刷',
};

/** 把试看策略渲染成一句人话, 供列表列展示 */
export function formatTrialPolicy(
  policy: null | Record<string, unknown> | undefined,
): string {
  if (!policy || !policy.mode) return '';
  const mode = String(policy.mode);
  const label = TRIAL_MODE_LABEL[mode] || mode;
  switch (mode) {
    case 'daily_count': {
      return `${label} · 每日 ${policy.limit} 次`;
    }
    case 'excerpt': {
      return `${label} · 前 ${policy.chars} 字`;
    }
    case 'fraction': {
      return `${label} · 前 ${Number(policy.ratio) * 100}%`;
    }
    case 'ordinal': {
      return `${label} · 前 ${policy.limit} 个`;
    }
    default: {
      return label;
    }
  }
}

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
      field: 'trial_policy',
      title: '试看策略',
      minWidth: 190,
      slots: {
        default: ({ row }: any) => {
          const text = formatTrialPolicy(row.trial_policy);
          if (!text) {
            return h('span', { style: 'color: rgba(0,0,0,0.25);' }, '不可试看');
          }
          return h(Tag, { color: 'cyan' }, () => text);
        },
      },
    },
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

/** 把表单里的扁平字段收敛成后端要的 trial_policy 对象 */
export function buildTrialPolicy(values: any): AccessTrialPolicy | null {
  const mode = values.trial_mode;
  if (!mode) return null;
  switch (mode) {
    case 'daily_count':
    case 'ordinal': {
      return { mode, limit: values.trial_limit };
    }
    case 'excerpt': {
      return { chars: values.trial_chars, mode };
    }
    case 'fraction': {
      return { mode, ratio: values.trial_ratio };
    }
    default: {
      return null;
    }
  }
}

/** 把后端返回的 trial_policy 摊平成表单字段 */
export function spreadTrialPolicy(
  policy: null | Record<string, any> | undefined,
): Record<string, unknown> {
  return {
    trial_chars: policy?.chars ?? undefined,
    trial_limit: policy?.limit ?? undefined,
    trial_mode: policy?.mode ?? undefined,
    trial_ratio: policy?.ratio ?? undefined,
  };
}
