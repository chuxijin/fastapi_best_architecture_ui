<script lang="ts" setup>
import type { EditorConfig } from '@HaloEditor/config';

import type { CSSProperties, PropType } from 'vue';

import { provide, watch } from 'vue';

import { editorConfigKey } from '@HaloEditor/config';
import { i18n } from '@HaloEditor/locales';
import { EditorContent, VueEditor } from '@HaloEditor/tiptap';

import EditorBubbleMenu from './bubble/EditorBubbleMenu.vue';
import EditorDragHandle from './drag/EditorDragHandle.vue';
import EditorHeader from './EditorHeader.vue';

const props = defineProps({
  editor: {
    type: Object as PropType<VueEditor>,
    required: true,
  },
  contentStyles: {
    type: Object as PropType<CSSProperties>,
    required: false,
    default: () => ({}),
  },
  locale: {
    type: String as PropType<'en' | 'en-US' | 'zh' | 'zh-CN'>,
    required: false,
    default: 'zh-CN',
  },
  config: {
    type: Object as PropType<EditorConfig>,
    required: false,
    default: () => ({}),
  },
});

provide(editorConfigKey, props.config);

watch(
  () => props.locale,
  () => {
    i18n.global.locale.value = props.locale;
  },
  {
    immediate: true,
  },
);
</script>
<template>
  <div v-if="editor" class="halo-rich-text-editor">
    <EditorBubbleMenu :editor="editor" />
    <EditorDragHandle :editor="editor" />
    <EditorHeader :editor="editor" />
    <div class="editor-entry">
      <div class="editor-main">
        <div v-if="$slots.content" class="editor-main-extra">
          <slot name="content"></slot>
        </div>

        <EditorContent
          :editor="editor"
          :style="contentStyles"
          class="editor-main-content markdown-body"
        />
      </div>
      <div v-if="$slots.extra" class="editor-entry-extra">
        <slot name="extra"></slot>
      </div>
    </div>
  </div>
</template>
