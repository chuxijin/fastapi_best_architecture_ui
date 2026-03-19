<script lang="ts" setup>
/**
 * 工具栏子菜单项 - 来自 Halo ToolbarSubItem.vue
 */
import type { Component } from 'vue';

const props = withDefaults(
  defineProps<{
    action?: () => void;
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
  },
);

const handleClick = () => {
  if (props.disabled) return;
  props.action?.();
};
</script>

<template>
  <div
    class="toolbar-sub-item"
    :class="[
      { 'toolbar-sub-item--active': isActive },
      { 'toolbar-sub-item--disabled': disabled },
    ]"
    @click="handleClick"
  >
    <component
      :is="icon"
      v-if="icon"
      class="toolbar-sub-item__icon"
      :class="[{ 'toolbar-sub-item__icon--active': isActive }]"
    />
    <span
      class="toolbar-sub-item__title"
      :class="[{ 'toolbar-sub-item__title--active': isActive }]"
    >
      {{ title }}
    </span>
  </div>
</template>

<style scoped>
.toolbar-sub-item {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.toolbar-sub-item:hover:not(.toolbar-sub-item--disabled) {
  background: #f3f4f6;
}

.toolbar-sub-item--active {
  background: #f3f4f6;
}

.toolbar-sub-item--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.toolbar-sub-item__icon {
  width: 20px;
  height: 20px;
  padding: 2px;
  border-radius: 4px;
}

.toolbar-sub-item__title {
  font-size: 13px;
  color: #374151;
}

.toolbar-sub-item__title--active {
  font-weight: 500;
  color: #2563eb; /* Active color from Antdv or custom */
}

.toolbar-sub-item:hover
  .toolbar-sub-item__title:not(.toolbar-sub-item__title--active) {
  color: #111827;
}
</style>
