<script lang="ts" setup>
import type { Editor } from '@tiptap/vue-3';

/**
 * 字体颜色工具栏项 - 参考 Halo ColorToolbarItem.vue
 * 点击按钮本体直接应用上次颜色，下拉展开色板
 */
import type { Component } from 'vue';

import ColorPickerDropdown from './ColorPickerDropdown.vue';
import ToolbarButton from './ToolbarButton.vue';

const props = defineProps<{
  disabled?: boolean;
  editor: Editor;
  icon?: Component;
  isActive?: boolean;
  title?: string;
}>();

function handleSetColor(color?: string) {
  if (!color) return;
  props.editor?.chain().focus().setColor(color).run();
}

function handleUnsetColor() {
  props.editor?.chain().focus().unsetColor().run();
}
</script>

<template>
  <ColorPickerDropdown @update:model-value="handleSetColor">
    <ToolbarButton
      :is-active="isActive"
      :disabled="disabled"
      :icon="icon"
      :title="title"
    />
    <template #prefix>
      <div class="color-prefix-item" @click="handleUnsetColor">
        <div class="color-swatch-default" style="background: #000"></div>
        <span class="color-prefix-label">恢复默认</span>
      </div>
    </template>
  </ColorPickerDropdown>
</template>

<style scoped>
.color-prefix-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  margin: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.color-prefix-item:hover {
  background: #f3f4f6;
}

.color-swatch-default {
  width: 20px;
  height: 20px;
  border-radius: 3px;
}

.color-prefix-label {
  font-size: 12px;
  color: #6b7280;
}
</style>
