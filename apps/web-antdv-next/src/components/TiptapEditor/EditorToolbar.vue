<script lang="ts" setup>
import type { AnyExtension } from '@tiptap/vue-3';

import type { ToolbarItem, ToolboxItem } from './types';

import { Editor } from '@tiptap/vue-3';
/**
 * 编辑器工具栏 - 来自 Halo EditorHeader.vue
 * 自动从扩展中收集工具栏项并按 priority 排序渲染
 */
import { Menu as VMenu } from 'floating-vue';

const props = defineProps({
  editor: {
    type: Editor,
    required: true,
  },
});

function getToolbarItemsFromExtensions() {
  const extensionManager = props.editor?.extensionManager;
  if (!extensionManager) {
    return [];
  }

  const toolbarItems: ToolbarItem[] = [];
  for (const extension of extensionManager.extensions as AnyExtension[]) {
    const { getToolbarItems } = extension.options;
    if (!getToolbarItems) {
      continue;
    }

    const items = getToolbarItems({
      editor: props.editor,
    });

    if (Array.isArray(items)) {
      toolbarItems.push(...items);
      continue;
    }

    toolbarItems.push(items);
  }

  return toolbarItems.toSorted((a, b) => a.priority - b.priority);
}

function getToolboxItemsFromExtensions() {
  const extensionManager = props.editor?.extensionManager;
  if (!extensionManager) {
    return [];
  }

  const toolboxItems: ToolboxItem[] = [];
  for (const extension of extensionManager.extensions as AnyExtension[]) {
    const { getToolboxItems } = extension.options;
    if (!getToolboxItems) {
      continue;
    }

    const items = getToolboxItems({
      editor: props.editor,
    });

    if (Array.isArray(items)) {
      toolboxItems.push(...items);
      continue;
    }

    toolboxItems.push(items);
  }

  return toolboxItems.toSorted((a, b) => a.priority - b.priority);
}
</script>

<template>
  <div class="editor-header">
    <!-- + 按钮（工具箱） -->
    <div class="editor-header__toolbox">
      <VMenu>
        <button class="editor-header__plus-btn">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
        <template #popper>
          <div class="editor-header__toolbox-panel">
            <component
              :is="toolboxItem.component"
              v-for="(toolboxItem, index) in getToolboxItemsFromExtensions()"
              v-bind="toolboxItem.props"
              :key="index"
            />
          </div>
        </template>
      </VMenu>
    </div>

    <div class="editor-header__divider"></div>

    <!-- 工具栏项 -->
    <div
      v-for="(item, index) in getToolbarItemsFromExtensions()"
      :key="index"
      class="editor-header__item"
    >
      <!-- 无子菜单：直接渲染按钮 -->
      <component
        :is="item.component"
        v-if="!item.children?.length"
        v-bind="item.props"
      />
      <!-- 有子菜单：用 VMenu 包裹 -->
      <VMenu v-else class="editor-header__submenu">
        <span class="editor-header__submenu-trigger">
          <component
            :is="item.component"
            v-bind="item.props"
            :children="item.children"
          />
        </span>
        <template #popper>
          <div class="editor-header__submenu-panel">
            <component
              v-bind="child.props"
              :is="child.component"
              v-for="(child, childIndex) in item.children"
              :key="childIndex"
            />
          </div>
        </template>
      </VMenu>
    </div>
  </div>
</template>

<style scoped>
.editor-header {
  display: flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  overflow-x: auto;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgb(0 0 0 / 4%);
}

.editor-header__toolbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.editor-header__plus-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 4px;
  color: #4ccba0;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: background 0.15s;
}

.editor-header__plus-btn:hover {
  background: #f3f4f6;
}

.editor-header__divider {
  flex-shrink: 0;
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: #e5e7eb;
}

.editor-header__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.editor-header__submenu {
  display: inline-flex;
}

.editor-header__submenu-trigger {
  display: inline-flex;
  cursor: pointer;
}

.editor-header__toolbox-panel {
  position: relative;
  width: 224px;
  max-height: 384px;
  padding: 4px;
  overflow: hidden;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
}

.editor-header__submenu-panel {
  position: relative;
  width: 140px;
  max-height: 288px;
  padding: 4px;
  overflow: hidden;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
}
</style>
