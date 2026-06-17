<script lang="ts" setup>
import type { SysContentListItem } from '#/api/content';

import { onMounted, ref, watch } from 'vue';

import { getSysContentDetailApi, getSysContentListApi } from '#/api/content';

interface ContentOption {
  label: string;
  value: number;
  raw: SysContentListItem;
}

const props = withDefaults(
  defineProps<{
    appCode?: string;
    disabled?: boolean;
    placeholder?: string;
    publishedOnly?: boolean;
    value?: null | number;
  }>(),
  {
    value: null,
    placeholder: '搜索标题或输入 ID',
    appCode: undefined,
    publishedOnly: true,
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:value', value: null | number): void;
  (e: 'change', option: ContentOption | null): void;
}>();

const options = ref<ContentOption[]>([]);
const loading = ref(false);
const innerValue = ref<null | number>(props.value ?? null);
const labelCache = ref<Map<number, string>>(new Map());

let searchTimer: null | ReturnType<typeof setTimeout> = null;

function buildOption(item: SysContentListItem): ContentOption {
  const tags = (item.tags ?? []).slice(0, 2).join('/');
  const tagSuffix = tags ? `  [${tags}]` : '';
  const stateSuffix = item.is_published ? '' : '  [未发布]';
  return {
    label: `#${item.id} · ${item.title}${tagSuffix}${stateSuffix}`,
    value: item.id,
    raw: item,
  };
}

async function loadOptions(keyword?: string) {
  loading.value = true;
  try {
    const params: Record<string, unknown> = { page: 1, size: 20 };
    if (props.appCode) params.app_code = props.appCode;
    if (props.publishedOnly) params.is_published = true;
    if (keyword?.trim()) params.keyword = keyword.trim();

    const page = await getSysContentListApi(params);
    const items = page?.items ?? [];
    options.value = items.map((item) => {
      const option = buildOption(item);
      labelCache.value.set(option.value, option.label);
      return option;
    });
  } finally {
    loading.value = false;
  }
}

async function ensureSelectedLabel(id: number) {
  if (labelCache.value.has(id)) return;
  try {
    const detail = await getSysContentDetailApi(id);
    if (detail?.id) {
      const option = buildOption(detail);
      labelCache.value.set(option.value, option.label);
      const exists = options.value.some((opt) => opt.value === option.value);
      if (!exists) {
        options.value = [option, ...options.value];
      }
    }
  } catch {
    // 详情拿不到（可能被删/未发布），静默兜底，下拉里直接显示 #id
    labelCache.value.set(id, `#${id}`);
  }
}

function handleSearch(keyword: string) {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadOptions(keyword), 300);
}

function handleChange(value: null | number) {
  innerValue.value = value ?? null;
  emit('update:value', innerValue.value);
  const option = options.value.find((opt) => opt.value === value) ?? null;
  emit('change', option);
}

watch(
  () => props.value,
  (next) => {
    innerValue.value = next ?? null;
    if (next !== null) {
      ensureSelectedLabel(next);
    }
  },
);

onMounted(async () => {
  await loadOptions();
  if (innerValue.value !== null) {
    await ensureSelectedLabel(innerValue.value);
  }
});

defineExpose({ refresh: () => loadOptions() });
</script>

<template>
  <a-select
    :value="innerValue"
    :options="options"
    :loading="loading"
    :placeholder="placeholder"
    :disabled="disabled"
    :allow-clear="true"
    :filter-option="false"
    show-search
    style="width: 100%"
    @search="handleSearch"
    @change="handleChange"
  />
</template>
