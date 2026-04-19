<script lang="ts" setup>
import { VDropdown } from "#/stubs/halo-components";
import { BubbleButton, Input } from "../../..";
import { computed } from "vue";
import MingcuteLinkLine from "~icons/mingcute/link-line";

interface Props {
  editor: any;
  isActive?: (args?: any) => boolean;
  visible?: (args?: any) => boolean;
  action?: (args?: any) => void;
  name: string;
}
const props = defineProps<Props>();

const href = computed({
  get() {
    const attrs = props.editor.getAttributes(props.name);
    return attrs?.href;
  },
  set(value) {
    const { selection } = props.editor.state;
    if (!selection) {
      return;
    }
    const pos = selection.$anchor.pos;
    props.editor
      .chain()
      .updateAttributes(props.name, {
        href: value,
        target: target.value ? "_blank" : "_self",
      })
      .setNodeSelection(pos)
      .run();
  },
});

const target = computed({
  get() {
    const attrs = props.editor.getAttributes(props.name);
    return attrs?.target === "_blank";
  },
  set(value) {
    const { selection } = props.editor.state;
    if (!selection) {
      return;
    }
    const pos = selection.$anchor.pos;
    props.editor
      .chain()
      .updateAttributes(props.name, {
        href: href.value,
        target: value ? "_blank" : "_self",
      })
      .setNodeSelection(pos)
      .run();
  },
});
</script>

<template>
  <VDropdown class=":uno: inline-flex" :triggers="['click']" :distance="10">
    <BubbleButton title="编辑链接">
      <template #icon>
        <MingcuteLinkLine />
      </template>
    </BubbleButton>

    <template #popper>
      <div class="p-3 bg-white shadow-md rounded w-80">
        <Input v-model="href" auto-focus label="链接地址" />
        <label class=":uno: mt-2 inline-flex items-center">
          <input v-model="target" type="checkbox" />
          <span class=":uno: ml-2 text-sm text-gray-500">在新窗口中打开</span>
        </label>
      </div>
    </template>
  </VDropdown>
</template>
