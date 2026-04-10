import { Placeholder } from "@tiptap/extensions";
import { i18n } from "#/components/JiaEditor/locales";

export const ExtensionPlaceholder = Placeholder.configure({
  placeholder: i18n.global.t("editor.extensions.commands_menu.placeholder"),
});

