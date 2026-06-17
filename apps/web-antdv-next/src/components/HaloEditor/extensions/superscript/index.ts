import type { Editor } from '@HaloEditor/tiptap';
import type { ExtensionOptions } from '@HaloEditor/types';
import type { SuperscriptExtensionOptions } from '@tiptap/extension-superscript';

import { markRaw } from 'vue';

import ToolbarItem from '@HaloEditor/components/toolbar/ToolbarItem.vue';
import { i18n } from '@HaloEditor/locales';
import TiptapSuperscript from '@tiptap/extension-superscript';
import PhTextSuperscript from '~icons/ph/text-superscript';

export type ExtensionSuperscriptOptions = ExtensionOptions &
  Partial<SuperscriptExtensionOptions>;

export const ExtensionSuperscript =
  TiptapSuperscript.extend<ExtensionSuperscriptOptions>({
    addOptions() {
      return {
        ...this.parent?.(),
        getToolbarItems({ editor }: { editor: Editor }) {
          return {
            priority: 110,
            component: markRaw(ToolbarItem),
            props: {
              editor,
              isActive: editor.isActive(TiptapSuperscript.name),
              icon: markRaw(PhTextSuperscript),
              title: i18n.global.t('editor.common.superscript'),
              action: () => editor.chain().focus().toggleSuperscript().run(),
            },
          };
        },
      };
    },
  });
