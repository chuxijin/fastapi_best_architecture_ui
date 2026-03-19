import type { SuggestionOptions } from '@tiptap/suggestion';
import type { AnyExtension } from '@tiptap/vue-3';

import type { CommandMenuItem } from './CommandsView.vue';

import { markRaw } from 'vue';

import { computePosition, flip, shift } from '@floating-ui/dom';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import { Extension, VueRenderer } from '@tiptap/vue-3';

import CommandsView from './CommandsView.vue';
import {
  IconBulletList,
  IconCallout,
  IconCodeBlock,
  IconH1,
  IconH2,
  IconH3,
  IconH4,
  IconHorizontalRule,
  IconImage,
  IconOrderedList,
  IconParagraph,
  IconQuote,
  IconTablePlus,
  IconTaskList,
} from './icons';
import { openUrlInputModal } from './urlInput';

const builtinCommandItems: CommandMenuItem[] = [
  {
    priority: 10,
    icon: markRaw(IconParagraph),
    title: 'Paragraph',
    keywords: ['paragraph', 'text', 'zhengwen'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    priority: 20,
    icon: markRaw(IconH1),
    title: 'Heading 1',
    keywords: ['h1', 'heading1', 'biaoti'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run();
    },
  },
  {
    priority: 30,
    icon: markRaw(IconH2),
    title: 'Heading 2',
    keywords: ['h2', 'heading2'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run();
    },
  },
  {
    priority: 40,
    icon: markRaw(IconH3),
    title: 'Heading 3',
    keywords: ['h3', 'heading3'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run();
    },
  },
  {
    priority: 50,
    icon: markRaw(IconH4),
    title: 'Heading 4',
    keywords: ['h4', 'heading4'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 4 })
        .run();
    },
  },
  {
    priority: 60,
    icon: markRaw(IconBulletList),
    title: 'Bullet List',
    keywords: ['bulletlist', 'ul', 'wuxu'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    priority: 70,
    icon: markRaw(IconOrderedList),
    title: 'Ordered List',
    keywords: ['orderedlist', 'ol', 'youxu'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    priority: 80,
    icon: markRaw(IconTaskList),
    title: 'Task List',
    keywords: ['tasklist', 'todo', 'renwu'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    priority: 90,
    icon: markRaw(IconQuote),
    title: 'Blockquote',
    keywords: ['blockquote', 'quote', 'yinyong'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    priority: 100,
    icon: markRaw(IconCodeBlock),
    title: 'Code Block',
    keywords: ['codeblock', 'code', 'daima'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    priority: 110,
    icon: markRaw(IconHorizontalRule),
    title: 'Divider',
    keywords: ['hr', 'divider', 'fengexian'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    priority: 120,
    icon: markRaw(IconTablePlus),
    title: 'Table',
    keywords: ['table', 'biaoge'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    priority: 130,
    icon: markRaw(IconImage),
    title: 'Image',
    keywords: ['image', 'img', 'tupian'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor.chain().focus().deleteRange(range).run();
      openUrlInputModal({
        title: 'Enter image URL',
        placeholder: 'https://example.com/image.png',
        onConfirm: (url) => {
          editor.chain().focus().setImage({ src: url }).run();
        },
      });
    },
  },
  {
    priority: 135,
    icon: markRaw(IconCallout),
    title: 'Callout',
    keywords: ['callout', 'tishikuang', 'warning', 'info'],
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor.chain().focus().deleteRange(range).toggleCallout().run();
    },
  },
];

function getCommandMenuItemsFromExtensions(editor: any): CommandMenuItem[] {
  const extensionManager = editor?.extensionManager;
  const items: CommandMenuItem[] = [];
  if (extensionManager) {
    for (const extension of extensionManager.extensions as AnyExtension[]) {
      const { getCommandMenuItems } = extension.options;
      if (!getCommandMenuItems) {
        continue;
      }

      const result = getCommandMenuItems();
      if (Array.isArray(result)) {
        items.push(...result);
        continue;
      }

      items.push(result);
    }
  }

  const allItems = [...builtinCommandItems, ...items];
  const seen = new Set<string>();
  const unique = allItems.filter((item) => {
    if (seen.has(item.title)) {
      return false;
    }
    seen.add(item.title);
    return true;
  });

  return unique.toSorted((a, b) => a.priority - b.priority);
}

function updatePosition(editor: any, element: HTMLElement) {
  const { from } = editor.state.selection;
  const domRect = editor.view.coordsAtPos(from);

  const virtualElement = {
    getBoundingClientRect: () => ({
      width: 0,
      height: domRect.bottom - domRect.top,
      top: domRect.top,
      bottom: domRect.bottom,
      left: domRect.left,
      right: domRect.left,
      x: domRect.left,
      y: domRect.top,
      toJSON: () => ({}),
    }),
  };

  computePosition(virtualElement as any, element, {
    placement: 'bottom-start',
    strategy: 'absolute',
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.position = strategy;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.zIndex = '9999';
  });
}

export const ExtensionCommandsMenu = Extension.create({
  name: 'commands-menu',

  addProseMirrorPlugins() {
    const commandMenuItems = getCommandMenuItemsFromExtensions(this.editor);

    const suggestionPlugin: Partial<SuggestionOptions> = {
      editor: this.editor as any,
      command: ({
        editor,
        range,
        props: itemProps,
      }: {
        editor: any;
        props: CommandMenuItem;
        range: any;
      }) => {
        itemProps.command({ editor, range });
      },
      items: ({ query }: { query: string }) => {
        return commandMenuItems.filter((item) =>
          [...item.keywords, item.title].some((keyword) =>
            keyword.toLowerCase().includes(query.toLowerCase()),
          ),
        );
      },
      render: () => {
        let component: null | VueRenderer = null;
        return {
          onStart: (props: any) => {
            component = new VueRenderer(CommandsView, {
              props,
              editor: props.editor,
            });
            if (!props.clientRect || !component.element) {
              return;
            }
            if (!(component.element instanceof HTMLElement)) {
              return;
            }

            component.element.style.position = 'absolute';
            document.body.append(component.element);
            updatePosition(props.editor, component.element);
          },

          onUpdate(props: any) {
            if (!component?.element) {
              return;
            }
            if (!(component.element instanceof HTMLElement)) {
              return;
            }

            component.updateProps(props);
            if (!props.clientRect) {
              return;
            }

            updatePosition(props.editor, component.element);
          },

          onKeyDown(props: any) {
            if (!component) {
              return false;
            }
            if (props.event.key === 'Escape') {
              if (!component.element) {
                return false;
              }
              component.destroy();
              component.element.remove();
              return true;
            }

            return (component.ref as any)?.onKeyDown(props);
          },

          onExit() {
            if (!component?.element) {
              return;
            }
            component.destroy();
            component.element.remove();
          },
        };
      },
    };

    return [
      Suggestion({
        pluginKey: new PluginKey('commands-menu-english'),
        char: '/',
        ...suggestionPlugin,
      } as SuggestionOptions),
      Suggestion({
        pluginKey: new PluginKey('commands-menu-chinese'),
        char: '、',
        ...suggestionPlugin,
      } as SuggestionOptions),
    ];
  },
});
