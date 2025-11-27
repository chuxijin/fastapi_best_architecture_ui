<script lang="ts" setup>
import { VbenCountToAnimator } from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';

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
</script>

<template>
  <div class="p-5">
    <div class="mb-4">
      <h2 class="text-2xl font-semibold">知识店铺首页</h2>
      <p class="text-muted-foreground mt-1">实时统计看板</p>
    </div>

    <div class="bg-card rounded-lg border p-6 shadow-sm">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <template v-for="item in statItems" :key="item.title">
          <div class="bg-background rounded-lg border p-6">
            <h3 class="text-foreground mb-4 text-xl font-semibold">
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

            <div class="border-border space-y-2 border-t pt-4">
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

    <div class="bg-card mt-6 rounded-lg border p-6 shadow-sm">
      <h3 class="mb-4 text-lg font-semibold">运营工具</h3>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <template v-for="tool in operationTools" :key="tool.title">
          <div class="bg-background rounded-lg border p-6">
            <div class="mb-4 flex items-start">
              <div
                class="flex size-12 items-center justify-center rounded-full bg-blue-100"
              >
                <span class="text-2xl text-blue-600">
                  <i :class="tool.icon"></i>
                </span>
              </div>
            </div>

            <h4 class="text-foreground mb-2 text-base font-semibold">
              {{ tool.title }}
            </h4>

            <p class="text-muted-foreground mb-4 text-sm leading-relaxed">
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
