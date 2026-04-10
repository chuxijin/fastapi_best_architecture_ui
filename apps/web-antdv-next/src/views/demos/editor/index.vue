<script lang="ts" setup>
import { onMounted, ref, shallowRef } from 'vue';

import {
  RichTextEditor as HaloEditor,
  ExtensionsKit,
  VueEditor,
} from '#/components/HaloEditor';

const editor = shallowRef<VueEditor>();
const isLoading = ref(true);
const loadedPluginCount = ref(0);

onMounted(async () => {
  try {
    editor.value = new VueEditor({
      content: '',
      extensions: [ExtensionsKit.configure({})],
    });
  } catch (e) {
    console.error('[JiaEditor] Failed to initialize:', e);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="p-4">
    <div class="mb-4">
      <h2 class="mb-2 text-xl font-semibold">HaloEditor</h2>
      <p class="text-sm text-gray-500">
        当前为全开功能模式，已挂载 HaloEditor 全量原生插件
      </p>
    </div>
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <span>加载中...</span>
    </div>
    <div
      v-else-if="editor"
      class="overflow-hidden rounded-lg border border-gray-200"
    >
      <HaloEditor :editor="editor" locale="zh-CN" />
    </div>
    <div v-else class="py-20 text-center text-red-500">编辑器加载失败</div>
  </div>
</template>
