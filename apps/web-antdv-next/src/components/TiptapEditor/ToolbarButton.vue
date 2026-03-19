<script lang="ts" setup>
/**
 * 工具栏按钮 - 来自 Halo ToolbarItem.vue
 * 支持下拉箭头（当传入 children 时自动显示）
 */
import type { Component } from 'vue';

import { IconDropdownArrow } from './icons';

withDefaults(
  defineProps<{
    action?: () => void;
    children?: any[];
    disabled?: boolean;
    icon?: Component;
    isActive?: boolean;
    title?: string;
  }>(),
  {
    isActive: false,
    disabled: false,
    title: undefined,
    action: undefined,
    icon: undefined,
    children: undefined,
  },
);
</script>

<template>
  <button
    class="toolbar-btn"
    :class="[
      { 'toolbar-btn--active': isActive },
      { 'toolbar-btn--disabled': disabled },
      { 'toolbar-btn--dropdown': children?.length },
    ]"
    :disabled="disabled"
    :title="title"
    tabindex="-1"
    @click="action?.()"
  >
    <component :is="icon" v-if="icon" class="toolbar-btn__icon" />
    <component
      :is="IconDropdownArrow"
      v-if="children?.length"
      class="toolbar-btn__arrow"
    />
  </button>
</template>

<style scoped>
.toolbar-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 4px;
  color: #374151;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.toolbar-btn--dropdown {
  width: auto;
  padding: 4px 6px;
}

.toolbar-btn:hover:not(.toolbar-btn--disabled) {
  background: #f3f4f6;
}

.toolbar-btn:active:not(.toolbar-btn--disabled) {
  background: #e5e7eb;
}

.toolbar-btn--active {
  background: rgb(229 231 235 / 70%);
}

.toolbar-btn--disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.toolbar-btn__icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.toolbar-btn__arrow {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-left: -2px;
}
</style>
