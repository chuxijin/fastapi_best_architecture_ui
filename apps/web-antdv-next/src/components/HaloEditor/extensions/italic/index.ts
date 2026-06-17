import type { Editor } from '@HaloEditor/tiptap';
import type { ExtensionOptions } from '@HaloEditor/types';
import type { ItalicOptions } from '@tiptap/extension-italic';

import { markRaw } from 'vue';

import ToolbarItem from '@HaloEditor/components/toolbar/ToolbarItem.vue';
import { i18n } from '@HaloEditor/locales';
import TiptapItalic from '@tiptap/extension-italic';
import MingcuteItalicLine from '~icons/mingcute/italic-line';

export type ExtensionItalicOptions = ExtensionOptions & Partial<ItalicOptions>;

export const ExtensionItalic = TiptapItalic.extend<ExtensionItalicOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      getToolbarItems({ editor }: { editor: Editor }) {
        return {
          priority: 50,
          component: markRaw(ToolbarItem),
          props: {
            editor,
            isActive: editor.isActive(TiptapItalic.name),
            icon: markRaw(MingcuteItalicLine),
            title: i18n.global.t('editor.common.italic'),
            action: () => editor.chain().focus().toggleItalic().run(),
          },
        };
      },
    };
  },
});
