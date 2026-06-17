import type { Editor, Range } from '@HaloEditor/tiptap';
import type { ExtensionOptions } from '@HaloEditor/types';
import type { OrderedListOptions } from '@tiptap/extension-list';

import { markRaw } from 'vue';

import { OrderedList as TiptapOrderedList } from '@tiptap/extension-list';
import MingcuteListOrderedLine from '~icons/mingcute/list-ordered-line';

export type ExtensionOrderedListOptions = ExtensionOptions &
  Partial<OrderedListOptions>;

export const ExtensionOrderedList =
  TiptapOrderedList.extend<ExtensionOrderedListOptions>({
    addOptions() {
      return {
        ...this.parent?.(),
        getCommandMenuItems() {
          return {
            priority: 140,
            icon: markRaw(MingcuteListOrderedLine),
            title: 'editor.common.ordered_list',
            keywords: ['orderedlist', 'youxuliebiao'],
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .toggleOrderedList()
                .run();
            },
          };
        },
      };
    },
  });
