<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { SocialWorkTrendPoint } from '#/api';

import { computed, defineExpose, defineProps, nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { getSocialWorkTrendApi } from '#/api';

defineProps<{ title?: string; workId: null | number }>();

const open = ref(false);
const loading = ref(false);
const points = ref<SocialWorkTrendPoint[]>([]);

// ECharts 实例
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const chartOption = computed(() => ({
  title: { text: '指标趋势', left: 'center' as const },
  tooltip: { trigger: 'axis' as const },
  legend: { data: ['浏览量', '点赞', '收藏', '评论', '分享'], top: 24 },
  xAxis: {
    type: 'category' as const,
    data: points.value.map((x) => x.record_time),
  },
  yAxis: { type: 'value' as const, name: '数量' },
  series: [
    {
      name: '浏览量',
      type: 'line' as const,
      smooth: true,
      data: points.value.map((x) => x.view_count),
    },
    {
      name: '点赞',
      type: 'line' as const,
      smooth: true,
      data: points.value.map((x) => x.like_count),
    },
    {
      name: '收藏',
      type: 'line' as const,
      smooth: true,
      data: points.value.map((x) => x.favorite_count),
    },
    {
      name: '评论',
      type: 'line' as const,
      smooth: true,
      data: points.value.map((x) => x.comment_count),
    },
    {
      name: '分享',
      type: 'line' as const,
      smooth: true,
      data: points.value.map((x) => x.share_count),
    },
  ],
  grid: { left: '10%', right: '10%', bottom: '12%', top: 56 },
}));

// 辅助分析函数
function getActualDays() {
  if (points.value.length < 2) return 0;
  const firstDate = new Date(points.value[0]?.record_time || '');
  const lastDate = new Date(
    points.value[points.value.length - 1]?.record_time || '',
  );
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1;
}

function getFastestGrowthPeriod() {
  if (!points.value || points.value.length < 2)
    return null as null | {
      endDate: string;
      endViews: number;
      growth: number;
      startDate: string;
      startViews: number;
    };

  // 每日最早数据点
  const dailyEarliest = new Map<
    string,
    { record_time: string; view_count: number }
  >();
  points.value.forEach((p) => {
    const key = new Date(p.record_time).toDateString();
    const ex = dailyEarliest.get(key);
    if (!ex || new Date(p.record_time) < new Date(ex.record_time))
      dailyEarliest.set(key, p);
  });
  const dailyPoints = [...dailyEarliest.values()].sort(
    (a, b) =>
      new Date(a.record_time).getTime() - new Date(b.record_time).getTime(),
  );
  if (dailyPoints.length < 2) return null;

  let maxGrowth = 0;
  let res: null | {
    endDate: string;
    endViews: number;
    growth: number;
    startDate: string;
    startViews: number;
  } = null;
  for (let i = 0; i < dailyPoints.length - 1; i++) {
    const a = dailyPoints[i];
    const b = dailyPoints[i + 1];
    if (!a || !b) continue;
    const g = (b.view_count || 0) - (a.view_count || 0);
    if (g > maxGrowth) {
      maxGrowth = g;
      res = {
        startDate: a.record_time || '',
        endDate: b.record_time || '',
        startViews: a.view_count || 0,
        endViews: b.view_count || 0,
        growth: g,
      };
    }
  }
  return res;
}

async function openWith(workId: number) {
  open.value = true;
  loading.value = true;
  try {
    const resp = await getSocialWorkTrendApi(workId);
    points.value = Array.isArray(resp) ? resp : (resp as any)?.data || [];
    await nextTick();
    // 首次打开后渲染
    if (points.value.length > 0) renderEcharts(chartOption.value);
  } finally {
    loading.value = false;
  }
}

// 数据变化时重渲染
watch(points, async () => {
  if (!open.value) return;
  await nextTick();
  if (points.value.length > 0) renderEcharts(chartOption.value);
});

defineExpose({ openWith });
</script>

<template>
  <a-modal
    v-model:open="open"
    :title="title || '指标趋势'"
    :footer="null"
    width="880px"
  >
    <div
      v-if="loading"
      class="flex h-80 items-center justify-center text-gray-500"
    >
      <div class="text-center">
        <div
          class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"
        ></div>
        <div class="text-lg font-medium text-gray-600">加载中...</div>
      </div>
    </div>
    <div v-else>
      <EchartsUI ref="chartRef" class="h-80 w-full" style="min-height: 320px" />
      <div
        v-if="points.length === 0"
        class="flex h-80 items-center justify-center text-gray-500"
      >
        暂无趋势数据
      </div>
      <div v-else class="mt-4 space-y-3">
        <div class="rounded-lg border bg-white p-4">
          <h4 class="mb-2 text-base font-semibold text-gray-900">趋势分析</h4>
          <div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-5">
            <div class="rounded-lg bg-blue-50 p-3 text-center">
              <div class="text-2xl font-bold text-blue-600">
                {{ points[points.length - 1]?.view_count || 0 }}
              </div>
              <div class="text-blue-700">当前浏览量</div>
            </div>
            <div class="rounded-lg bg-green-50 p-3 text-center">
              <div class="text-2xl font-bold text-green-600">
                {{ points.length }}
              </div>
              <div class="text-green-700">数据点数</div>
            </div>
            <div class="rounded-lg bg-purple-50 p-3 text-center">
              <div class="text-2xl font-bold text-purple-600">
                {{
                  points.length > 1 && points[0]
                    ? Math.round(
                        (((points[points.length - 1]?.view_count || 0) -
                          (points[0]?.view_count || 0)) /
                          Math.max(points[0]?.view_count || 0, 1)) *
                          100,
                      )
                    : 0
                }}%
              </div>
              <div class="text-purple-700">总增长率</div>
            </div>
            <div class="rounded-lg bg-orange-50 p-3 text-center">
              <div class="text-2xl font-bold text-orange-600">
                {{
                  points.length > 1 && points[0]
                    ? Math.round(
                        ((points[points.length - 1]?.view_count || 0) -
                          (points[0]?.view_count || 0)) /
                          getActualDays(),
                      )
                    : 0
                }}
              </div>
              <div class="text-orange-700">平均日增长</div>
            </div>
            <div class="rounded-lg bg-red-50 p-3 text-center">
              <div class="text-2xl font-bold text-red-600">
                {{
                  points.length > 0
                    ? Math.max(...points.map((p) => p.view_count)) -
                      Math.min(...points.map((p) => p.view_count))
                    : 0
                }}
              </div>
              <div class="text-red-700">最大波动</div>
            </div>
          </div>
        </div>

        <div
          v-if="getFastestGrowthPeriod()"
          class="rounded-lg border bg-green-50 p-4"
        >
          <h5
            class="mb-2 flex items-center text-sm font-semibold text-green-700"
          >
            <span class="mr-2">🚀</span> 增长最快的连续增长点
          </h5>
          <div class="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <div>
              <span class="font-medium text-gray-700">时间段：</span>
              <span class="text-gray-900"
                >{{ getFastestGrowthPeriod()!.startDate }} →
                {{ getFastestGrowthPeriod()!.endDate }}</span
              >
            </div>
            <div>
              <span class="font-medium text-gray-700">增长量：</span>
              <span class="font-bold text-green-600"
                >+{{ getFastestGrowthPeriod()!.growth }}</span
              >
              <span class="ml-1 text-gray-500"
                >({{ getFastestGrowthPeriod()!.startViews }} →
                {{ getFastestGrowthPeriod()!.endViews }})</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>
