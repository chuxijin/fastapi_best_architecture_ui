<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';

// @ts-ignore
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';

import '@wangeditor/editor/dist/css/style.css'; // 引入 css

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  height: {
    type: [Number, String],
    default: 400,
  },
  mode: {
    type: String,
    default: 'default', // or 'simple'
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();

// 内容 HTML
const valueHtml = ref(props.modelValue || '');

// 监听 props 变化同步到 valueHtml (处理外部更新)
watch(
  () => props.modelValue,
  (val) => {
    // 只有当传入值和当前值不一致时才赋值，避免光标跳动等问题
    // 但 WangEditor v-model 内部处理了部分，这里简单处理
    if (val !== valueHtml.value) {
      valueHtml.value = val;
    }
  },
);

const toolbarConfig = {};
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    // uploadImage: { server: '/api/upload', ... }
  },
};

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (!editor) return;
  editor.destroy();
});

const handleCreated = (editor: any) => {
  editorRef.value = editor; // 记录 editor 实例
};

const handleChange = (editor: any) => {
  const html = editor.getHtml();
  valueHtml.value = html;
  emit('update:modelValue', html);
  emit('change', html);
};

const containerHeight = computed(() => {
  return typeof props.height === 'number' ? `${props.height}px` : props.height;
});
</script>

<template>
  <div class="wangeditor-box">
    <Toolbar
      style="border-bottom: 1px solid #e5e7eb"
      :editor="editorRef"
      :default-config="toolbarConfig"
      :mode="mode"
    />
    <Editor
      :style="{ height: containerHeight, 'overflow-y': 'hidden' }"
      v-model="valueHtml"
      :default-config="editorConfig"
      :mode="mode"
      @on-created="handleCreated"
      @on-change="handleChange"
    />
  </div>
</template>

<style scoped>
.wangeditor-box {
  z-index: 100; /* 防止遮挡 */
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}
</style>
