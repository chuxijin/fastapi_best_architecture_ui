import TiptapStrike, { type StrikeOptions } from "@tiptap/extension-strike";
import { markRaw } from "vue";
import MingcuteStrikethroughLine from "~icons/mingcute/strikethrough-line";
import ToolbarItem from "#/components/JiaEditor/components/toolbar/ToolbarItem.vue";
import { i18n } from "#/components/JiaEditor/locales";
import type { Editor } from "#/components/JiaEditor/tiptap";
import type { ExtensionOptions } from "#/components/JiaEditor/types";

export type ExtensionStrikeOptions = ExtensionOptions & Partial<StrikeOptions>;

export const ExtensionStrike = TiptapStrike.extend<ExtensionStrikeOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      getToolbarItems({ editor }: { editor: Editor }) {
        return {
          priority: 70,
          component: markRaw(ToolbarItem),
          props: {
            editor,
            isActive: editor.isActive(TiptapStrike.name),
            icon: markRaw(MingcuteStrikethroughLine),
            title: i18n.global.t("editor.common.strike"),
            action: () => editor.chain().focus().toggleStrike().run(),
          },
        };
      },
    };
  },
});

