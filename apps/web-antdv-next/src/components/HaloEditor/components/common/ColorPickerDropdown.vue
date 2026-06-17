<script lang="ts" setup>
import type { Payload } from '@ckpack/vue-color';

import { Sketch } from '@ckpack/vue-color';
import { i18n } from '@HaloEditor/locales';
import { Dropdown as VDropdown } from 'floating-vue';
// eslint-disable-next-line n/no-extraneous-import
import tailwindcssColors from 'tailwindcss/colors';
import MingcutePaletteLine from '~icons/mingcute/palette-line';
import MingcuteRightLine from '~icons/mingcute/right-line';

interface Color {
  color: string;
  name: string;
}

withDefaults(
  defineProps<{
    modelValue?: string;
  }>(),
  {
    modelValue: undefined,
  },
);

const emit = defineEmits<{
  (emit: 'update:modelValue', value?: string): void;
}>();

function getColors(): Color[] {
  const result: Color[] = [];

  const allowedKeys = new Set([
    'blue',
    'gray',
    'green',
    'orange',
    'pink',
    'purple',
    'red',
    'yellow',
  ]);
  const colors: { [key: string]: { [key: string]: string } } = {};
  for (const key of Object.keys(tailwindcssColors)) {
    if (allowedKeys.has(key)) {
      colors[key] = tailwindcssColors[key];
    }
  }

  for (const color in colors) {
    const colorShades = colors[color];
    const colorShadesArr = Object.entries(colorShades || {});

    const sortedShades = colorShadesArr
      .filter(
        ([shade]) =>
          Number.parseInt(shade) >= 100 && Number.parseInt(shade) <= 900,
      )
      .toSorted((a, b) => Number.parseInt(b[0]) - Number.parseInt(a[0]));

    const formattedShades = sortedShades.map(([shade, value]) => ({
      color: value,
      name: `${color} ${shade}`,
    }));

    result.push(...formattedShades);
  }

  return result;
}

function handleSetColor(color: string) {
  emit('update:modelValue', color);
}

function onColorChange(color: Payload) {
  handleSetColor(color.hex);
}
</script>

<template>
  <VDropdown
    class="inline-flex items-center"
    :triggers="['click']"
    :popper-triggers="['click']"
  >
    <slot></slot>
    <template #popper>
      <slot name="prefix"></slot>
      <div class="grid grid-cols-9 gap-1.5 p-2 pt-1">
        <div
          v-for="item in getColors()"
          :key="item.color"
          :style="{ backgroundColor: item.color }"
          class="size-5 cursor-pointer rounded-sm ring-gray-300 ring-offset-1 hover:ring-1"
          :title="item.name"
          @click="handleSetColor(item.color)"
        ></div>
      </div>

      <VDropdown
        popper-class="[&_.v-popper\_\_inner]:!p-0"
        placement="right"
        :triggers="['click']"
        :popper-triggers="['click']"
      >
        <div class="p-1">
          <div
            class="flex cursor-pointer items-center justify-between rounded p-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <div class="inline-flex items-center gap-2">
              <MingcutePaletteLine />
              <span>
                {{ i18n.global.t('editor.components.color_picker.more_color') }}
              </span>
            </div>
            <div>
              <MingcuteRightLine />
            </div>
          </div>
        </div>
        <template #popper>
          <Sketch model-value="#000" @update:model-value="onColorChange" />
        </template>
      </VDropdown>
    </template>
  </VDropdown>
</template>
