import type {
  Editor,
  EditorState,
  ExtensionOptions,
  Range,
} from '#/components/HaloEditor';

import { markRaw } from 'vue';

import { html } from '@codemirror/lang-html';
import { lineNumbers } from '@codemirror/view';
import MdiDeleteForeverOutline from '~icons/mdi/delete-forever-outline?color=red';
import MdiLanguageHtml5 from '~icons/mdi/language-html5';

import {
  findParentNode,
  Fragment,
  isActive,
  mergeAttributes,
  Node,
  ToolboxItem,
  VueNodeViewRenderer,
} from '#/components/HaloEditor';

import { deleteNode } from '../utils/delete-node';
import CodeMirrorView from './CodeMirrorView.vue';

const temporaryDocument = document.implementation.createHTMLDocument();
declare module '#/components/HaloEditor' {
  interface Commands<ReturnType> {
    htmlEdited: {
      addHtmlEdited: () => ReturnType;
      setSelectHtmlNode: () => ReturnType;
    };
  }
}

const HtmlEdited = Node.create<ExtensionOptions>({
  name: 'html_edited',

  content: 'text*',

  group: 'block',

  defining: true,

  addAttributes() {
    return {
      collapsed: {
        default: false,
        parseHTML: (element) => !!element.getAttribute('collapsed'),
        renderHTML: (attributes) => {
          if (attributes.collapsed) {
            return {
              collapsed: attributes.collapsed,
            };
          }
          return {};
        },
      },
    };
  },

  addOptions() {
    return {
      blockType: 'html',
      extensions: [
        html({
          matchClosingTags: true,
          autoCloseTags: true,
          selfClosingTags: true,
        }),
        lineNumbers(),
      ],
      getCommandMenuItems() {
        return {
          priority: 81,
          icon: markRaw(MdiLanguageHtml5),
          title: 'HTML 编辑块',
          keywords: ['html', '编辑块'],
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor
              .chain()
              .deleteRange(range)
              .addHtmlEdited()
              .setSelectHtmlNode()
              .run();
          },
        };
      },
      getToolboxItems({ editor }: { editor: Editor }) {
        return [
          {
            priority: 51,
            component: markRaw(ToolboxItem),
            props: {
              editor,
              icon: markRaw(MdiLanguageHtml5),
              title: 'HTML 编辑块',
              action: () => {
                editor.chain().addHtmlEdited().setSelectHtmlNode().run();
              },
            },
          },
        ];
      },
      getBubbleMenu() {
        return {
          pluginKey: 'htmlEditedBubbleMenu',
          shouldShow: ({ state }: { state: EditorState }): boolean => {
            return isActive(state, HtmlEdited.name);
          },
          items: [
            {
              priority: 100,
              props: {
                icon: markRaw(MdiDeleteForeverOutline),
                title: '删除',
                action: ({ editor }: { editor: Editor }) => {
                  deleteNode(HtmlEdited.name, editor);
                },
              },
            },
          ],
        };
      },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(CodeMirrorView);
  },

  addCommands() {
    return {
      addHtmlEdited:
        () =>
        ({ chain }) => {
          return chain().setNode(this.type).run();
        },
      setSelectHtmlNode:
        () =>
        ({ chain, state }) => {
          const htmlEditedNode = findParentNode(
            (node) => node.type.name === HtmlEdited.name,
          )(state.selection) as
            | undefined
            | {
                depth: number;
                pos: number;
                start: number;
              };
          if (!htmlEditedNode) {
            return false;
          }
          return chain().setNodeSelection(htmlEditedNode.pos).run();
        },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class=html-edited]',
        getContent: (node, schema) => {
          const htmlNode = node as HTMLElement;
          if (!htmlNode) {
            return Fragment.empty;
          }
          const textNode = schema.text(htmlNode.innerHTML);
          return Fragment.from(textNode);
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const content = node.content;
    if (content.size === 0) {
      return ['div', mergeAttributes(HTMLAttributes, {})];
    }
    const container = temporaryDocument.createElement('div');
    container.classList.add('html-edited');
    container.innerHTML = content.toJSON()[0].text;
    return {
      dom: container,
    };
  },
});

export default HtmlEdited;
