import { markRaw } from "vue";
import MingcuteEraserLine from "~icons/mingcute/eraser-line";
import ToolbarItem from "#/components/JiaEditor/components/toolbar/ToolbarItem.vue";
import { i18n } from "#/components/JiaEditor/locales";
import type { Editor } from "#/components/JiaEditor/tiptap";
import { Extension } from "#/components/JiaEditor/tiptap";
import type { ExtensionOptions } from "#/components/JiaEditor/types";

export type ExtensionClearFormatOptions = ExtensionOptions;

export const ExtensionClearFormat =
  Extension.create<ExtensionClearFormatOptions>({
    name: "clearFormat",

    addOptions() {
      return {
        getToolbarItems({ editor }: { editor: Editor }) {
          return {
            priority: 23,
            component: markRaw(ToolbarItem),
            props: {
              editor,
              isActive: false,
              icon: markRaw(MingcuteEraserLine),
              title: i18n.global.t("editor.common.clear_format"),
              action: () => editor.chain().focus().unsetAllMarks().run(),
            },
          };
        },
      };
    },

    addKeyboardShortcuts() {
      return {
        "Mod-\\": () => this.editor.chain().focus().unsetAllMarks().run(),
      };
    },
  });

