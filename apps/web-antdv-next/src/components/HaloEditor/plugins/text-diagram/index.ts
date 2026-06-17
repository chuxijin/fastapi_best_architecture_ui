import type { Editor, Range } from '#/components/HaloEditor';

import { markRaw } from 'vue';

import icon from '~icons/mdi/sitemap';

import {
  mergeAttributes,
  Node,
  ToolboxItem,
  VueNodeViewRenderer,
} from '#/components/HaloEditor';

import TextDiagramView from './TextDiagramView.vue';

export type TextDiagramOptions = {
  HTMLAttributes: Record<string, any>;
};

export const ExtensionTextDiagram = Node.create<TextDiagramOptions>({
  name: 'text-diagram',
  inline: false,
  content: '',
  marks: '',
  group: 'block',
  code: true,
  atom: true,
  defining: true,
  addAttributes() {
    return {
      type: {
        default: 'mermaid',
        parseHTML: (element) => element.dataset.type,
        renderHTML: (attributes) => {
          return attributes.type
            ? {
                'data-type': attributes.type,
              }
            : {};
        },
      },
      content: {
        default: '',
        parseHTML: (element) => element.dataset.content,
        renderHTML: (attributes) => {
          return attributes.content
            ? {
                'data-content': attributes.content,
              }
            : {};
        },
      },
      src: {
        default: '',
        parseHTML: (element) => element.dataset.src,
        renderHTML: (attributes) => {
          return attributes.src
            ? {
                'data-src': attributes.src,
              }
            : {};
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'text-diagram[data-type]',
      },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    switch (node.attrs.type) {
      case 'mermaid': {
        return [
          'text-diagram',
          mergeAttributes(HTMLAttributes),
          node.attrs.content,
        ];
      }
      case 'plantuml': {
        return [
          'text-diagram',
          mergeAttributes(HTMLAttributes),
          [
            'img',
            {
              src: HTMLAttributes['data-src'],
            },
          ],
        ];
      }
      default: {
        // unknown type
        return [
          'text-diagram',
          mergeAttributes(HTMLAttributes),
          node.attrs.content,
        ];
      }
    }
  },
  addNodeView() {
    return VueNodeViewRenderer(TextDiagramView);
  },
  addOptions() {
    return {
      HTMLAttributes: {},
      ...this.parent?.(),
      getToolboxItems({ editor }: { editor: Editor }) {
        return [
          {
            priority: 100,
            component: markRaw(ToolboxItem),
            props: {
              editor,
              icon: markRaw(icon),
              title: '文本绘图',
              action: () => {
                editor
                  .chain()
                  .focus()
                  .insertContent([
                    { type: 'text-diagram', attrs: {} },
                    { type: 'paragraph', content: '' },
                  ])
                  .run();
              },
            },
          },
        ];
      },
      // 扩展指令项
      getCommandMenuItems() {
        return {
          priority: 100,
          icon: markRaw(icon),
          title: '文本绘图',
          keywords: ['text-diagram', 'wenbenhuitu'],
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent([
                { type: 'text-diagram', attrs: {} },
                { type: 'paragraph', content: '' },
              ])
              .run();
          },
        };
      },
    };
  },
});
