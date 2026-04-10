import { Node, mergeAttributes } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import ToolboxItem from "../../components/toolbox/ToolboxItem.vue";
import { markRaw } from "vue";
import MingcuteMarkPenLine from "~icons/mingcute/mark-pen-line";
import HighlightBlockView from "./HighlightBlockView.vue";

export interface HighlightBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlightBlock: {
      setHighlightBlock: () => ReturnType;
      toggleHighlightBlock: () => ReturnType;
    }
  }
}


export const HighlightBlock = Node.create<HighlightBlockOptions>({
  name: "highlightBlock",
  group: "block",
  content: "block+",
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "highlight-block",
      },
      getToolboxItems: ({ editor }: any) => {
        return [
          {
            priority: 45,
            component: markRaw(ToolboxItem),
            props: {
              editor,
              icon: markRaw(MingcuteMarkPenLine),
              title: "高亮块",
              action: () => {
                editor
                  .chain()
                  .focus()
                  .setHighlightBlock()
                  .run();
              },
            },
          },
        ];
      },
      getDraggableMenuItems: ({ editor }: any) => {
        return {
          extendsKey: "convert-to",
          title: () => "高亮块",
          icon: markRaw(MingcuteMarkPenLine),
          action: ({ editor, pos, node, close }: any) => {
            if (node) {
              const from = pos;
              const to = pos + node.nodeSize;
              editor.commands.setTextSelection({ from, to });
              editor.chain().focus().setHighlightBlock().run();
            }
            close();
          },
        };
      },
      getCommandMenuItems: () => {
        return [
          {
            priority: 45,
            icon: markRaw(MingcuteMarkPenLine),
            title: "高亮块",
            keywords: ["highlight", "callout", "gaoliangkuai", "glk", "tip"],
            command: ({ editor, range }: any) => {
              editor.chain().focus().deleteRange(range).setHighlightBlock().run();
            },
          },
        ];
      },
    };
  },

  addAttributes() {
    return {
      icon: {
        default: "🏕️",
      },
      textColor: {
        default: "inherit",
      },
      borderColor: {
        default: "#fb923c", // orange-400
      },
      backgroundColor: {
        default: "#fff7ed", // orange-50
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="highlight-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "highlight-block",
      }),
      0,
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(HighlightBlockView);
  },

  addCommands() {
    return {
      setHighlightBlock:
        () =>
        ({ commands }: any) => {
          return commands.wrapIn(this.name);
        },
      toggleHighlightBlock:
        () =>
        ({ commands }: any) => {
          return commands.toggleNode(this.name, "paragraph");
        },
    };
  },
});
