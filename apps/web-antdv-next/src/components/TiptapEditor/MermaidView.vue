<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

/**
 * Mermaid 文本绘图 NodeView
 * - 编辑模式：textarea 输入 Mermaid 语法
 * - 预览模式：渲染为 SVG
 */
import { NodeViewWrapper } from '@tiptap/vue-3';
import mermaid from 'mermaid';

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
// 初始化 mermaid（只执行一次）
let mermaidInited = false;
function ensureMermaidInit() {
  if (mermaidInited) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });
  mermaidInited = true;
}

const editing = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const renderedSvg = ref('');
const renderError = ref('');
const code = computed(() => props.node.attrs.code || '');

let renderCounter = 0;

async function renderDiagram() {
  ensureMermaidInit();
  const src = code.value.trim();
  if (!src) {
    renderedSvg.value = '';
    renderError.value = '';
    return;
  }
  try {
    renderCounter++;
    const id = `mermaid-${Date.now()}-${renderCounter}`;
    const { svg } = await mermaid.render(id, src);
    renderedSvg.value = svg;
    renderError.value = '';
  } catch (error: any) {
    renderError.value = error?.message || '渲染失败';
    renderedSvg.value = '';
  }
}

function startEdit() {
  editing.value = true;
  nextTick(() => {
    textareaRef.value?.focus();
    autoResize();
  });
}

function finishEdit() {
  editing.value = false;
  renderDiagram();
}

function onTextareaInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value;
  props.updateAttributes({ code: val });
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

// 初始渲染
onMounted(() => {
  if (code.value) renderDiagram();
});
</script>

<template>
  <NodeViewWrapper class="mermaid-block" :class="{ 'is-editing': editing }">
    <!-- 编辑模式 -->
    <div v-if="editing" class="mermaid-editor" contenteditable="false">
      <div class="mermaid-editor-header">
        <span class="mermaid-label">📊 Mermaid 绘图</span>
        <div class="mermaid-header-actions">
          <button
            class="mermaid-btn mermaid-preview-btn"
            @click.stop="renderDiagram"
            @mousedown.prevent.stop
          >
            预览
          </button>
          <button
            class="mermaid-btn mermaid-done-btn"
            @click.stop="finishEdit"
            @mousedown.prevent.stop
          >
            完成
          </button>
          <button
            class="mermaid-btn mermaid-delete-btn"
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
        class="mermaid-textarea"
        :value="code"
        placeholder="输入 Mermaid 语法，如：&#10;graph TD&#10;  A[开始] --> B{判断}&#10;  B -->|是| C[结果1]&#10;  B -->|否| D[结果2]"
        spellcheck="false"
        rows="5"
        @input="onTextareaInput"
        @keydown="onKeydown"
        @click.stop
        @mousedown.stop
      ></textarea>
      <!-- 实时预览 -->
      <div
        v-if="renderedSvg"
        class="mermaid-live-preview"
        v-html="renderedSvg"
      ></div>
      <div v-else-if="renderError" class="mermaid-error">{{ renderError }}</div>
    </div>
    <!-- 预览模式 -->
    <div v-else class="mermaid-preview-wrapper" contenteditable="false">
      <button
        class="mermaid-float-delete"
        title="删除"
        @click.stop="deleteNode"
        @mousedown.prevent.stop
      >
        ✕
      </button>
      <div
        v-if="renderedSvg"
        class="mermaid-preview"
        @click.stop="startEdit"
        v-html="renderedSvg"
      ></div>
      <div v-else class="mermaid-placeholder" @click.stop="startEdit">
        <span class="mermaid-placeholder-icon">📊</span>
        <span>点击编辑 Mermaid 图表</span>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.mermaid-block {
  margin: 0.75em 0;
}

.mermaid-preview {
  padding: 16px;
  overflow-x: auto;
  text-align: center;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.mermaid-preview:hover {
  background: #f7f7ff;
}

.mermaid-placeholder {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #9ca3af;
  cursor: pointer;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  transition: all 0.15s;
}

.mermaid-placeholder:hover {
  color: #6366f1;
  background: #faf9ff;
  border-color: #6366f1;
}

.mermaid-placeholder-icon {
  font-size: 20px;
}

.mermaid-editor {
  overflow: hidden;
  background: #fafafe;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
}

.mermaid-editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f0ecff;
  border-bottom: 1px solid #e0d8ff;
}

.mermaid-label {
  font-size: 12px;
  font-weight: 500;
  color: #6366f1;
}

.mermaid-header-actions {
  display: flex;
  gap: 6px;
}

.mermaid-btn {
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
}

.mermaid-preview-btn {
  color: #6366f1;
  background: none;
  border: 1px solid #c7d2fe;
}

.mermaid-preview-btn:hover {
  background: #e0e7ff;
}

.mermaid-done-btn {
  color: #4f46e5;
  background: none;
  border: 1px solid #c7d2fe;
}

.mermaid-done-btn:hover {
  color: #fff;
  background: #4f46e5;
}

.mermaid-textarea {
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

.mermaid-textarea::placeholder {
  color: #9ca3af;
}

.mermaid-live-preview {
  padding: 12px;
  overflow-x: auto;
  text-align: center;
  border-top: 1px dashed #e0d8ff;
}

.mermaid-error {
  padding: 8px 12px;
  font-size: 12px;
  color: #dc2626;
  border-top: 1px dashed #e0d8ff;
}

/* ---- 删除按钮 ---- */
.mermaid-delete-btn {
  color: #6b7280 !important;
  background: none !important;
  border: 1px solid #d1d5db !important;
}

.mermaid-delete-btn:hover {
  color: #dc2626 !important;
  background: #fee2e2 !important;
  border-color: #fca5a5 !important;
}

.mermaid-preview-wrapper {
  position: relative;
}

.mermaid-float-delete {
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

.mermaid-preview-wrapper:hover .mermaid-float-delete {
  display: flex;
}

.mermaid-float-delete:hover {
  color: #dc2626;
  background: #fee2e2;
  border-color: #fca5a5;
}
</style>
