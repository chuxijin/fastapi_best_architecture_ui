<script lang="ts" setup>
import { VDropdown } from '#/stubs/halo-components';

import { BubbleButton } from '../../..';
import LinkViewMenu from '../components/LinkViewMenu.vue';

interface Props {
  editor: any;
  isActive?: (args?: any) => boolean;
  visible?: (args?: any) => boolean;
  action?: (args?: any) => void;
  type?: ({ editor }: { editor: any }) => any;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: () => false,
  // @unocss-skip-start
  visible: () => true,
  // @unocss-skip-end
  action: undefined,
  type: undefined,
});
</script>

<template>
  <template v-if="visible({ editor })">
    <VDropdown
      class=":uno: inline-flex"
      :triggers="['click']"
      :popper-triggers="['click']"
    >
      <BubbleButton
        :text="type?.({ editor }).title"
        show-more-indicator
        :is-active="isActive({ editor })"
      >
        <template #icon>
          <component :is="type?.({ editor }).icon" />
        </template>
      </BubbleButton>
      <template #popper>
        <div
          class=":uno: relative max-h-96 w-56 overflow-hidden overflow-y-auto"
        >
          <KeepAlive>
            <LinkViewMenu v-bind="props" />
          </KeepAlive>
        </div>
      </template>
    </VDropdown>
  </template>
</template>
