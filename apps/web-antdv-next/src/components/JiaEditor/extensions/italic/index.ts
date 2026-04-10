import TiptapItalic, { type ItalicOptions } from "@tiptap/extension-italic";
import { markRaw } from "vue";
import MingcuteItalicLine from "~icons/mingcute/italic-line";
import ToolbarItem from "#/components/JiaEditor/components/toolbar/ToolbarItem.vue";
import { i18n } from "#/components/JiaEditor/locales";
import type { Editor } from "#/components/JiaEditor/tiptap";
import type { ExtensionOptions } from "#/components/JiaEditor/types";

export type ExtensionItalicOptions = ExtensionOptions & Partial<ItalicOptions>;

export const ExtensionItalic = TiptapItalic.extend<ExtensionItalicOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      getToolbarItems({ editor }: { editor: Editor }) {
        return {
          priority: 50,
          component: markRaw(ToolbarItem),
          props: {
            editor,
            isActive: editor.isActive(TiptapItalic.name),
            icon: markRaw(MingcuteItalicLine),
            title: i18n.global.t("editor.common.italic"),
            action: () => editor.chain().focus().toggleItalic().run(),
          },
        };
      },
    };
  },
});

