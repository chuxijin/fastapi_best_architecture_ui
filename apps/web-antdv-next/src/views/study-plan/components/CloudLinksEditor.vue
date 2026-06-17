<script lang="ts" setup>
import type { CloudLinkItem } from '../common';

import { computed } from 'vue';

import { cloudLinkProviderOptions, isValidHttpUrl } from '../common';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    modelValue: CloudLinkItem[];
  }>(),
  { disabled: false },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: CloudLinkItem[]): void;
}>();

const links = computed<CloudLinkItem[]>({
  get: () => props.modelValue ?? [],
  set: (next) => emit('update:modelValue', next),
});

function addLink() {
  links.value = [
    ...links.value,
    { title: '', url: '', password: '', provider: '' },
  ];
}

function removeLink(index: number) {
  const next = [...links.value];
  next.splice(index, 1);
  links.value = next;
}

function updateField(index: number, field: keyof CloudLinkItem, value: string) {
  const next = [...links.value];
  next[index] = { ...next[index], [field]: value } as CloudLinkItem;
  links.value = next;
}

function isUrlValid(url: string): boolean {
  if (!url.trim()) return true;
  return isValidHttpUrl(url);
}
</script>

<template>
  <div class="cloud-links-editor">
    <div v-if="links.length === 0" class="empty-tip">
      暂无链接，点击下方添加第一条网盘资源
    </div>
    <div v-for="(item, index) in links" :key="index" class="link-row">
      <div class="link-row-head">
        <span class="link-row-index">#{{ index + 1 }}</span>
        <a-button
          danger
          size="small"
          type="link"
          :disabled="disabled"
          @click="removeLink(index)"
        >
          删除
        </a-button>
      </div>
      <div class="link-row-grid">
        <a-form-item label="标题" required>
          <a-input
            :value="item.title"
            placeholder="给资源起个名"
            :disabled="disabled"
            @update:value="(v) => updateField(index, 'title', v)"
          />
        </a-form-item>
        <a-form-item
          label="网盘链接"
          required
          :validate-status="isUrlValid(item.url) ? '' : 'error'"
          :help="isUrlValid(item.url) ? '' : '需以 http:// 或 https:// 开头'"
        >
          <a-input
            :value="item.url"
            placeholder="https://pan.baidu.com/s/..."
            :disabled="disabled"
            @update:value="(v) => updateField(index, 'url', v)"
          />
        </a-form-item>
        <a-form-item label="提取码">
          <a-input
            :value="item.password ?? ''"
            placeholder="选填"
            :disabled="disabled"
            @update:value="(v) => updateField(index, 'password', v)"
          />
        </a-form-item>
        <a-form-item label="网盘类型">
          <a-select
            :value="item.provider ?? undefined"
            :options="cloudLinkProviderOptions"
            placeholder="选填"
            allow-clear
            :disabled="disabled"
            @update:value="
              (v: unknown) =>
                updateField(index, 'provider', typeof v === 'string' ? v : '')
            "
          />
        </a-form-item>
      </div>
    </div>
    <a-button block :disabled="disabled" @click="addLink">+ 添加链接</a-button>
  </div>
</template>

<style scoped>
.cloud-links-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-tip {
  padding: 16px;
  font-size: 13px;
  color: #8c8c8c;
  text-align: center;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}

.link-row {
  padding: 12px 12px 0;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.link-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.link-row-index {
  font-size: 13px;
  font-weight: 600;
  color: #595959;
}

.link-row-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}
</style>
