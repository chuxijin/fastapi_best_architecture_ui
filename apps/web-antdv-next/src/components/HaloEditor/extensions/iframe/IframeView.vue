<script lang="ts" setup>
import { computed } from "vue";
import Input from "@HaloEditor/components/base/Input.vue";
import { i18n } from "@HaloEditor/locales";
import type { NodeViewProps } from "@HaloEditor/tiptap/vue-3";
import { NodeViewWrapper } from "@HaloEditor/tiptap/vue-3";
import { isAllowedUri } from "@HaloEditor/utils/is-allowed-uri";

const props = defineProps<NodeViewProps>();

const src = computed({
  get: () => {
    return props.node?.attrs.src;
  },
  set: (src: string) => {
    if (!src || !isAllowedUri(src)) {
      return;
    }
    props.updateAttributes({ src: src });
  },
});

const frameborder = computed(() => {
  return props.node.attrs.frameborder;
});

function handleSetFocus() {
  props.editor.commands.setNodeSelection(props.getPos() || 0);
}
</script>

<template>
  <node-view-wrapper as="div" class="inline-block w-full">
    <div
      class="relative inline-block h-full max-w-full overflow-hidden text-center transition-all"
      :style="{
        width: node.attrs.width,
      }"
    >
      <div v-if="!src" class="p-1.5">
        <Input
          ref="inputRef"
          v-model.lazy="src"
          :placeholder="i18n.global.t('editor.common.placeholder.link_input')"
          tabindex="-1"
          auto-focus
          @focus="handleSetFocus"
        />
      </div>
      <iframe
        v-else
        class="rounded-md"
        :src="node!.attrs.src"
        :width="node.attrs.width"
        :height="node.attrs.height"
        scrolling="yes"
        :frameborder="frameborder"
        framespacing="0"
        allowfullscreen="true"
        :class="{
          'border-2': frameborder === '1',
        }"
        @mouseenter="handleSetFocus"
      ></iframe>
    </div>
  </node-view-wrapper>
</template>
