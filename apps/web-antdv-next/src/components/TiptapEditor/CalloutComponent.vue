<script setup lang="ts">
import { NodeViewContent, nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3';

const props = defineProps(nodeViewProps);

// 预设高亮框颜色（柔和背景色）
const colors = [
  '#fef2f2', // 红色 (red-50)
  '#fffbeb', // 黄色 (amber-50)
  '#f0fdf4', // 绿色 (green-50)
  '#eff6ff', // 蓝色 (blue-50)
  '#faf5ff', // 紫色 (purple-50)
  '#f3f4f6', // 灰色 (gray-100)
];

function updateColor(color: string) {
  props.updateAttributes({
    backgroundColor: color,
  });
}
</script>

<template>
  <NodeViewWrapper
    class="editor-callout"
    :style="{ backgroundColor: node.attrs.backgroundColor }"
  >
    <div class="editor-callout-content">
      <NodeViewContent />
    </div>

    <!-- Hover 悬浮显示颜色选择器 -->
    <div class="editor-callout-tools" contenteditable="false">
      <div
        v-for="color in colors"
        :key="color"
        class="color-dot"
        :style="{ backgroundColor: color }"
        @click="updateColor(color)"
      ></div>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.editor-callout {
  position: relative;
  display: flex;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.editor-callout:hover,
.editor-callout.ProseMirror-selectednode {
  border-color: #e5e7eb;
}

.editor-callout-icon {
  margin-right: 1rem;
  font-size: 1.25rem;
  line-height: 1.5;
  user-select: none;
}

.editor-callout-content {
  flex: 1;
  min-width: 0;
}

.editor-callout-content :deep(p:first-child) {
  margin-top: 0;
}

.editor-callout-content :deep(p:last-child) {
  margin-bottom: 0;
}

.editor-callout-tools {
  position: absolute;
  top: -12px;
  right: 12px;
  z-index: 10;
  display: flex;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  pointer-events: none;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.editor-callout:hover .editor-callout-tools,
.editor-callout.ProseMirror-selectednode .editor-callout-tools {
  pointer-events: auto;
  opacity: 1;
  transform: translateY(0);
}

.color-dot {
  width: 18px;
  height: 18px;
  cursor: pointer;
  border: 1px solid rgb(0 0 0 / 10%);
  border-radius: 50%;
  transition: transform 0.1s;
}

.color-dot:hover {
  box-shadow: 0 0 0 1px rgb(0 0 0 / 10%);
  transform: scale(1.15);
}
</style>
