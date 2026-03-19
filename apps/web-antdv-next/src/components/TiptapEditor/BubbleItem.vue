<script lang="ts" setup>
import type { Editor } from '@tiptap/vue-3';

/**
 * Bubble Menu 项 - 搬自 Halo BubbleItem.vue
 * 简化：去掉 VDropdown 弹窗回调，保留点击动作
 */
import type { Component } from 'vue';

import BubbleButton from './BubbleButton.vue';

const props = withDefaults(
  defineProps<{
    action?: (ctx: { editor: Editor }) => void;
    editor: Editor;
    icon?: Component;
    iconStyle?: string;
    isActive?: (ctx: { editor: Editor }) => boolean;
    title?: string;
    visible?: (ctx: { editor: Editor }) => boolean;
  }>(),
  {
    isActive: () => false,
    visible: () => true,
    icon: undefined,
    iconStyle: undefined,
    title: undefined,
    action: undefined,
  },
);

function handleClick() {
  if (!props.action) return;
  props.action({ editor: props.editor });
}
</script>

<template>
  <BubbleButton
    v-if="visible({ editor })"
    :title="title"
    :is-active="isActive({ editor })"
    @click="handleClick"
  >
    <template #icon>
      <component :is="icon" v-if="icon" :style="iconStyle" />
    </template>
  </BubbleButton>
</template>
