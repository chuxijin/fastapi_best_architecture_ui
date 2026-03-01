<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { getResourceViewTrendApi } from '#/api';

const props = defineProps<{
  resource: any | null;
}>();

// 趋势数据
const trendChartData = ref<Array<{ record_time: string; view_count: number }>>(
  [],
);
const currentViewCount = ref<number>(0);
const loading = ref(false);

// 图表实例
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 图表配置
const chartConfig = computed(() => ({
  title: {
    text: '浏览量趋势',
    left: 'center' as const,
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold' as const,
    },
  },
  tooltip: {
    trigger: 'axis' as const,
    formatter: (params: any) => {
      const data = params[0];
      return `${data.name}<br/>浏览量: ${data.value} 次`;
    },
  },
  xAxis: {
    type: 'category' as const,
    data: trendChartData.value.map((item) => item.record_time),
    axisLabel: {
      formatter: (value: string) => {
        const date = new Date(value);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      },
    },
  },
  yAxis: {
    type: 'value' as const,
    name: '浏览量',
    scale: true,
    min: (extent: { max: number; min: number }) => {
      const range = extent.max - extent.min;
      const pad = (range || 1) * 0.1;
      return extent.min - pad;
    },
    max: (extent: { max: number; min: number }) => {
      const range = extent.max - extent.min;
      const pad = (range || 1) * 0.1;
      return extent.max + pad;
    },
    axisLabel: {
      formatter: (value: number) => value.toString(),
    },
  },
  series: [
    {
      name: '浏览量',
      type: 'line' as const,
      data: trendChartData.value.map((item) => item.view_count),
      smooth: true,
      lineStyle: {
        color: '#1890ff',
        width: 2,
      },
      itemStyle: {
        color: '#1890ff',
      },
      symbol: 'circle',
      symbolSize: 4,
      areaStyle: {
        opacity: 0.1,
        color: '#1890ff',
      },
    },
  ],
  grid: {
    left: '10%',
    right: '10%',
    bottom: '15%',
    top: '20%',
  },
}));

// 获取实际天数
function getActualDays() {
  if (trendChartData.value.length < 2) return 0;

  const firstDate = new Date(trendChartData.value[0]?.record_time || '');
  const lastDate = new Date(
    trendChartData.value[trendChartData.value.length - 1]?.record_time || '',
  );

  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays || 1;
}

// 计算增长最快的连续端点（使用每日最早数据点）
function getFastestGrowthPeriod() {
  if (!trendChartData.value || trendChartData.value.length < 2) {
    return null as null | {
      endDate: string;
      endViews: number;
      growth: number;
      startDate: string;
      startViews: number;
    };
  }

  const dailyEarliestPoints = new Map<
    string,
    { record_time: string; view_count: number }
  >();

  trendChartData.value.forEach((item) => {
    const dateStr = new Date(item.record_time).toDateString();
    const existing = dailyEarliestPoints.get(dateStr);
    if (
      !existing ||
      new Date(item.record_time) < new Date(existing.record_time)
    ) {
      dailyEarliestPoints.set(dateStr, item);
    }
  });

  const dailyPoints = [...dailyEarliestPoints.values()].sort(
    (a, b) =>
      new Date(a.record_time).getTime() - new Date(b.record_time).getTime(),
  );

  if (dailyPoints.length < 2) return null;

  let maxGrowth = 0;
  let maxGrowthPeriod: null | {
    endDate: string;
    endViews: number;
    growth: number;
    startDate: string;
    startViews: number;
  } = null;

  for (let i = 0; i < dailyPoints.length - 1; i++) {
    const current = dailyPoints[i];
    const next = dailyPoints[i + 1];
    if (!current || !next) continue;
    const growth = next.view_count - current.view_count;
    if (growth > maxGrowth) {
      maxGrowth = growth;
      maxGrowthPeriod = {
        startDate: current.record_time || '',
        endDate: next.record_time || '',
        startViews: current.view_count || 0,
        endViews: next.view_count || 0,
        growth,
      };
    }
  }

  return maxGrowthPeriod;
}

// 获取趋势数据
async function fetchTrendData() {
  if (!props.resource || !props.resource.pwd_id) return;

  loading.value = true;
  try {
    const params = {
      pwd_id: props.resource.pwd_id,
    } as any;
    const response = await getResourceViewTrendApi(params);
    trendChartData.value = response.trend_data || [];
    currentViewCount.value = response.current_view_count || 0;

    // 更新图表
    renderChart();
  } catch (error) {
    console.error('获取趋势数据失败:', error);
    trendChartData.value = [];
    currentViewCount.value = 0;
  } finally {
    loading.value = false;
  }
}

// 渲染图表
function renderChart() {
  if (trendChartData.value.length === 0) return;
  renderEcharts(chartConfig.value);
}

defineExpose({ fetchTrendData, renderChart });

// 监听资源变化
watch(
  () => props.resource,
  async (newResource) => {
    if (newResource) {
      await fetchTrendData();
    }
  },
  { immediate: true },
);

// 监听数据变化，重新渲染图表
watch(
  () => trendChartData.value,
  () => {
    setTimeout(() => {
      renderChart();
    }, 100);
  },
);
</script>

<template>
  <div class="space-y-6">
    <div v-if="resource" class="rounded-lg bg-gray-50 p-4">
      <div class="flex items-start space-x-4">
        <img
          v-if="resource.resource_image"
          :src="resource.resource_image"
          :alt="resource.main_name"
          class="h-16 w-16 rounded-lg object-cover"
        />
        <div class="flex-1">
          <h3 class="mb-2 text-lg font-semibold text-gray-900">
            {{ resource.main_name }}
          </h3>
          <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span class="font-medium">分类：</span>
              {{ resource.category_name || resource.category_id || '无' }}
            </div>
            <div>
              <span class="font-medium">资源类型：</span>
              {{ resource.resource_type }}
            </div>
            <div>
              <span class="font-medium">总浏览量：</span>
              {{ resource.view_count || 0 }} 次
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border bg-white p-6">
      <div class="mb-4 flex items-center justify-between">
        <h4 class="text-lg font-semibold text-gray-900">浏览趋势 (最近30天)</h4>
        <div v-if="loading" class="text-sm text-gray-500">加载中...</div>
      </div>

      <EchartsUI
        v-if="!loading && trendChartData.length > 0"
        ref="chartRef"
        class="h-80 w-full"
        style="min-height: 320px"
      />

      <div
        v-if="!loading && trendChartData.length === 0"
        class="flex h-80 items-center justify-center rounded-lg bg-gray-50 text-gray-500"
      >
        <div class="text-center">
          <div class="mb-4 text-6xl opacity-50">📊</div>
          <div class="mb-2 text-lg font-medium text-gray-600">暂无趋势数据</div>
          <div class="text-sm text-gray-500">该资源尚未有浏览量记录</div>
        </div>
      </div>

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
    </div>
  </div>

  <!-- 趋势分析 -->
  <div
    v-if="!loading && trendChartData.length > 0"
    class="rounded-lg border bg-white p-6"
  >
    <h4 class="mb-4 text-lg font-semibold text-gray-900">趋势分析</h4>

    <!-- 增长最快的连续端点 -->
    <div
      v-if="getFastestGrowthPeriod()"
      class="rounded-lg border border-green-200 bg-green-50 p-4"
    >
      <h5 class="mb-2 flex items-center text-sm font-semibold text-green-700">
        <span class="mr-2">🚀</span>
        增长最快的连续增长点
      </h5>
      <div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div>
          <span class="font-medium text-gray-700">时间段：</span>
          <span class="text-gray-900">
            {{
              getFastestGrowthPeriod()
                ? getFastestGrowthPeriod()!.startDate
                : ''
            }}
            →
            {{
              getFastestGrowthPeriod() ? getFastestGrowthPeriod()!.endDate : ''
            }}
          </span>
        </div>
        <div>
          <span class="font-medium text-gray-700">增长量：</span>
          <span class="font-bold text-green-600"
            >+{{ getFastestGrowthPeriod()?.growth }}</span
          >
          <span class="ml-1 text-gray-500"
            >({{ getFastestGrowthPeriod()?.startViews }} →
            {{ getFastestGrowthPeriod()?.endViews }})</span
          >
        </div>
      </div>
    </div>

    <!-- 无增长数据提示 -->
    <div v-else class="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h5 class="mb-2 flex items-center text-sm font-semibold text-gray-700">
        <span class="mr-2">📊</span>
        增长分析
      </h5>
      <p class="text-sm text-gray-600">暂无明显增长趋势或数据点不足</p>
    </div>

    <!-- 总体趋势分析 -->
    <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
      <div class="rounded-lg bg-blue-50 p-4 text-center">
        <div class="text-2xl font-bold text-blue-600">
          {{ currentViewCount }}
        </div>
        <div class="text-sm text-blue-700">当前浏览量</div>
      </div>
      <div class="rounded-lg bg-green-50 p-4 text-center">
        <div class="text-2xl font-bold text-green-600">
          {{ trendChartData.length }}
        </div>
        <div class="text-sm text-green-700">数据点数</div>
      </div>
      <div class="rounded-lg bg-purple-50 p-4 text-center">
        <div class="text-2xl font-bold text-purple-600">
          {{
            trendChartData.length > 1 && trendChartData[0]
              ? Math.round(
                  (((trendChartData[trendChartData.length - 1]?.view_count ||
                    0) -
                    trendChartData[0].view_count) /
                    trendChartData[0].view_count) *
                    100,
                )
              : 0
          }}%
        </div>
        <div class="text-sm text-purple-700">总增长率</div>
      </div>
      <div class="rounded-lg bg-orange-50 p-4 text-center">
        <div class="text-2xl font-bold text-orange-600">
          {{
            trendChartData.length > 1 && trendChartData[0]
              ? Math.round(
                  ((trendChartData[trendChartData.length - 1]?.view_count ||
                    0) -
                    trendChartData[0].view_count) /
                    getActualDays(),
                )
              : 0
          }}
        </div>
        <div class="text-sm text-orange-700">平均日增长</div>
      </div>
      <div class="rounded-lg bg-red-50 p-4 text-center">
        <div class="text-2xl font-bold text-red-600">
          {{
            trendChartData.length > 0
              ? Math.max(...trendChartData.map((item) => item.view_count)) -
                Math.min(...trendChartData.map((item) => item.view_count))
              : 0
          }}
        </div>
        <div class="text-sm text-red-700">最大波动</div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
