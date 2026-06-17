import type { Editor, Range } from '@HaloEditor/tiptap';
import type { ExtensionOptions } from '@HaloEditor/types';
import type { TaskListOptions } from '@tiptap/extension-list';

import { markRaw } from 'vue';

import { TaskItem, TaskList as TiptapTaskList } from '@tiptap/extension-list';
import MingcuteListCheck3Line from '~icons/mingcute/list-check-3-line';

export type ExtensionTaskListOptions = ExtensionOptions &
  Partial<TaskListOptions>;

export const ExtensionTaskList =
  TiptapTaskList.extend<ExtensionTaskListOptions>({
    addOptions() {
      return {
        ...this.parent?.(),
        getCommandMenuItems() {
          return {
            priority: 150,
            icon: markRaw(MingcuteListCheck3Line),
            title: 'editor.common.task_list',
            keywords: ['tasklist', 'renwuliebiao'],
            command: ({ editor, range }: { editor: Editor; range: Range }) => {
              editor.chain().focus().deleteRange(range).toggleTaskList().run();
            },
          };
        },
      };
    },
    addExtensions() {
      return [TaskItem];
    },
  });
