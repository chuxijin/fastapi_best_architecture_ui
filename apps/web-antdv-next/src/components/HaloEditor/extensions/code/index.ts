import type { Editor } from '@HaloEditor/tiptap';
import type { ExtensionOptions } from '@HaloEditor/types';
import type { CodeOptions } from '@tiptap/extension-code';

import { markRaw } from 'vue';

import ToolbarItem from '@HaloEditor/components/toolbar/ToolbarItem.vue';
import { i18n } from '@HaloEditor/locales';
import TiptapCode from '@tiptap/extension-code';
import MingcuteCodeLine from '~icons/mingcute/code-line';

export type ExtensionCodeOptions = ExtensionOptions & Partial<CodeOptions>;

export const ExtensionCode = TiptapCode.extend<ExtensionCodeOptions>({
  exitable: true,
  addOptions() {
    return {
      ...this.parent?.(),
      getToolbarItems({ editor }: { editor: Editor }) {
        return {
          priority: 100,
          component: markRaw(ToolbarItem),
          props: {
            editor,
            isActive: editor.isActive(TiptapCode.name),
            icon: markRaw(MingcuteCodeLine),
            title: i18n.global.t('editor.common.code'),
            action: () => editor.chain().focus().toggleCode().run(),
          },
        };
      },
    };
  },
});
