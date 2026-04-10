import {
  ExtensionsKit,
  VueEditor,
  type AnyExtension,
} from '@halo-dev/richtext-editor';

import {
  HTMLEditedExtension,
  MarkdownEditedExtension,
} from './plugins/hybrid-edit-block';

export const DEFAULT_JIA_EDITOR_EXTENSIONS: AnyExtension[] = [
  HTMLEditedExtension,
  MarkdownEditedExtension,
];

export const DEFAULT_JIA_EDITOR_CONTENT =
  '<p>Hello! 试试输入 <code>/</code> 可以看到内置的 HTML / Markdown 编辑块</p>';

export function createJiaEditor(
  content: string = DEFAULT_JIA_EDITOR_CONTENT,
  customExtensions: AnyExtension[] = DEFAULT_JIA_EDITOR_EXTENSIONS,
): VueEditor {
  return new VueEditor({
    content,
    extensions: [
      ExtensionsKit.configure({
        customExtensions,
      }),
    ],
  });
}
