import {
  TextStyle,
  type TextStyleOptions,
} from "@tiptap/extension-text-style";

export type ExtensionTextStyleOptions = Partial<TextStyleOptions>;

export const ExtensionTextStyle =
  TextStyle.extend<ExtensionTextStyleOptions>({
    // Set the priority of this extension to 110 to ensure it loads before other extensions.
    // It must load before the highlight plugin, otherwise, it will cause span and mark to display in parallel.
    priority: 110,
  });
