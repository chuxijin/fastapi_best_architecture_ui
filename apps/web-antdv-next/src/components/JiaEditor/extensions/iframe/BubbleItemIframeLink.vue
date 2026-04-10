<script setup lang="ts">
import { computed } from "vue";
import Input from "#/components/JiaEditor/components/base/Input.vue";
import { i18n } from "#/components/JiaEditor/locales";
import type { BubbleItemComponentProps } from "#/components/JiaEditor/types";
import { isAllowedUri } from "#/components/JiaEditor/utils/is-allowed-uri";
import { ExtensionIframe } from "./index";

const props = defineProps<BubbleItemComponentProps>();

const src = computed({
  get: () => {
    return props.editor.getAttributes(ExtensionIframe.name).src;
  },
  set: (src: string) => {
    if (!src || !isAllowedUri(src)) {
      return;
    }
    props.editor
      .chain()
      .updateAttributes(ExtensionIframe.name, { src: src })
      .run();
  },
});
</script>

<template>
  <div class="w-80">
    <Input
      v-model="src"
      auto-focus
      :placeholder="i18n.global.t('editor.common.placeholder.link_input')"
      :label="i18n.global.t('editor.extensions.iframe.src_input_label')"
    />
  </div>
</template>

