<script lang="ts" setup>
import type { Editor } from '@tiptap/vue-3';

import type { Component } from 'vue';

const props = defineProps<{
  action?: () => void;
  description?: string;
  editor: Editor;
  icon?: Component;
  title?: string;
}>();
</script>

<template>
  <div role="menuitem" tabindex="-1" class="toolbox-item" @click="action?.()">
    <div class="toolbox-item__icon-wrapper">
      <component :is="icon" v-if="icon" class="toolbox-item__icon" />
    </div>

    <div class="toolbox-item__content">
      <span class="toolbox-item__title" :title="title">
        {{ title }}
      </span>
      <span
        v-if="description"
        class="toolbox-item__description"
        :title="description"
      >
        {{ description }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.toolbox-item {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
  padding: 6px;
  margin: 6px 0;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.15s;
}

.toolbox-item:first-child {
  margin-top: 0;
}

.toolbox-item:last-child {
  margin-bottom: 0;
}

.toolbox-item:hover {
  background-color: #f3f4f6;
}

.toolbox-item__icon-wrapper {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 4px;
  background-color: #f3f4f6;
  border-radius: 4px;
}

.toolbox-item:hover .toolbox-item__icon-wrapper {
  background-color: #fff;
}

.toolbox-item__icon {
  width: 100%;
  height: 100%;
}

.toolbox-item__content {
  display: flex;
  flex: 1;
  flex-shrink: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.toolbox-item__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  font-size: 14px;
  color: #4b5563;
  -webkit-box-orient: vertical;
}

.toolbox-item:hover .toolbox-item__title {
  font-weight: 500;
  color: #111827;
}

.toolbox-item__description {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: 12px;
  color: #6b7280;
  -webkit-box-orient: vertical;
}
</style>
