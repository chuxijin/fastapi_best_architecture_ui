<script lang="ts" setup>
/**
 * Bubble Menu 按钮 - 搬自 Halo BubbleButton.vue
 */
import { computed } from 'vue';

import { IconDropdownArrow } from './icons';

const props = withDefaults(
  defineProps<{
    isActive?: boolean;
    showMoreIndicator?: boolean;
    text?: string;
    title?: string;
  }>(),
  {
    showMoreIndicator: false,
    isActive: false,
    title: undefined,
    text: undefined,
  },
);

const onlyIcon = computed(() => {
  return !props.text && !props.showMoreIndicator;
});
</script>

<template>
  <button
    class="bubble-button"
    :class="[
      { 'bubble-button--active': isActive },
      { 'bubble-button--icon-only': onlyIcon },
      { 'bubble-button--with-text': !onlyIcon },
    ]"
    :title="title"
  >
    <slot name="icon"></slot>
    <span v-if="text" class="bubble-button__text">{{ text }}</span>
    <component
      :is="IconDropdownArrow"
      v-if="showMoreIndicator"
      class="bubble-button__arrow"
    />
  </button>
</template>

<style scoped>
.bubble-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: background 0.15s;
}

.bubble-button:hover {
  background: #f3f4f6;
}

.bubble-button:active {
  background: #e5e7eb;
}

.bubble-button--active {
  color: #000;
  background: #e5e7eb;
}

.bubble-button--icon-only {
  width: 32px;
  height: 32px;
}

.bubble-button--with-text {
  gap: 4px;
  height: 32px;
  padding: 0 6px;
}

.bubble-button :deep(svg) {
  width: 20px;
  height: 20px;
}

.bubble-button__text {
  font-size: 13px;
}

.bubble-button__arrow {
  width: 14px;
  height: 14px;
}
</style>
