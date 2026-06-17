import type { Editor } from '@HaloEditor/tiptap';
import type { ExtensionOptions } from '@HaloEditor/types';
import type { SubscriptExtensionOptions } from '@tiptap/extension-subscript';

import { markRaw } from 'vue';

import ToolbarItem from '@HaloEditor/components/toolbar/ToolbarItem.vue';
import { i18n } from '@HaloEditor/locales';
import TiptapSubscript from '@tiptap/extension-subscript';
import PhTextSubscript from '~icons/ph/text-subscript';

export type ExtensionSubscriptOptions = ExtensionOptions &
  Partial<SubscriptExtensionOptions>;

export const ExtensionSubscript =
  TiptapSubscript.extend<ExtensionSubscriptOptions>({
    addOptions() {
      return {
        ...this.parent?.(),
        getToolbarItems({ editor }: { editor: Editor }) {
          return {
            priority: 120,
            component: markRaw(ToolbarItem),
            props: {
              editor,
              isActive: editor.isActive(TiptapSubscript.name),
              icon: markRaw(PhTextSubscript),
              title: i18n.global.t('editor.common.subscript'),
              action: () => editor.chain().focus().toggleSubscript().run(),
            },
          };
        },
      };
    },
  });
