<script lang="ts" setup>
import type { Editor } from '@tiptap/vue-3';

import type { Component } from 'vue';

/**
 * 高亮颜色工具栏项 - 参考 Halo HighlightToolbarItem.vue
 * 点击按钮本体用上次颜色高亮，下拉展开色板选颜色
 * 记住上次选择的颜色
 */
import { ref } from 'vue';

import ColorPickerDropdown from './ColorPickerDropdown.vue';
import ToolbarButton from './ToolbarButton.vue';

const props = defineProps<{
  disabled?: boolean;
  editor: Editor;
  icon?: Component;
  isActive?: boolean;
  title?: string;
}>();

/** 记住上次选择的颜色（默认黄色高亮） */
const lastColor = ref('#fff8c5');

function handleSetColor(color?: string) {
  const c = color || lastColor.value;
  // 先取消已有高亮
  if (props.editor?.isActive('highlight')) {
    props.editor?.chain().focus().unsetHighlight().run();
  }
  // 设置新颜色高亮
  props.editor?.chain().focus().setHighlight({ color: c }).run();
  // 记住这次选的颜色
  if (color) lastColor.value = color;
}

function handleUnsetColor() {
  props.editor?.chain().focus().unsetHighlight().run();
}
</script>

<template>
  <ColorPickerDropdown @update:model-value="handleSetColor">
    <ToolbarButton
      :is-active="isActive"
      :disabled="disabled"
      :icon="icon"
      :title="title"
      :action="() => handleSetColor()"
    >
      <!-- 颜色指示条 -->
      <template #indicator>
        <span
          class="highlight-indicator"
          :style="{ background: lastColor }"
        ></span>
      </template>
    </ToolbarButton>
    <template #prefix>
      <div class="highlight-prefix-item" @click="handleUnsetColor">
        <span class="highlight-prefix-icon">✕</span>
        <span class="highlight-prefix-label">取消高亮</span>
      </div>
      <div class="highlight-prefix-item" @click="handleSetColor('#fff8c5')">
        <div class="highlight-swatch-default"></div>
        <span class="highlight-prefix-label">默认高亮</span>
      </div>
    </template>
  </ColorPickerDropdown>
</template>

<style scoped>
.highlight-prefix-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  margin: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.highlight-prefix-item:hover {
  background: #f3f4f6;
}

.highlight-prefix-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 12px;
  color: #6b7280;
}

.highlight-swatch-default {
  width: 20px;
  height: 20px;
  background: #fff8c5;
  border-radius: 3px;
}

.highlight-prefix-label {
  font-size: 12px;
  color: #6b7280;
}

.highlight-indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 14px;
  height: 3px;
  border-radius: 1.5px;
  transform: translateX(-50%);
}
</style>
