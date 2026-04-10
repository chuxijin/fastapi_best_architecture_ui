<script setup lang="ts">
import { VDropdown } from "#/stubs/halo-components";
import { computed } from "vue";
import MingcuteDistributeSpacingHorizontalLine from "~icons/mingcute/distribute-spacing-horizontal-line";
import { BlockActionSeparator } from "@HaloEditor/components";
import Input from "@HaloEditor/components/base/Input.vue";
import BubbleButton from "@HaloEditor/components/bubble/BubbleButton.vue";
import { i18n } from "@HaloEditor/locales";
import type { BubbleItemComponentProps } from "@HaloEditor/types";
import { ExtensionGallery } from "./index";

const props = defineProps<BubbleItemComponentProps>();

const gap = computed(() => {
  return props.editor.getAttributes(ExtensionGallery.name).gap;
});

function onGapChange(value: string | number | undefined) {
  props.editor
    .chain()
    .updateAttributes(ExtensionGallery.name, { gap: value })
    .run();
}
</script>

<template>
  <VDropdown
    ref="dropdownRef"
    class="inline-flex"
    :triggers="['click']"
    :distance="10"
  >
    <BubbleButton
      :title="i18n.global.t('editor.extensions.gallery.gap')"
      :text="`${gap}px`"
      show-more-indicator
    >
      <template #icon>
        <MingcuteDistributeSpacingHorizontalLine />
      </template>
    </BubbleButton>

    <template #popper>
      <div class="w-80">
        <Input
          auto-focus
          :label="i18n.global.t('editor.extensions.gallery.gap')"
          type="number"
          :model-value="gap"
          @update:model-value="onGapChange"
        />
      </div>
    </template>
  </VDropdown>

  <BlockActionSeparator :editor="editor" />
</template>
