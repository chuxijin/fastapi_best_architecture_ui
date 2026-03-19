<script lang="ts" setup>
import type { Editor } from '@tiptap/vue-3';

import { markRaw } from 'vue';

/**
 * 缂傛牞绶崳?Bubble Menu - 闁鑵戦弬鍥х摟閸氬骸鑴婇崙铏规畱濞搭喖濮╁銉ュ徔閺?
 * 閹碱剝鍤?Halo EditorBubbleMenu.vue閿涘瞼鐣濋崠鏍﹁礋閸愬懐鐤嗛崶鍝勭暰妞?
 */
import { BubbleMenu } from '@tiptap/vue-3/menus';

import BubbleItem from './BubbleItem.vue';
import {
  IconBold,
  IconCode,
  IconHighlight,
  IconItalic,
  IconLink,
  IconStrike,
  IconUnderline,
} from './icons';
import { openUrlInputModal } from './urlInput';

const props = defineProps<{
  editor: Editor;
}>();

const bubbleItems = [
  {
    priority: 10,
    props: {
      icon: markRaw(IconBold),
      title: 'Bold',
      isActive: ({ editor }: { editor: Editor }) => editor.isActive('bold'),
      action: ({ editor }: { editor: Editor }) =>
        editor.chain().focus().toggleBold().run(),
    },
  },
  {
    priority: 20,
    props: {
      icon: markRaw(IconItalic),
      title: 'Italic',
      isActive: ({ editor }: { editor: Editor }) => editor.isActive('italic'),
      action: ({ editor }: { editor: Editor }) =>
        editor.chain().focus().toggleItalic().run(),
    },
  },
  {
    priority: 30,
    props: {
      icon: markRaw(IconUnderline),
      title: 'Underline',
      isActive: ({ editor }: { editor: Editor }) =>
        editor.isActive('underline'),
      action: ({ editor }: { editor: Editor }) =>
        editor.chain().focus().toggleUnderline().run(),
    },
  },
  {
    priority: 40,
    props: {
      icon: markRaw(IconStrike),
      title: 'Strike',
      isActive: ({ editor }: { editor: Editor }) => editor.isActive('strike'),
      action: ({ editor }: { editor: Editor }) =>
        editor.chain().focus().toggleStrike().run(),
    },
  },
  {
    priority: 50,
    props: {
      icon: markRaw(IconCode),
      title: '鐞涘苯鍞存禒锝囩垳',
      isActive: ({ editor }: { editor: Editor }) => editor.isActive('code'),
      action: ({ editor }: { editor: Editor }) =>
        editor.chain().focus().toggleCode().run(),
    },
  },
  {
    priority: 60,
    props: {
      icon: markRaw(IconHighlight),
      title: 'Highlight',
      isActive: ({ editor }: { editor: Editor }) =>
        editor.isActive('highlight'),
      action: ({ editor }: { editor: Editor }) =>
        editor.chain().focus().toggleHighlight().run(),
    },
  },
  {
    priority: 70,
    props: {
      icon: markRaw(IconLink),
      title: 'Link',
      isActive: ({ editor }: { editor: Editor }) => editor.isActive('link'),
      action: ({ editor }: { editor: Editor }) => {
        const prev = editor.getAttributes('link').href;
        openUrlInputModal({
          title: '璇疯緭鍏ラ摼鎺?URL',
          initialValue: prev,
          placeholder: 'https://example.com',
          onEmpty: () => {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
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
  },
];

function shouldShow({
  editor,
  from,
  to,
}: {
  editor: any;
  from: number;
  to: number;
}) {
  if (!editor.isEditable) return false;
  // 濞屸剝婀侀柅澶夎厬閺傚洤鐡ч弮鏈电瑝閺勫墽銇?
  if (from === to) return false;
  // 閸︺劋鍞惍浣告健娑擃厺绗夐弰鍓с仛
  if (editor.isActive('codeBlock')) return false;
  return true;
}
</script>

<template>
  <BubbleMenu :editor="editor" :should-show="shouldShow" :update-delay="0">
    <div class="bubble-menu">
      <BubbleItem
        v-for="item in bubbleItems"
        :key="item.priority"
        :editor="editor"
        v-bind="item.props"
      />
    </div>
  </BubbleMenu>
</template>

<style scoped>
.bubble-menu {
  display: flex;
  gap: 2px;
  align-items: center;
  max-width: calc(100vw - 30px);
  padding: 4px;
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
}
</style>
