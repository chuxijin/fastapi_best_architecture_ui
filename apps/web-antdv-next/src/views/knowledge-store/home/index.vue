<script lang="ts" setup>
import { onBeforeUnmount, ref, shallowRef } from 'vue';

import { VbenCountToAnimator } from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';

import { Button, Modal } from 'ant-design-vue';

import {
  RichTextEditor as HaloEditor,
  ExtensionsKit,
  VueEditor,
} from '#/components/HaloEditor';

const DEFAULT_CONTENT = '<p>Hello! 这是一个基础版 HaloEditor，可先直接输入和编辑内容。</p>';

interface StatItem {
  icon: any;
  title: string;
  totalValue: number;
  monthValue: number;
  todayValue: number;
  monthLabel: string;
  todayLabel: string;
}

interface OperationTool {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  link?: string;
}

const statItems: StatItem[] = [
  {
    icon: SvgCardIcon,
    title: '系统总用户数',
    totalValue: 15_680,
    monthValue: 1280,
    todayValue: 156,
    monthLabel: '本月新增',
    todayLabel: '今日新增',
  },
  {
    icon: SvgCakeIcon,
    title: '付费总人数',
    totalValue: 3240,
    monthValue: 520,
    todayValue: 48,
    monthLabel: '本月新增',
    todayLabel: '今日新增',
  },
  {
    icon: SvgDownloadIcon,
    title: '总成交金额',
    totalValue: 1_256_800,
    monthValue: 89_600,
    todayValue: 8960,
    monthLabel: '本月新增',
    todayLabel: '今日新增',
  },
  {
    icon: SvgBellIcon,
    title: '本月活跃用户',
    totalValue: 8920,
    monthValue: 2340,
    todayValue: 456,
    monthLabel: '本周活跃',
    todayLabel: '今日活跃',
  },
];

const operationTools: OperationTool[] = [
  {
    icon: 'mdi:file-document-edit',
    title: '协议管理',
    description:
      '用户在使用该系统或系统内的资源时，告知用户某些协议内容的简介工具',
    enabled: false,
  },
  {
    icon: 'mdi:clipboard-list',
    title: '信息采集',
    description: '在系统内，通过用户填写，提交收集用户信息或进行某些调研',
    enabled: false,
  },
  {
    icon: 'mdi:crown',
    title: 'VIP管理',
    description: '设置VIP用户，用户可以拥有某些权限和福利',
    enabled: false,
  },
  {
    icon: 'mdi:account-group',
    title: '代理商',
    description: '设置代理商，代理商对网校内的商品资源进行代理分销',
    enabled: false,
    link: '联系商务开通',
  },
  {
    icon: 'mdi:monitor-dashboard',
    title: '小程序刷题页广告',
    description: '设置小程序刷题页广告',
    enabled: false,
  },
  {
    icon: 'mdi:account-multiple',
    title: '销售团队',
    description: '管理销售人员与团队，制定销售目标，分析销售数据',
    enabled: false,
    link: '联系商务开通',
  },
  {
    icon: 'mdi:web',
    title: '短网址',
    description: '解决长网址传播受限的问题，缩短网址长度，易于传播',
    enabled: false,
  },
  {
    icon: 'mdi:qrcode',
    title: '接端工具',
    description: '线下完成商品接端',
    enabled: true,
    link: '进入',
  },
];

// ===== 编辑器相关 =====
const editorVisible = ref(false);
const editorLoading = ref(false);
const editor = shallowRef<VueEditor>();
const editorStatus = ref('已切换到最新 JiaEditor，当前为精简稳定模式');

async function openEditor() {
  editorVisible.value = true;

  if (editor.value) {
    return;
  }

  editorLoading.value = true;
  editorStatus.value = '正在初始化最新 JiaEditor 精简稳定模式...';

  try {
    editor.value = new VueEditor({
      content: DEFAULT_CONTENT,
      extensions: [
        ExtensionsKit.configure({
          codeBlock: {
            languages: [
              { label: 'Auto', value: 'auto' },
              { label: 'None', value: 'none' },
              { label: 'Plain Text', value: 'plaintext' },
              { label: 'ABAP', value: 'abap' },
              { label: 'ActionScript', value: 'actionscript' },
              { label: 'Ada', value: 'ada' },
              { label: 'Angular HTML', value: 'angular' },
              { label: 'Angular TypeScript', value: 'angular-ts' },
              { label: 'Bash', value: 'bash' },
              { label: 'C', value: 'c' },
              { label: 'C++', value: 'cpp' },
              { label: 'C#', value: 'csharp' },
              { label: 'CSS', value: 'css' },
              { label: 'Dart', value: 'dart' },
              { label: 'Go', value: 'go' },
              { label: 'HTML', value: 'xml' },
              { label: 'Java', value: 'java' },
              { label: 'JavaScript', value: 'javascript' },
              { label: 'JSON', value: 'json' },
              { label: 'Kotlin', value: 'kotlin' },
              { label: 'Markdown', value: 'markdown' },
              { label: 'PHP', value: 'php' },
              { label: 'Python', value: 'python' },
              { label: 'Ruby', value: 'ruby' },
              { label: 'Rust', value: 'rust' },
              { label: 'SQL', value: 'sql' },
              { label: 'Swift', value: 'swift' },
              { label: 'TypeScript', value: 'typescript' },
              { label: 'YAML', value: 'yaml' },
            ]
          }
        })
      ],
    });
    editorStatus.value = '最新 HaloEditor 已就绪，已加载全部内置原生丰富插件功能';
  } catch (e) {
    editorStatus.value = `JiaEditor 加载失败: ${e}`;
    console.error('[JiaEditor] Init failed:', e);
  } finally {
    editorLoading.value = false;
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold">知识店铺首页</h2>
        <p class="mt-1 text-muted-foreground">实时统计看板与最新 JiaEditor 联调页</p>
      </div>
      <Button type="primary" @click="openEditor">
        打开 JiaEditor
      </Button>
    </div>

    <Modal
      v-model:open="editorVisible"
      title="JiaEditor 测试台"
      :width="1000"
      :footer="null"
      destroy-on-close
    >
      <div v-if="editorStatus" class="mb-2 text-sm text-gray-500">
        {{ editorStatus }}
      </div>
      <div v-if="editorLoading" class="flex items-center justify-center py-20">
        正在加载编辑器...
      </div>
      <div
        v-else-if="editor"
        class="overflow-hidden rounded-lg border border-gray-200"
        style="min-height: 400px"
      >
        <HaloEditor :editor="editor" locale="zh-CN" />
      </div>
      <div v-else class="py-20 text-center text-red-500">HaloEditor 加载失败</div>
    </Modal>

    <div class="rounded-lg border bg-card p-6 shadow-sm">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <template v-for="item in statItems" :key="item.title">
          <div class="rounded-lg border bg-background p-6">
            <h3 class="mb-4 text-xl font-semibold text-foreground">
              {{ item.title }}
            </h3>

            <div class="mb-4 flex items-center justify-between">
              <VbenCountToAnimator
                :end-val="item.totalValue"
                :start-val="1"
                class="text-2xl font-bold"
                prefix=""
              />
              <component :is="item.icon" class="size-8 flex-shrink-0" />
            </div>

            <div class="space-y-2 border-t border-border pt-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">{{ item.monthLabel }}</span>
                <VbenCountToAnimator
                  :end-val="item.monthValue"
                  :start-val="1"
                  class="font-semibold text-blue-600"
                  prefix=""
                />
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">{{ item.todayLabel }}</span>
                <VbenCountToAnimator
                  :end-val="item.todayValue"
                  :start-val="1"
                  class="font-semibold text-green-600"
                  prefix=""
                />
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="mt-6 rounded-lg border bg-card p-6 shadow-sm">
      <h3 class="mb-4 text-lg font-semibold">运营工具</h3>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <template v-for="tool in operationTools" :key="tool.title">
          <div class="rounded-lg border bg-background p-6">
            <div class="mb-4 flex items-start">
              <div
                class="flex size-12 items-center justify-center rounded-full bg-blue-100"
              >
                <span class="text-2xl text-blue-600">
                  <i :class="tool.icon"></i>
                </span>
              </div>
            </div>

            <h4 class="mb-2 text-base font-semibold text-foreground">
              {{ tool.title }}
            </h4>

            <p class="mb-4 text-sm leading-relaxed text-muted-foreground">
              {{ tool.description }}
            </p>

            <div class="flex items-center justify-between">
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  :checked="tool.enabled"
                  class="peer sr-only"
                  disabled
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"
                ></div>
              </label>

              <a
                v-if="tool.link"
                href="javascript:void(0)"
                class="text-sm text-blue-600 hover:underline"
              >
                {{ tool.link }}
              </a>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
