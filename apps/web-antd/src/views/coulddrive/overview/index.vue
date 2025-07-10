<script setup lang="ts">
import type { ResourceStatistics, CoulddriveUserListParams, CoulddriveSyncConfigListParams, OverallStatisticsTrendResponse } from '#/api';
import type { EchartsUIType } from '@vben/plugins/echarts';

import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

import { VbenButton } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import {
  getResourceStatisticsApi,
  getCoulddriveUserListApi,
  getCoulddriveSyncConfigListApi,
  getOverallStatisticsTrendApi
} from '#/api';

const router = useRouter();

// 创建图标组件
const FolderOpen = createIconifyIcon('mdi:folder-open');
const User = createIconifyIcon('mdi:account');
const Sync = createIconifyIcon('mdi:sync');
const CloudUpload = createIconifyIcon('mdi:cloud-upload');
const ArrowRight = createIconifyIcon('mdi:arrow-right');
const Info = createIconifyIcon('mdi:information');
const TrendingUp = createIconifyIcon('mdi:trending-up');
const ChartLine = createIconifyIcon('mdi:chart-line');
const Database = createIconifyIcon('mdi:database');
const Star = createIconifyIcon('mdi:star');
const Clock = createIconifyIcon('mdi:clock');

// 数据状态
const loading = ref(false);
const resourceStats = ref<ResourceStatistics | null>(null);
const userCount = ref(0);
const syncConfigCount = ref(0);
const trendData = ref<OverallStatisticsTrendResponse | null>(null);

// 图表相关
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 渲染图表
const renderChart = () => {
  if (!trendData.value?.trend_data?.length) return;

  const chartOptions = {
    title: {
      text: '资源增长趋势',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold' as const,
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#019680',
          width: 1,
        },
      }
    },
    legend: {
      data: ['总资源数', '总浏览量', '新增资源'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisTick: {
        show: false,
      },
      data: trendData.value.trend_data.map(item => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      })
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        position: 'left',
        axisTick: {
          show: false,
        },
        splitArea: {
          show: true,
        },
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '浏览量',
        position: 'right',
        axisTick: {
          show: false,
        },
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '总资源数',
        type: 'line',
        data: trendData.value.trend_data.map(item => item.total_count),
        smooth: true,
        lineStyle: {
          color: '#3b82f6'
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          opacity: 0.1,
          color: '#3b82f6'
        }
      },
      {
        name: '总浏览量',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.value.trend_data.map(item => item.total_views),
        smooth: true,
        lineStyle: {
          color: '#10b981'
        },
        itemStyle: {
          color: '#10b981'
        },
        areaStyle: {
          opacity: 0.1,
          color: '#10b981'
        }
      },
      {
        name: '新增资源',
        type: 'bar',
        data: trendData.value.trend_data.map(item => item.new_resources),
        itemStyle: {
          color: '#f59e0b'
        }
      }
    ]
  };

  renderEcharts(chartOptions);
};

// 统计数据
const stats = computed(() => [
  {
    title: '资源总数',
    value: resourceStats.value?.total_count || 0,
    icon: FolderOpen,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    route: '/coulddrive/resource-manager'
  },
  {
    title: '用户数量',
    value: userCount.value,
    icon: User,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    route: '/coulddrive/sync-manager'
  },
  {
    title: '同步配置',
    value: syncConfigCount.value,
    icon: Sync,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    route: '/coulddrive/sync-manager'
  },
  {
    title: '今日增长',
    value: resourceStats.value?.today_growth || 0,
    icon: TrendingUp,
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    route: '/coulddrive/resource-manager'
  }
]);

// 功能模块


// 刷新数据
const refreshStats = async () => {
  await loadStats();
};

// 加载统计数据
const loadStats = async () => {
  try {
    loading.value = true;

    // 并行加载所有统计数据
    const [resourceStatsRes, userListRes, syncConfigRes, trendRes] = await Promise.all([
      getResourceStatisticsApi(),
      getCoulddriveUserListApi({ page: 1, size: 1 }),
      getCoulddriveSyncConfigListApi({ page: 1, size: 1 }),
      getOverallStatisticsTrendApi({ days: 7 })
    ]);

    resourceStats.value = resourceStatsRes;
    userCount.value = userListRes?.total || 0;
    syncConfigCount.value = syncConfigRes?.total || 0;
    trendData.value = trendRes;

    // 数据加载完成后渲染图表
    setTimeout(() => {
      renderChart();
    }, 100);

  } catch (error) {
    console.error('加载统计数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

// 计算增长率
const calculateGrowthRate = (current?: number, previous?: number) => {
  if (current !== undefined && previous !== undefined) {
    if (previous === 0) return '+100';
    const rate = ((current - previous) / previous * 100).toFixed(1);
    return rate.startsWith('-') ? rate : '+' + rate;
  }

  // 默认计算资源增长率
  if (!trendData.value?.trend_data?.length) return '0';
  const firstItem = trendData.value.trend_data[0];
  const lastItem = trendData.value.trend_data[trendData.value.trend_data.length - 1];

  if (firstItem.total_count === 0) return '+100';
  const rate = ((lastItem.total_count - firstItem.total_count) / firstItem.total_count * 100).toFixed(1);
  return rate.startsWith('-') ? rate : '+' + rate;
};

// 页面跳转
const navigateTo = (route: string) => {
  router.push(route);
};

// 组件挂载时加载数据
onMounted(async () => {
  await loadStats();
});

// 支持的云盘平台
const supportedDrives = ref([
  { name: '百度网盘', icon: '🔵', status: '已支持', features: ['文件管理', '资源管理'] },
  { name: '夸克网盘', icon: '🟣', status: '已支持', features: ['文件管理', '资源管理'] },
  { name: '阿里云盘', icon: '🟠', status: '开发中', features: ['文件管理'] },
]);

// 最新功能
const newFeatures = ref([
  {
    title: '资源浏览量趋势分析',
    description: '新增资源浏览量历史记录和趋势图表，帮助您了解资源热度变化',
    icon: TrendingUp,
    date: '2024-01-15',
    type: 'feature',
  },
  {
    title: '批量资源管理',
    description: '支持批量导入、编辑和删除资源，提高管理效率',
    icon: Database,
    date: '2024-01-10',
    type: 'enhancement',
  },
  {
    title: '整体统计趋势',
    description: '新增整体资源统计趋势图表，实时展示资源增长和浏览量变化',
    icon: ChartLine,
    date: '2024-01-20',
    type: 'feature',
  },
]);

// 获取趋势洞察
const getTrendInsights = () => {
  if (!trendData.value?.trend_data?.length) return [];

  const insights: string[] = [];
  const lastItem = trendData.value.trend_data[trendData.value.trend_data.length - 1];
  const firstItem = trendData.value.trend_data[0];

  const totalResourcesGrowth = lastItem.total_count - firstItem.total_count;
  const totalViewsGrowth = lastItem.total_views - firstItem.total_views;
  const averageDailyNewResources = trendData.value.summary.average_daily_new_resources;
  const totalResourcesGrowthRate = calculateGrowthRate(lastItem.total_count, firstItem.total_count);

  if (totalResourcesGrowth > 0) {
    insights.push(`资源总数在过去 ${trendData.value.summary.period_days} 天内增长了 ${totalResourcesGrowth} 个。`);
  }
  if (totalViewsGrowth > 0) {
    insights.push(`总浏览量在过去 ${trendData.value.summary.period_days} 天内增长了 ${formatNumber(totalViewsGrowth)}。`);
  }
  if (averageDailyNewResources > 0) {
    insights.push(`平均每天新增 ${Math.round(averageDailyNewResources)} 个资源。`);
  }
  if (totalResourcesGrowthRate.startsWith('+')) {
    insights.push(`资源总数在过去 ${trendData.value.summary.period_days} 天内增长了 ${totalResourcesGrowthRate}。`);
  }

  return insights;
};
</script>

<template>
  <div class="p-5">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Coulddrive 云盘管理</h1>
        <p class="text-gray-600 mt-1">统一管理多个云盘平台，实现文件同步和资源管理自动化</p>
      </div>
      <div class="flex items-center gap-2">
        <VbenButton
          @click="refreshStats"
          :loading="loading"
          variant="outline"
          size="sm"
        >
          刷新数据
        </VbenButton>
        <CloudUpload class="text-blue-600 text-3xl" />
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.title"
        :class="`${stat.bgColor} rounded-lg p-4 border border-gray-200 relative cursor-pointer hover:shadow-md transition-all duration-200`"
        @click="navigateTo(stat.route)"
      >
        <!-- 加载状态覆盖层 -->
        <div
          v-if="loading"
          class="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center"
        >
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>

        <!-- 统计内容 -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">{{ stat.title }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatNumber(stat.value) }}</p>
            <p :class="`text-sm ${stat.iconColor} font-medium mt-1`">
              <component :is="stat.icon" class="inline w-4 h-4 mr-1" />
              点击查看详情
            </p>
          </div>
          <div :class="`p-3 rounded-lg ${stat.iconColor} bg-white bg-opacity-80`">
            <component :is="stat.icon" class="text-xl" />
          </div>
        </div>
      </div>
    </div>

    <!-- 资源趋势统计 -->
    <div v-if="resourceStats" class="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">资源趋势统计</h2>

        <!-- 资源趋势图表 -->
        <div class="mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <!-- 今日增长趋势 -->
            <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-blue-800">今日增长</h4>
                <TrendingUp class="text-blue-600" />
              </div>
              <div class="text-2xl font-bold text-blue-900">{{ resourceStats.today_growth }}</div>
              <div class="text-xs text-blue-700">
                比昨日 {{ calculateGrowthRate(resourceStats.total_views, resourceStats.today_start_views) }}
              </div>
            </div>

            <!-- 总浏览量趋势 -->
            <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-green-800">总浏览量</h4>
                <ChartLine class="text-green-600" />
              </div>
              <div class="text-2xl font-bold text-green-900">{{ formatNumber(resourceStats.total_views) }}</div>
              <div class="text-xs text-green-700">
                起始: {{ formatNumber(resourceStats.today_start_views) }}
              </div>
            </div>

            <!-- 活跃资源比例 -->
            <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-purple-800">活跃率</h4>
                <Database class="text-purple-600" />
              </div>
              <div class="text-2xl font-bold text-purple-900">
                {{ resourceStats.total_count > 0 ? Math.round((resourceStats.active_count / resourceStats.total_count) * 100) : 0 }}%
              </div>
              <div class="text-xs text-purple-700">
                {{ resourceStats.active_count }}/{{ resourceStats.total_count }} 个资源
              </div>
            </div>
          </div>

          <!-- 浏览量趋势图表 -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-800 mb-4">浏览量趋势图</h4>
            <div v-if="trendData?.trend_data?.length" class="h-64">
              <EchartsUI ref="chartRef" height="256px" />
            </div>
            <div v-else class="h-64 flex items-center justify-center text-gray-500">
              <div class="text-center">
                <ChartLine class="text-4xl text-gray-400 mb-2 mx-auto" />
                <p>暂无趋势数据</p>
                <p class="text-sm text-gray-400">系统将自动收集数据</p>
              </div>
            </div>

            <!-- 数据分析 -->
            <div v-if="trendData?.trend_data?.length" class="mt-6 pt-4 border-t border-gray-200">
              <h5 class="text-sm font-medium text-gray-800 mb-3">📊 数据分析</h5>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- 资源增长趋势 -->
                <div class="bg-white rounded-lg p-3 border border-gray-200">
                  <div class="text-xs text-gray-500 mb-1">资源增长</div>
                  <div class="text-lg font-semibold text-blue-600">
                    +{{ trendData.summary.total_resources_growth }}
                  </div>
                  <div class="text-xs text-gray-600">
                    {{ trendData.summary.period_days }}天内
                  </div>
                </div>

                <!-- 浏览量增长 -->
                <div class="bg-white rounded-lg p-3 border border-gray-200">
                  <div class="text-xs text-gray-500 mb-1">浏览量增长</div>
                  <div class="text-lg font-semibold text-green-600">
                    +{{ formatNumber(trendData.summary.total_views_growth) }}
                  </div>
                  <div class="text-xs text-gray-600">
                    {{ trendData.summary.period_days }}天内
                  </div>
                </div>

                <!-- 平均日增 -->
                <div class="bg-white rounded-lg p-3 border border-gray-200">
                  <div class="text-xs text-gray-500 mb-1">平均日增资源</div>
                  <div class="text-lg font-semibold text-orange-600">
                    {{ Math.round(trendData.summary.average_daily_new_resources) }}
                  </div>
                  <div class="text-xs text-gray-600">
                    个/天
                  </div>
                </div>

                <!-- 增长率 -->
                <div class="bg-white rounded-lg p-3 border border-gray-200">
                  <div class="text-xs text-gray-500 mb-1">资源增长率</div>
                  <div class="text-lg font-semibold text-purple-600">
                    {{ calculateGrowthRate() }}%
                  </div>
                  <div class="text-xs text-gray-600">
                    相对增长
                  </div>
                </div>
              </div>

              <!-- 趋势洞察 -->
              <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div class="text-sm font-medium text-blue-800 mb-2">🔍 趋势洞察</div>
                <div class="text-sm text-blue-700 space-y-1">
                  <div v-for="insight in getTrendInsights()" :key="insight" class="flex items-start">
                    <span class="text-blue-500 mr-2">•</span>
                    <span>{{ insight }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 支持的云盘平台 -->
    <div class="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">支持的云盘平台</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="drive in supportedDrives"
            :key="drive.name"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <span class="text-2xl mr-2">{{ drive.icon }}</span>
                <h3 class="font-medium text-gray-900">{{ drive.name }}</h3>
              </div>
              <span
                :class="{
                  'bg-green-100 text-green-800': drive.status === '已支持',
                  'bg-yellow-100 text-yellow-800': drive.status === '开发中'
                }"
                class="px-2 py-1 text-xs font-medium rounded-full"
              >
                {{ drive.status }}
              </span>
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="feature in drive.features"
                :key="feature"
                class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {{ feature }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新功能 -->
    <div class="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">最新功能</h2>
        <div class="space-y-4">
          <div
            v-for="feature in newFeatures"
            :key="feature.title"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0 mr-4">
                <div class="p-2 bg-blue-100 rounded-lg">
                  <component :is="feature.icon" class="text-blue-600 text-xl" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-gray-900">{{ feature.title }}</h3>
                  <div class="flex items-center space-x-2">
                    <span
                      :class="{
                        'bg-green-100 text-green-800': feature.type === 'feature',
                        'bg-blue-100 text-blue-800': feature.type === 'enhancement'
                      }"
                      class="px-2 py-1 text-xs font-medium rounded-full"
                    >
                      {{ feature.type === 'feature' ? '新功能' : '功能增强' }}
                    </span>
                    <span class="text-sm text-gray-500">{{ feature.date }}</span>
                  </div>
                </div>
                <p class="text-gray-600 text-sm">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- 注意事项 -->
    <div class="bg-white rounded-lg shadow-md border border-gray-200">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">注意事项</h2>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <Info class="text-yellow-600 mt-0.5" />
            <div class="text-sm text-yellow-800">
              <p class="font-medium mb-2">使用前请注意：</p>
              <ul class="space-y-1 list-disc list-inside">
                <li>请确保您的认证令牌有效且具有相应的权限</li>
                <li>大量文件操作可能需要较长时间，请耐心等待</li>
                <li>建议在网络稳定的环境下进行文件同步操作</li>
                <li>定期检查同步任务的执行状态和结果</li>
                <li>资源管理功能支持浏览量统计和趋势分析</li>
                <li>批量操作前请确认选择的资源正确无误</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

/* 添加一些动画效果 */
.transition-all {
  transition: all 0.3s ease;
}

.hover\:shadow-lg:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* 新功能标签动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
