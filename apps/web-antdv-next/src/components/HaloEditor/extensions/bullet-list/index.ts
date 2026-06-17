import type { Editor, Range } from '@HaloEditor/tiptap';
import type { ExtensionOptions } from '@HaloEditor/types';
import type { BulletListOptions } from '@tiptap/extension-list';

import { markRaw } from 'vue';

import { BulletList as TiptapBulletList } from '@tiptap/extension-list';
import MingcuteListCheckLine from '~icons/mingcute/list-check-line';

export type ExtensionBulletListOptions = ExtensionOptions &
  Partial<BulletListOptions>;

export const ExtensionBulletList = TiptapBulletList.extend<ExtensionOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      getCommandMenuItems() {
        return {
          priority: 130,
          icon: markRaw(MingcuteListCheckLine),
          title: 'editor.common.bullet_list',
          keywords: ['bulletlist', 'wuxuliebiao'],
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
          },
        };
      },
    };
  },
});
