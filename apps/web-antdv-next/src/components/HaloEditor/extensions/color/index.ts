import type { Editor } from '@HaloEditor/tiptap';
import type { ExtensionOptions } from '@HaloEditor/types';
import type { ColorOptions } from '@tiptap/extension-color';

import { markRaw } from 'vue';

import { i18n } from '@HaloEditor/locales';
import TiptapColor from '@tiptap/extension-color';
import MingcuteTextColorLine from '~icons/mingcute/text-color-line';

import ColorToolbarItem from './ColorToolbarItem.vue';

export type ExtensionColorOptions = ExtensionOptions & Partial<ColorOptions>;

export const ExtensionColor = TiptapColor.extend<ExtensionColorOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      getToolbarItems({ editor }: { editor: Editor }) {
        return {
          priority: 81,
          component: markRaw(ColorToolbarItem),
          props: {
            editor,
            isActive: false,
            icon: markRaw(MingcuteTextColorLine),
            title: i18n.global.t('editor.common.color'),
          },
        };
      },
    };
  },
});
