import HyperlinkBubbleButton from "../components/HyperlinkBubbleButton.vue";
import HyperlinkPropsBubbleButton from "../components/HyperlinkPropsBubbleButton.vue";
import HyperlinkView from "../components/HyperlinkView.vue";
import LinkViewBubbleMenuItem from "../components/LinkViewBubbleMenuItem.vue";
import {
  deleteNode,
  type Editor,
  EditorState,
  type ExtensionOptions,
  getNodeAttributes,
  isActive,
  mergeAttributes,
  Node,
  type NodeBubbleMenuType,
  VueNodeViewRenderer,
  type Range,
  ToolboxItem
} from "../../..";
import MingcuteLinkLine from "~icons/mingcute/link-line";
import { markRaw } from "vue";
import MingcuteDelete2Line from "~icons/mingcute/delete-2-line?color=#dc2626";
import MingcuteShare3Line from "~icons/mingcute/share-3-line";
import linkViewTypes from "./link-view-type";

const HyperlinkCardExtension = Node.create<ExtensionOptions>({
  name: "hyperlinkCard",

  atom: true,

  group: "block",

  addAttributes() {
    return {
      target: {
        default: "_blank",
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute("target");
        },
      },
      href: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute("href");
        },
      },
      theme: {
        default: "regular",
        parseHTML: (element: HTMLElement) => {
          const theme = element.getAttribute("theme");
          // block 卡片的 Web Component 只支持 regular/grid/small
          // inline theme 应由 hyperlink-inline-card 处理
          if (theme === "inline" || !theme) return "regular";
          return theme;
        },
      },
      style: {
        default: "margin-top: 0.75em; margin-bottom: 0;",
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute("style");
        },
      },
      "custom-title": {
        default: null,
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute("custom-title");
        },
      },
      "custom-description": {
        default: null,
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute("custom-description");
        },
      },
      "custom-image": {
        default: null,
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute("custom-image");
        },
      },
    };
  },

  addOptions() {
    return {
      ...this.parent?.(),
      getBubbleMenu(): NodeBubbleMenuType {
        return {
          pluginKey: "linkViewBubbleMenu",
          shouldShow: ({ state }: { state: EditorState }) => {
            return isActive(state, HyperlinkCardExtension.name);
          },
          items: [
            {
              priority: 10,
              component: markRaw(LinkViewBubbleMenuItem),
              props: {
                type: ({ editor }: { editor: Editor }) => {
                  const attr = getNodeAttributes(editor.state, HyperlinkCardExtension.name);
                  return linkViewTypes.find((type) => type.key == attr.theme) || linkViewTypes[1];
                },
              },
            },
            {
              priority: 20,
              component: markRaw(HyperlinkBubbleButton),
              props: {
                name: HyperlinkCardExtension.name,
              },
            },
            {
              priority: 25,
              component: markRaw(HyperlinkPropsBubbleButton),
              props: {
                name: HyperlinkCardExtension.name,
              },
            },
            {
              priority: 30,
              props: {
                isActive: () => false,
                icon: markRaw(MingcuteShare3Line),
                title: "打开链接",
                action: ({ editor }: { editor: Editor }) => {
                  const attr = getNodeAttributes(editor.state, HyperlinkCardExtension.name);
                  if (attr?.href) {
                    window.open(attr?.href, "_blank");
                  }
                },
              },
            },
            {
              priority: 40,
              props: {
                icon: markRaw(MingcuteDelete2Line),
                title: "删除",
                action: ({ editor }) => {
                  deleteNode(HyperlinkCardExtension.name, editor);
                },
              },
            },
          ],
        };
      },
      // TODO: The drag-and-drop function of this component does not respond.
      // Maybe it's because of the Web component?
      getDraggable() {
        return true;
      },
      getCommandMenuItems() {
        return {
          priority: 85,
          icon: markRaw(MingcuteLinkLine),
          title: "超链接卡片",
          keywords: ["link", "card", "chaolianjie"],
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent([{ type: HyperlinkCardExtension.name, attrs: { href: "" } }])
              .run();
          },
        };
      },
      getToolboxItems({ editor }: { editor: Editor }) {
        return [
          {
            priority: 45,
            component: markRaw(ToolboxItem),
            props: {
              editor,
              icon: markRaw(MingcuteLinkLine),
              title: "超链接卡片",
              action: () => {
                editor
                  .chain()
                  .focus()
                  .insertContent([{ type: HyperlinkCardExtension.name, attrs: { href: "" } }])
                  .run();
              },
            },
          },
        ];
      },
    };
  },

  parseHTML() {
    return [{ tag: "hyperlink-card" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "hyperlink-card",
      mergeAttributes(HTMLAttributes),
      ["a", { href: HTMLAttributes.href, target: HTMLAttributes.target }, HTMLAttributes.href],
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(HyperlinkView);
  },
});

export default HyperlinkCardExtension;
