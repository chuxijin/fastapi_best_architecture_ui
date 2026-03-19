<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

/**
 * 块级公式 NodeView
 * - 独占一行，居中显示
 * - 点击进入编辑模式
 */
import { NodeViewWrapper } from '@tiptap/vue-3';
import katex from 'katex';

const props = defineProps<{
  decorations: any;
  deleteNode: () => void;
  editor: any;
  extension: any;
  getPos: () => number;
  node: any;
  selected: boolean;
  updateAttributes: (attrs: Record<string, any>) => void;
}>();

const editing = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const latex = computed(() => props.node.attrs.latex || '');

const renderedHtml = computed(() => {
  if (!latex.value)
    return '<span style="color:#9ca3af">输入 LaTeX 公式...</span>';
  try {
    return katex.renderToString(latex.value, {
      throwOnError: false,
      displayMode: true,
    });
  } catch {
    return `<span style="color:#dc2626">${latex.value}</span>`;
  }
});

function startEdit() {
  editing.value = true;
  nextTick(() => {
    textareaRef.value?.focus();
    autoResize();
  });
}

function finishEdit() {
  editing.value = false;
}

function onTextareaInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value;
  props.updateAttributes({ latex: val });
  autoResize();
}

function autoResize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault();
    finishEdit();
    const pos = props.getPos() + props.node.nodeSize;
    props.editor.chain().focus(pos).run();
  }
}

watch(
  () => props.selected,
  (sel) => {
    if (sel && !editing.value) startEdit();
  },
);
</script>

<template>
  <NodeViewWrapper
    class="block-math-wrapper"
    :class="{ 'is-editing': editing }"
  >
    <!-- 编辑模式 -->
    <div v-if="editing" class="block-math-editor" contenteditable="false">
      <div class="block-math-editor-header">
        <span class="block-math-label">𝑓(𝑥) 块级公式</span>
        <div class="block-math-header-actions">
          <button
            class="block-math-done-btn"
            @click.stop="finishEdit"
            @mousedown.prevent.stop
          >
            完成
          </button>
          <button
            class="block-math-delete-btn"
            title="删除"
            @click.stop="deleteNode"
            @mousedown.prevent.stop
          >
            ✕
          </button>
        </div>
      </div>
      <textarea
        ref="textareaRef"
        class="block-math-textarea"
        :value="latex"
        placeholder="输入 LaTeX 公式，如 \int_0^\infty e^{-x} dx = 1"
        spellcheck="false"
        rows="2"
        @input="onTextareaInput"
        @keydown="onKeydown"
        @click.stop
        @mousedown.stop
      ></textarea>
      <!-- 实时预览 -->
      <div
        v-if="latex"
        class="block-math-live-preview"
        v-html="renderedHtml"
      ></div>
    </div>
    <!-- 预览模式 -->
    <div v-else class="block-math-preview-wrapper" contenteditable="false">
      <button
        class="block-math-float-delete"
        title="删除"
        @click.stop="deleteNode"
        @mousedown.prevent.stop
      >
        ✕
      </button>
      <div
        class="block-math-preview"
        @click.stop="startEdit"
        v-html="renderedHtml"
      ></div>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.block-math-wrapper {
  margin: 0.75em 0;
}

.block-math-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 12px 16px;
  text-align: center;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.block-math-preview:hover {
  background: #f5f3ff;
}

.block-math-editor {
  overflow: hidden;
  background: #fafafe;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
}

.block-math-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f0ecff;
  border-bottom: 1px solid #e0d8ff;
}

.block-math-label {
  font-size: 12px;
  font-weight: 500;
  color: #6366f1;
}

.block-math-done-btn {
  padding: 2px 10px;
  font-size: 12px;
  color: #4f46e5;
  cursor: pointer;
  background: none;
  border: 1px solid #c7d2fe;
  border-radius: 4px;
  transition: all 0.15s;
}

.block-math-done-btn:hover {
  color: #fff;
  background: #4f46e5;
}

.block-math-textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 12px;
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  resize: none;
  outline: none;
  background: transparent;
  border: none;
}

.block-math-textarea::placeholder {
  color: #9ca3af;
}

.block-math-live-preview {
  min-height: 28px;
  padding: 8px 12px;
  text-align: center;
  border-top: 1px dashed #e0d8ff;
}

.block-math-header-actions {
  display: flex;
  gap: 6px;
}

.block-math-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.15s;
}

.block-math-delete-btn:hover {
  color: #dc2626;
  background: #fee2e2;
  border-color: #fca5a5;
}

.block-math-preview-wrapper {
  position: relative;
}

.block-math-float-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 5;
  display: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.15s;
}

.block-math-preview-wrapper:hover .block-math-float-delete {
  display: flex;
}

.block-math-float-delete:hover {
  color: #dc2626;
  background: #fee2e2;
  border-color: #fca5a5;
}
</style>
