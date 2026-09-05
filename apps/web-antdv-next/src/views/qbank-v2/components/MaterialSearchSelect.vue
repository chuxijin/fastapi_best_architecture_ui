<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';

import { useDebounceFn } from '@vueuse/core';
import { Select } from 'antdv-next';

import {
  getMaterialApi,
  qbankV2GetMaterialListApi,
} from '#/api/qbank-v2/material';

interface MaterialOption {
  code?: string;
  id: number;
  title?: string;
}

interface Props {
  allowClear?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value?: null | number;
}

const props = withDefaults(defineProps<Props>(), {
  allowClear: true,
  disabled: false,
  placeholder: '输入名称或编码搜索材料',
  value: null,
});

const emit = defineEmits<{
  change: [value: null | number];
  'update:value': [value: null | number];
}>();

const loading = ref(false);
const options = ref<
  Array<{ label: string; material: MaterialOption; value: number }>
>([]);

const innerValue = computed({
  get: () => props.value ?? undefined,
  set: (val) => {
    emit('update:value', val ?? null);
  },
});

function formatMaterialLabel(item: MaterialOption) {
  const title = item.title || `材料 ${item.id}`;
  return `${title} · ${item.code || `ID ${item.id}`}`;
}

async function searchMaterials(keyword?: string) {
  loading.value = true;
  try {
    const response: any = await qbankV2GetMaterialListApi({
      keyword: keyword?.trim() || undefined,
      size: 100,
    });
    const items =
      (Array.isArray(response) ? response : undefined) ||
      response?.items ||
      (Array.isArray(response?.data) ? response.data : []);
    options.value = items.map((item: any) => ({
      label: formatMaterialLabel(item as MaterialOption),
      material: item as MaterialOption,
      value: Number(item.id),
    }));
  } catch {
    options.value = [];
  } finally {
    loading.value = false;
  }
}

const debouncedSearch = useDebounceFn((val: string) => {
  void searchMaterials(val);
}, 300);

async function ensureSelectedOption(materialId?: null | number) {
  if (!materialId) return;
  if (options.value.some((item) => item.value === materialId)) return;
  try {
    const detail: any = await getMaterialApi(materialId);
    const pseudoItem: MaterialOption = {
      code: detail?.code,
      id: materialId,
      title:
        detail?.revision?.title ||
        detail?.title ||
        detail?.current_revision_title ||
        `材料 ${materialId}`,
    };
    options.value = [
      {
        label: formatMaterialLabel(pseudoItem),
        material: pseudoItem,
        value: materialId,
      },
      ...options.value,
    ];
  } catch {
    // 拉取选中材料详情失败时保留现有选项
  }
}

watch(
  () => props.value,
  (val) => {
    void ensureSelectedOption(val);
  },
  { immediate: true },
);

function handleChange(value: any) {
  const normalized = typeof value === 'number' ? value : null;
  emit('update:value', normalized);
  emit('change', normalized);
}

function handleSearch(val: string) {
  debouncedSearch(val);
}

function handleDropdownOpenChange(open: boolean) {
  if (open && options.value.length === 0) {
    void searchMaterials();
  }
}

function renderOption({ option }: { option: any }) {
  const material =
    (option?.data?.material as MaterialOption | undefined) ??
    (option?.material as MaterialOption | undefined) ??
    options.value.find((item) => item.value === option?.value)?.material;
  return h('div', { class: 'flex flex-col' }, [
    h('span', { class: 'font-medium' }, material?.title || option?.label),
    h(
      'span',
      { class: 'text-xs text-muted-foreground' },
      material ? `${material.code || '无编码'} · ID ${material.id}` : '',
    ),
  ]);
}

defineExpose({
  searchMaterials,
});
</script>

<template>
  <Select
    v-model:value="innerValue"
    :allow-clear="props.allowClear"
    :disabled="props.disabled"
    :filter-option="false"
    :loading="loading"
    :option-render="renderOption"
    :options="options"
    :placeholder="props.placeholder"
    show-search
    @change="handleChange"
    @dropdown-visible-change="handleDropdownOpenChange"
    @search="handleSearch"
  />
</template>
