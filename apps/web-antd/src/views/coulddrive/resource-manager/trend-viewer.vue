<script setup lang="ts">
import type { ResourceDetail, ResourceViewTrendData } from '#/api';
import type { EchartsUIType } from '@vben/plugins/echarts';

import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { getResourceViewTrendApi } from '#/api';

// Props
interface Props {
  resource: ResourceDetail | null;
}

const props = defineProps<Props>();

// 趋势数据
const trendChartData = ref<ResourceViewTrendData[]>([]);
const loading = ref(false);

// 图表实例
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 图表配置
const chartConfig = computed(() => ({
  title: {
    text: '浏览量趋势',
    left: 'center',
    textStyle: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any) => {
      const data = params[0];
      const date = new Date(data.name);
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}<br/>浏览量: ${data.value} 次`;
    },
  },
  xAxis: {
    type: 'category',
    data: trendChartData.value.map(item => item.record_time),
    axisLabel: {
      formatter: (value: string) => {
        const date = new Date(value);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      },
    },
  },
  yAxis: {
    type: 'value',
    name: '浏览量',
    axisLabel: {
      formatter: (value: number) => value.toString(),
    },
  },
  series: [
    {
      name: '浏览量',
      type: 'line',
      data: trendChartData.value.map(item => item.view_count),
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

// 获取趋势数据
async function fetchTrendData() {
  if (!props.resource || !props.resource.pwd_id) return;

  loading.value = true;
  try {
    const params = {
      pwd_id: props.resource.pwd_id,
      // 可以添加时间范围参数
      // start_time: '',
      // end_time: '',
    };
    const response = await getResourceViewTrendApi(params);
    trendChartData.value = response.trend_data || [];

    // 更新图表
    renderChart();
  } catch (error) {
    console.error('获取趋势数据失败:', error);
    trendChartData.value = [];
  } finally {
    loading.value = false;
  }
}

// 渲染图表
function renderChart() {
  if (trendChartData.value.length === 0) return;

  renderEcharts(chartConfig.value);
}

// 初始化图表
function initChart() {
  renderChart();
}

// 销毁图表
function destroyChart() {
  // EchartsUI 组件会自动处理销毁
}

// 暴露给父组件的方法
defineExpose({
  fetchTrendData,
  renderChart,
});

// 监听资源变化
watch(() => props.resource, async (newResource) => {
  if (newResource) {
    await fetchTrendData();
  }
}, { immediate: true });

// 计算增长最快的连续端点
function getFastestGrowthPeriod() {
  if (!trendChartData.value || trendChartData.value.length < 2) {
    return null;
  }

  let maxGrowth = 0;
  let maxGrowthPeriod = null;

  for (let i = 0; i < trendChartData.value.length - 1; i++) {
    const current = trendChartData.value[i];
    const next = trendChartData.value[i + 1];
    const growth = next.view_count - current.view_count;

    if (growth > maxGrowth) {
      maxGrowth = growth;
      maxGrowthPeriod = {
        startDate: current.record_time,
        endDate: next.record_time,
        startViews: current.view_count,
        endViews: next.view_count,
        growth: growth
      };
    }
  }

  return maxGrowthPeriod;
}

// 监听数据变化，重新渲染图表
watch(() => trendChartData.value, () => {
  setTimeout(() => {
    renderChart();
  }, 100);
});
</script>

<template>
  <div class="space-y-6">
    <!-- 资源信息 -->
    <div v-if="resource" class="bg-gray-50 rounded-lg p-4">
      <div class="flex items-start space-x-4">
        <img
          v-if="resource.resource_image"
          :src="resource.resource_image"
          :alt="resource.main_name"
          class="w-16 h-16 rounded-lg object-cover"
        />
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ resource.main_name }}
          </h3>
          <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span class="font-medium">领域：</span>
              {{ resource.domain }}
            </div>
            <div>
              <span class="font-medium">科目：</span>
              {{ resource.subject }}
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

    <!-- 趋势图表 -->
    <div class="bg-white rounded-lg border p-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-gray-900">
          浏览趋势 (最近30天)
        </h4>
        <div v-if="loading" class="text-sm text-gray-500">
          加载中...
        </div>
      </div>

      <!-- 有数据时显示图表 -->
      <EchartsUI
        v-if="!loading && trendChartData.length > 0"
        ref="chartRef"
        class="w-full h-80"
        style="min-height: 320px;"
      />

      <!-- 数据为空时的提示 -->
      <div
        v-if="!loading && trendChartData.length === 0"
        class="flex items-center justify-center h-80 text-gray-500 bg-gray-50 rounded-lg"
      >
        <div class="text-center">
          <div class="text-6xl mb-4 opacity-50">📊</div>
          <div class="text-lg font-medium text-gray-600 mb-2">暂无趋势数据</div>
          <div class="text-sm text-gray-500">该资源尚未有浏览量记录</div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div
        v-if="loading"
        class="flex items-center justify-center h-80 text-gray-500"
      >
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div class="text-lg font-medium text-gray-600">加载中...</div>
        </div>
      </div>
    </div>

    <!-- 数据统计 -->
    <div v-if="!loading && trendChartData.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="text-sm font-medium text-blue-700">总浏览量</div>
        <div class="text-2xl font-semibold text-blue-900">
          {{ trendChartData.reduce((sum, item) => sum + item.view_count, 0) }}
        </div>
      </div>
      <div class="bg-green-50 rounded-lg p-4">
        <div class="text-sm font-medium text-green-700">平均日浏览量</div>
        <div class="text-2xl font-semibold text-green-900">
          {{ Math.round(trendChartData.reduce((sum, item) => sum + item.view_count, 0) / trendChartData.length) }}
        </div>
      </div>
      <div class="bg-orange-50 rounded-lg p-4">
        <div class="text-sm font-medium text-orange-700">最高日浏览量</div>
        <div class="text-2xl font-semibold text-orange-900">
          {{ Math.max(...trendChartData.map(item => item.view_count)) }}
        </div>
      </div>
      <div class="bg-purple-50 rounded-lg p-4">
        <div class="text-sm font-medium text-purple-700">数据天数</div>
        <div class="text-2xl font-semibold text-purple-900">
          {{ trendChartData.length }}
        </div>
      </div>
    </div>

    <!-- 趋势分析 -->
    <div v-if="!loading && trendChartData.length > 0" class="bg-white rounded-lg border p-6">
      <h4 class="text-lg font-semibold text-gray-900 mb-4">
        趋势分析
      </h4>

      <!-- 增长最快的连续端点 -->
      <div v-if="getFastestGrowthPeriod()" class="bg-green-50 rounded-lg p-4 border border-green-200">
        <h5 class="text-sm font-semibold text-green-700 mb-2 flex items-center">
          <span class="mr-2">🚀</span>
          增长最快的连续端点
        </h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700">时间段：</span>
            <span class="text-gray-900">
              {{ new Date(getFastestGrowthPeriod()?.startDate).toLocaleDateString() }}
              →
              {{ new Date(getFastestGrowthPeriod()?.endDate).toLocaleDateString() }}
            </span>
          </div>
          <div>
            <span class="font-medium text-gray-700">增长量：</span>
            <span class="text-green-600 font-bold">+{{ getFastestGrowthPeriod()?.growth }}</span>
            <span class="text-gray-500 ml-1">
              ({{ getFastestGrowthPeriod()?.startViews }} → {{ getFastestGrowthPeriod()?.endViews }})
            </span>
          </div>
        </div>
      </div>

      <!-- 无增长数据提示 -->
      <div v-else class="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h5 class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <span class="mr-2">📊</span>
          增长分析
        </h5>
        <p class="text-sm text-gray-600">暂无明显增长趋势或数据点不足</p>
      </div>

      <!-- 总体趋势分析 -->
      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-blue-600">
            {{ trendChartData.length > 1 ?
                Math.round(((trendChartData[trendChartData.length - 1].view_count - trendChartData[0].view_count) / trendChartData[0].view_count) * 100) : 0 }}%
          </div>
          <div class="text-sm text-blue-700">总增长率</div>
        </div>
        <div class="bg-orange-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-orange-600">
            {{ trendChartData.length > 1 ?
                Math.round((trendChartData[trendChartData.length - 1].view_count - trendChartData[0].view_count) / (trendChartData.length - 1)) : 0 }}
          </div>
          <div class="text-sm text-orange-700">平均日增长</div>
        </div>
        <div class="bg-purple-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-purple-600">
            {{ trendChartData.length > 0 ?
                Math.max(...trendChartData.map(item => item.view_count)) - Math.min(...trendChartData.map(item => item.view_count)) : 0 }}
          </div>
          <div class="text-sm text-purple-700">最大波动</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 图表容器样式 */
#trend-chart {
  background: #fff;
  border-radius: 8px;
}
</style>
