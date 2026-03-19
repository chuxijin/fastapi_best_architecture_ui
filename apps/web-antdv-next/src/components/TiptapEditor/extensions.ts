import type { Editor } from '@tiptap/vue-3';

import type { ExtensionOptions } from './types';

import { markRaw } from 'vue';

import TiptapBlockquote from '@tiptap/extension-blockquote';
import TiptapBold from '@tiptap/extension-bold';
import TiptapBulletList from '@tiptap/extension-bullet-list';
import TiptapCode from '@tiptap/extension-code';
import TiptapCodeBlock from '@tiptap/extension-code-block';
import TiptapColor from '@tiptap/extension-color';
import TiptapDocument from '@tiptap/extension-document';
import TiptapDropcursor from '@tiptap/extension-dropcursor';
import TiptapGapcursor from '@tiptap/extension-gapcursor';
import TiptapHardBreak from '@tiptap/extension-hard-break';
import TiptapHeading from '@tiptap/extension-heading';
import TiptapHighlight from '@tiptap/extension-highlight';
import TiptapHistory from '@tiptap/extension-history';
import TiptapHorizontalRule from '@tiptap/extension-horizontal-rule';
import TiptapImage from '@tiptap/extension-image';
import TiptapItalic from '@tiptap/extension-italic';
import TiptapLink from '@tiptap/extension-link';
import TiptapListItem from '@tiptap/extension-list-item';
import TiptapOrderedList from '@tiptap/extension-ordered-list';
import TiptapParagraph from '@tiptap/extension-paragraph';
import TiptapPlaceholder from '@tiptap/extension-placeholder';
import TiptapStrike from '@tiptap/extension-strike';
import TiptapSubscript from '@tiptap/extension-subscript';
import TiptapSuperscript from '@tiptap/extension-superscript';
import { Table as TiptapTable } from '@tiptap/extension-table';
import TiptapTableCell from '@tiptap/extension-table-cell';
import TiptapTableHeader from '@tiptap/extension-table-header';
import TiptapTableRow from '@tiptap/extension-table-row';
import TiptapTaskItem from '@tiptap/extension-task-item';
import TiptapTaskList from '@tiptap/extension-task-list';
import TiptapText from '@tiptap/extension-text';
import TiptapTextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import TiptapUnderline from '@tiptap/extension-underline';
/**
 * 缂傛牞绶崳銊﹀⒖鐏炴洟鍘ょ純顕嗙礄娑?Halo 閺堚偓閺傛壆澧楃€靛綊缍堥敍?
 *
 * 閹碘偓閺堝澧跨仦鏇⑩偓姘崇箖 .extend() 閹稿倽娴?getToolbarItems閿?
 * 瀹搞儱鍙块弽蹇斿瘻闁筋噣鈧俺绻?priority 閹烘帒绨敍瀛峝itorToolbar 閼奉亜濮╅弨鍫曟肠濞撳弶鐓嬮妴?
 *
 * priority 閺勭姴鐨犻敍鍫滅瑢 Halo extensions-kit.ts 娣囨繃瀵旀稉鈧懛杈剧礆閿?
 *   10/20  閹俱倝鏀?闁插秴浠?
 *   23     濞撳懘娅庨弽鐓庣础
 *   25     閺嶇厧绱￠崚?
 *   30     閺嶅洭顣介敍鍫滅瑓閹峰绱?
 *   31     鐎涙褰块敍鍫滅瑓閹峰绱?
 *   40     閸旂姷鐭?
 *   50     閺傛粈缍?
 *   60     娑撳鍨濈痪?
 *   70     閸掔娀娅庣痪?
 *   80     妤傛ü瀵?
 *   81     鐎涙ぞ缍嬫０婊嗗
 *   85     鐞涘苯鍞存禒锝囩垳
 *   90     瀵洜鏁?
 *   100    閺冪姴绨崚妤勩€?
 *   110    閺堝绨崚妤勩€?/ 娑撳﹥鐖?
 *   120    娑撳鐖?/ 娴狅絿鐖滈崸?
 *   130    閸掑棗澹婄痪?
 *   140    鐎靛綊缍堥敍鍫滅瑓閹峰绱?
 *   150    闁剧偓甯?
 *   160    閸ュ墽澧?
 *   170    鐞涖劍鐗搁敍鍫熷絻閸忋儻绱?
 */
import { Extension } from '@tiptap/vue-3';

import { ExtensionBlockMath } from './blockMath';
import { ExtensionCallout } from './callout';
import ColorToolbarItem from './ColorToolbarItem.vue';
import { ExtensionColumns } from './columns';
import { ExtensionCommandsMenu } from './commandsMenu';
import { ExtensionEnterBreakout } from './enterBreakout';
import HighlightToolbarItem from './HighlightToolbarItem.vue';
import {
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconBold,
  IconBulletList,
  IconClearFormat,
  IconCode,
  IconCodeBlock,
  IconColor,
  IconFontSize,
  IconH1,
  IconH2,
  IconH3,
  IconH4,
  IconH5,
  IconH6,
  IconHighlight,
  IconHorizontalRule,
  iconifyIcon,
  IconImage,
  IconItalic,
  IconLink,
  IconOrderedList,
  IconParagraph,
  IconQuote,
  IconRedo,
  IconStrike,
  IconSubscript,
  IconSuperscript,
  IconTablePlus,
  IconTaskList,
  IconUnderline,
  IconUndo,
} from './icons';
import { ExtensionInlineMath } from './inlineMath';
import { ExtensionLeadingNode } from './leadingNode';
import { ExtensionMermaid } from './mermaidDiagram';
import ToolbarButton from './ToolbarButton.vue';
import ToolbarSubItem from './ToolbarSubItem.vue';
import { ExtensionTrailingNode } from './trailingNode';
import { openUrlInputModal } from './urlInput';

const IconLineHeight = iconifyIcon('mingcute:line-height-line');

// -------- 閼惧嘲褰囬弽鍥暯瑜版挸澧犻崶鐐垼 --------
function getHeadingIcon(editor: Editor) {
  if (editor.isActive('heading', { level: 1 })) return IconH1;
  if (editor.isActive('heading', { level: 2 })) return IconH2;
  if (editor.isActive('heading', { level: 3 })) return IconH3;
  if (editor.isActive('heading', { level: 4 })) return IconH4;
  if (editor.isActive('heading', { level: 5 })) return IconH5;
  if (editor.isActive('heading', { level: 6 })) return IconH6;
  return IconParagraph;
}

/**
 * 閸掓稑缂撻幍鈧張澶岀椽鏉堟垵娅掗幍鈺佺潔閿涘牆鍑￠幐鍌濇祰瀹搞儱鍙块弽蹇涘帳缂冾噯绱?
 */
export function createExtensions(placeholder = '鐠囩柉绶崗銉ュ敶鐎?..') {
  return [
    // ========== 閸╄櫣顢呰箛鍛淬€?==========
    TiptapDocument,
    TiptapText,
    TiptapParagraph,
    TiptapHardBreak,
    TiptapDropcursor.configure({ width: 2, color: 'skyblue' }),
    TiptapGapcursor,
    TiptapListItem,
    TextStyle,

    // ========== 閹俱倝鏀?闁插秴浠?(10/20) ==========
    TiptapHistory.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return [
              {
                priority: 10,
                component: markRaw(ToolbarButton),
                props: {
                  editor,
                  isActive: false,
                  icon: markRaw(IconUndo),
                  title: '閹俱倝鏀?(Ctrl+Z)',
                  action: () => editor.chain().undo().focus().run(),
                },
              },
              {
                priority: 20,
                component: markRaw(ToolbarButton),
                props: {
                  editor,
                  isActive: false,
                  icon: markRaw(IconRedo),
                  title: '闁插秴浠?(Ctrl+Y)',
                  action: () => editor.chain().redo().focus().run(),
                },
              },
            ];
          },
        };
      },
    }),

    // ========== 濞撳懘娅庨弽鐓庣础 (23) ==========
    Extension.create<ExtensionOptions>({
      name: 'clearFormat',
      addOptions() {
        return {
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 23,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: false,
                icon: markRaw(IconClearFormat),
                title: String.raw`濞撳懘娅庨弽鐓庣础 (Ctrl+\)`,
                action: () => editor.chain().focus().unsetAllMarks().run(),
              },
            };
          },
        };
      },
      addKeyboardShortcuts() {
        return {
          'Mod-\\': () => this.editor.chain().focus().unsetAllMarks().run(),
        };
      },
    }),

    // ========== 閺嶅洭顣?(30) ==========
    TiptapHeading.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          levels: [1, 2, 3, 4, 5, 6],
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 30,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive:
                  editor.isActive('paragraph') || editor.isActive('heading'),
                icon: markRaw(getHeadingIcon(editor)),
                title: 'Heading',
              },
              children: [
                {
                  priority: 10,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive('paragraph'),
                    icon: markRaw(IconParagraph),
                    title: 'Paragraph',
                    action: () => editor.chain().focus().setParagraph().run(),
                  },
                },
                {
                  priority: 20,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive('heading', { level: 1 }),
                    icon: markRaw(IconH1),
                    title: '閺嶅洭顣?1',
                    action: () =>
                      editor.chain().focus().toggleHeading({ level: 1 }).run(),
                  },
                },
                {
                  priority: 30,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive('heading', { level: 2 }),
                    icon: markRaw(IconH2),
                    title: '閺嶅洭顣?2',
                    action: () =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run(),
                  },
                },
                {
                  priority: 40,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive('heading', { level: 3 }),
                    icon: markRaw(IconH3),
                    title: '閺嶅洭顣?3',
                    action: () =>
                      editor.chain().focus().toggleHeading({ level: 3 }).run(),
                  },
                },
                {
                  priority: 50,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive('heading', { level: 4 }),
                    icon: markRaw(IconH4),
                    title: '閺嶅洭顣?4',
                    action: () =>
                      editor.chain().focus().toggleHeading({ level: 4 }).run(),
                  },
                },
                {
                  priority: 60,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive('heading', { level: 5 }),
                    icon: markRaw(IconH5),
                    title: '閺嶅洭顣?5',
                    action: () =>
                      editor.chain().focus().toggleHeading({ level: 5 }).run(),
                  },
                },
                {
                  priority: 70,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive('heading', { level: 6 }),
                    icon: markRaw(IconH6),
                    title: '閺嶅洭顣?6',
                    action: () =>
                      editor.chain().focus().toggleHeading({ level: 6 }).run(),
                  },
                },
              ],
            };
          },
        };
      },
    }),

    // ========== 鐎涙褰?(31) ==========
    Extension.create<ExtensionOptions>({
      name: 'fontSize',
      addOptions() {
        return {
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 31,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: false,
                icon: markRaw(IconFontSize),
                title: 'Font Size',
              },
              children: [
                {
                  priority: 0,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: false,
                    title: 'Default',
                    action: () =>
                      editor.chain().focus().unsetMark('textStyle').run(),
                  },
                },
                ...[12, 14, 16, 18, 20, 24, 30, 36, 48].map((size) => ({
                  priority: size,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: false,
                    title: `${size} px`,
                    action: () =>
                      editor
                        .chain()
                        .focus()
                        .setMark('textStyle', { fontSize: `${size}px` })
                        .run(),
                  },
                })),
              ],
            };
          },
        };
      },
      addGlobalAttributes() {
        return [
          {
            types: ['textStyle'],
            attributes: {
              fontSize: {
                default: null,
                parseHTML: (element: HTMLElement) =>
                  element.style.fontSize || null,
                renderHTML: (attributes: Record<string, any>) => {
                  if (!attributes.fontSize) return {};
                  return { style: `font-size: ${attributes.fontSize}` };
                },
              },
            },
          },
        ];
      },
    }),

    // ========== 鐞涘矂妫跨捄?(32) ==========
    Extension.create<ExtensionOptions>({
      name: 'lineHeight',
      addOptions() {
        return {
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 32,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: false,
                icon: markRaw(IconLineHeight),
                title: 'Line Height',
              },
              children: [
                {
                  priority: 0,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: false,
                    title: 'Default',
                    action: () =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes('paragraph', { lineHeight: null })
                        .updateAttributes('heading', { lineHeight: null })
                        .run(),
                  },
                },
                ...[1, 1.5, 1.75, 2, 2.5, 3].map((lh, i) => ({
                  priority: (i + 1) * 10,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: false,
                    title: `${lh} line height`,
                    action: () =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes('paragraph', { lineHeight: `${lh}` })
                        .updateAttributes('heading', { lineHeight: `${lh}` })
                        .run(),
                  },
                })),
              ],
            };
          },
        };
      },
      addGlobalAttributes() {
        return [
          {
            types: ['paragraph', 'heading'],
            attributes: {
              lineHeight: {
                default: null,
                parseHTML: (element: HTMLElement) =>
                  element.style.lineHeight || null,
                renderHTML: (attributes: Record<string, any>) => {
                  if (!attributes.lineHeight) return {};
                  return { style: `line-height: ${attributes.lineHeight}` };
                },
              },
            },
          },
        ];
      },
    }),

    // ========== 閸旂姷鐭?(40) ==========
    TiptapBold.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 40,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('bold'),
                icon: markRaw(IconBold),
                title: '閸旂姷鐭?(Ctrl+B)',
                action: () => editor.chain().focus().toggleBold().run(),
              },
            };
          },
        };
      },
    }),

    // ========== 閺傛粈缍?(50) ==========
    TiptapItalic.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 50,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('italic'),
                icon: markRaw(IconItalic),
                title: '閺傛粈缍?(Ctrl+I)',
                action: () => editor.chain().focus().toggleItalic().run(),
              },
            };
          },
        };
      },
    }),

    // ========== 娑撳鍨濈痪?(60) ==========
    TiptapUnderline.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 60,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('underline'),
                icon: markRaw(IconUnderline),
                title: '娑撳鍨濈痪?(Ctrl+U)',
                action: () => editor.chain().focus().toggleUnderline().run(),
              },
            };
          },
        };
      },
    }),

    // ========== 閸掔娀娅庣痪?(70) ==========
    TiptapStrike.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 70,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('strike'),
                icon: markRaw(IconStrike),
                title: '閸掔娀娅庣痪?(Ctrl+Shift+S)',
                action: () => editor.chain().focus().toggleStrike().run(),
              },
            };
          },
        };
      },
    }),

    // ========== 妤傛ü瀵?(80) - 閼瑰弶婢樼紒鍕 ==========
    TiptapHighlight.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          multicolor: true,
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 80,
              component: markRaw(HighlightToolbarItem),
              props: {
                editor,
                isActive: editor.isActive('highlight'),
                icon: markRaw(IconHighlight),
                title: 'Highlight',
              },
            };
          },
        };
      },
    }),

    // ========== 鐎涙ぞ缍嬫０婊嗗 (81) - 閼瑰弶婢樼紒鍕 ==========
    TiptapColor.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 81,
              component: markRaw(ColorToolbarItem),
              props: {
                editor,
                isActive: false,
                icon: markRaw(IconColor),
                title: '鐎涙ぞ缍嬫０婊嗗',
              },
            };
          },
        };
      },
    }),

    // ========== 鐞涘苯鍞存禒锝囩垳 (85) ==========
    TiptapCode.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 85,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('code'),
                icon: markRaw(IconCode),
                title: '鐞涘苯鍞存禒锝囩垳',
                action: () => editor.chain().focus().toggleCode().run(),
              },
            };
          },
        };
      },
    }),

    // ========== 瀵洜鏁?(90) ==========
    TiptapBlockquote.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 90,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('blockquote'),
                icon: markRaw(IconQuote),
                title: 'Quote',
                action: () => editor.commands.toggleBlockquote(),
              },
            };
          },
        };
      },
    }),

    // ========== 閸掓銆冮崺铏诡攨閺€顖涘瘮 ==========
    TiptapBulletList,
    TiptapOrderedList,
    TiptapTaskList,

    // ========== 閸掓銆冩稉瀣閼挎粌宕?(100) ==========
    Extension.create<ExtensionOptions>({
      name: 'listDropdown',
      addOptions() {
        return {
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 100,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive:
                  editor.isActive('bulletList') ||
                  editor.isActive('orderedList') ||
                  editor.isActive('taskList'),
                icon: markRaw(IconBulletList),
              },
              children: [
                {
                  priority: 1,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive('bulletList'),
                    icon: markRaw(IconBulletList),
                    title: 'Bullet List',
                    action: () => {
                      editor.chain().focus().toggleBulletList().run();
                    },
                  },
                },
                {
                  priority: 2,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive('orderedList'),
                    icon: markRaw(IconOrderedList),
                    title: 'Ordered List',
                    action: () => {
                      editor.chain().focus().toggleOrderedList().run();
                    },
                  },
                },
                {
                  priority: 3,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive('taskList'),
                    icon: markRaw(IconTaskList),
                    title: 'Task List',
                    action: () => {
                      editor.chain().focus().toggleTaskList().run();
                    },
                  },
                },
              ],
            };
          },
        };
      },
    }),
    TiptapTaskItem.configure({ nested: true }),

    // ========== 娑撳﹥鐖?(110) ==========
    TiptapSuperscript.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 110,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('superscript'),
                icon: markRaw(IconSuperscript),
                title: 'Superscript',
                action: () => editor.chain().focus().toggleSuperscript().run(),
              },
            };
          },
        };
      },
    }),

    // ========== 娑撳鐖?(120) ==========
    TiptapSubscript.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 120,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('subscript'),
                icon: markRaw(IconSubscript),
                title: 'Subscript',
                action: () => editor.chain().focus().toggleSubscript().run(),
              },
            };
          },
        };
      },
    }),

    // ========== 娴狅絿鐖滈崸?(125) ==========
    TiptapCodeBlock.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 125,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('codeBlock'),
                icon: markRaw(IconCodeBlock),
                title: 'Code Block',
                action: () => editor.chain().focus().toggleCodeBlock().run(),
              },
            };
          },
        };
      },
    }),

    // ========== 閸掑棗澹婄痪?(130) ==========
    TiptapHorizontalRule.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 130,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: false,
                icon: markRaw(IconHorizontalRule),
                title: 'Divider',
                action: () => editor.chain().focus().setHorizontalRule().run(),
              },
            };
          },
        };
      },
    }),

    // ========== 鐎靛綊缍?(140) ==========
    TiptapTextAlign.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          types: ['heading', 'paragraph'],
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 140,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: false,
                icon: markRaw(IconAlignLeft),
                title: '鐎靛綊缍堥弬鐟扮础',
              },
              children: [
                {
                  priority: 10,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive({ textAlign: 'left' }),
                    icon: markRaw(IconAlignLeft),
                    title: 'Align Left',
                    action: () =>
                      editor.chain().focus().setTextAlign('left').run(),
                  },
                },
                {
                  priority: 20,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive({ textAlign: 'center' }),
                    icon: markRaw(IconAlignCenter),
                    title: 'Align Center',
                    action: () =>
                      editor.chain().focus().setTextAlign('center').run(),
                  },
                },
                {
                  priority: 30,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive({ textAlign: 'right' }),
                    icon: markRaw(IconAlignRight),
                    title: 'Align Right',
                    action: () =>
                      editor.chain().focus().setTextAlign('right').run(),
                  },
                },
                {
                  priority: 40,
                  component: markRaw(ToolbarSubItem),
                  props: {
                    editor,
                    isActive: editor.isActive({ textAlign: 'justify' }),
                    icon: markRaw(IconAlignJustify),
                    title: 'Justify',
                    action: () =>
                      editor.chain().focus().setTextAlign('justify').run(),
                  },
                },
              ],
            };
          },
        };
      },
    }),

    // ========== 闁剧偓甯?(150) ==========
    TiptapLink.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          openOnClick: false,
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 150,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('link'),
                icon: markRaw(IconLink),
                title: 'Link',
                action: () => {
                  const prev = editor.getAttributes('link').href;
                  openUrlInputModal({
                    title: '璇疯緭鍏ラ摼鎺?URL',
                    initialValue: prev,
                    placeholder: 'https://example.com',
                    onEmpty: () => {
                      editor
                        .chain()
                        .focus()
                        .extendMarkRange('link')
                        .unsetLink()
                        .run();
                    },
                    onConfirm: (url) => {
                      editor
                        .chain()
                        .focus()
                        .extendMarkRange('link')
                        .setLink({ href: url })
                        .run();
                    },
                  });
                },
              },
            };
          },
        };
      },
    }),

    // ========== 閸ュ墽澧?(160) ==========
    TiptapImage.extend<ExtensionOptions>({
      addOptions() {
        return {
          ...this.parent?.(),
          inline: false,
          allowBase64: true,
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 160,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: false,
                icon: markRaw(IconImage),
                title: '閹绘帒鍙嗛崶鍓у',
                action: () => {
                  openUrlInputModal({
                    title: '璇疯緭鍏ュ浘鐗?URL',
                    placeholder: 'https://example.com/image.png',
                    onConfirm: (url) => {
                      editor.chain().focus().setImage({ src: url }).run();
                    },
                  });
                },
              },
            };
          },
        };
      },
    }),

    // ========== 鐞涖劍鐗?(170) ==========
    TiptapTable.configure({ resizable: true }),
    TiptapTableRow,
    TiptapTableCell,
    TiptapTableHeader,
    Extension.create<ExtensionOptions>({
      name: 'tableToolbar',
      addOptions() {
        return {
          getToolbarItems({ editor }: { editor: Editor }) {
            return {
              priority: 170,
              component: markRaw(ToolbarButton),
              props: {
                editor,
                isActive: editor.isActive('table'),
                icon: markRaw(IconTablePlus),
                title: '閹绘帒鍙嗙悰銊︾壐',
                action: () =>
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run(),
              },
            };
          },
        };
      },
    }),

    // ========== 閸掑棙鐖?(180) ==========
    ExtensionColumns,

    // ========== 閹绘劗銇氬?(190) ==========
    ExtensionCallout,

    // ========== 鐞涘苯鍞撮崗顒€绱?(200) ==========
    ExtensionInlineMath,

    // ========== 閸ф楠囬崗顒€绱?(205) ==========
    ExtensionBlockMath,

    // ========== Mermaid 缂佹ê娴?(210) ==========
    ExtensionMermaid,

    // ========== 闂堢偛浼愰崗閿嬬埉閹碘晛鐫?==========
    ExtensionTrailingNode,
    ExtensionLeadingNode,
    ExtensionEnterBreakout,
    TiptapPlaceholder.configure({ placeholder }),

    // ========== Slash Commands閿? 閸涙垝鎶ら懣婊冨礋閿?==========
    ExtensionCommandsMenu,
  ];
}
