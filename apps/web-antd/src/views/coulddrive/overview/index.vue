<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { VbenButton } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

const router = useRouter();

// 创建图标组件
const FolderOpen = createIconifyIcon('mdi:folder-open');
const User = createIconifyIcon('mdi:account');
const Sync = createIconifyIcon('mdi:sync');
const CloudUpload = createIconifyIcon('mdi:cloud-upload');
const ArrowRight = createIconifyIcon('mdi:arrow-right');
const Info = createIconifyIcon('mdi:information');
const Database = createIconifyIcon('mdi:database');
const ChartLine = createIconifyIcon('mdi:chart-line');
const Star = createIconifyIcon('mdi:star');
const TrendingUp = createIconifyIcon('mdi:trending-up');
const Shield = createIconifyIcon('mdi:shield-check');
const Clock = createIconifyIcon('mdi:clock');

const features = ref([
  {
    title: '文件管理',
    description: '浏览、管理云盘文件，支持创建文件夹、删除文件等操作',
    icon: FolderOpen,
    color: 'text-blue-600 bg-blue-100',
    route: '/coulddrive/file-manager',
    stats: '支持多种网盘',
    isNew: false,
  },
  {
    title: '用户管理',
    description: '管理云盘账户信息，查看存储空间使用情况和好友关系',
    icon: User,
    color: 'text-green-600 bg-green-100',
    route: '/coulddrive/user-manager',
    stats: '实时同步信息',
    isNew: false,
  },
  {
    title: '资源管理',
    description: '管理云盘资源链接，支持批量导入、分类管理和浏览量统计',
    icon: Database,
    color: 'text-orange-600 bg-orange-100',
    route: '/coulddrive/resource-manager',
    stats: '新增功能',
    isNew: true,
  },
  {
    title: '同步任务',
    description: '执行文件同步任务，监控同步状态和历史记录',
    icon: Sync,
    color: 'text-purple-600 bg-purple-100',
    route: '/coulddrive/sync-manager',
    stats: '自动化同步',
    isNew: false,
  },
]);

const supportedDrives = ref([
  { name: '百度网盘', icon: '🔵', status: '已支持', features: ['文件管理', '资源管理'] },
  { name: '夸克网盘', icon: '🟣', status: '已支持', features: ['文件管理', '资源管理'] },
  { name: '阿里云盘', icon: '🟠', status: '开发中', features: ['文件管理'] },
]);

// 统计数据
const stats = ref([
  {
    title: '总资源数',
    value: '1,234',
    change: '+12%',
    icon: Database,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: '总浏览量',
    value: '45.6K',
    change: '+8.5%',
    icon: ChartLine,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: '活跃用户',
    value: '89',
    change: '+15%',
    icon: User,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: '同步任务',
    value: '156',
    change: '+3.2%',
    icon: Sync,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
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
    title: '资源审核系统',
    description: '新增资源审核状态管理，确保资源质量和合规性',
    icon: Shield,
    date: '2024-01-05',
    type: 'feature',
  },
]);

function navigateTo(route: string) {
  router.push(route);
}

// 模拟加载统计数据
onMounted(() => {
  // 这里可以调用真实的API获取统计数据
  console.log('加载统计数据...');
});
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
        <CloudUpload class="text-blue-600 text-3xl" />
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.title"
        :class="`${stat.bgColor} rounded-lg p-4 border border-gray-200`"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">{{ stat.title }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
            <p :class="`text-sm ${stat.color} font-medium`">{{ stat.change }}</p>
          </div>
          <div :class="`p-3 rounded-lg ${stat.color} bg-white bg-opacity-80`">
            <component :is="stat.icon" class="text-xl" />
          </div>
        </div>
      </div>
    </div>

    <!-- 功能概览 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="feature in features"
        :key="feature.title"
        class="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-200 relative"
        @click="navigateTo(feature.route)"
      >
        <!-- 新功能标签 -->
        <div v-if="feature.isNew" class="absolute -top-2 -right-2 z-10">
          <div class="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Star class="text-xs" />
            NEW
          </div>
        </div>

        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div :class="`p-3 rounded-lg ${feature.color}`">
              <component :is="feature.icon" class="text-xl" />
            </div>
            <ArrowRight class="text-gray-400" />
          </div>

          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ feature.title }}</h3>
          <p class="text-gray-600 text-sm mb-3">{{ feature.description }}</p>

          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500">{{ feature.stats }}</span>
            <VbenButton variant="outline" size="sm">
              进入管理
            </VbenButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新功能和更新 -->
    <div class="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">最新功能</h2>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <Clock class="text-sm" />
            最近更新
          </div>
        </div>
        <div class="space-y-4">
          <div
            v-for="newFeature in newFeatures"
            :key="newFeature.title"
            class="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
              <component :is="newFeature.icon" class="text-lg text-blue-600" />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium text-gray-900">{{ newFeature.title }}</h4>
                <span
                  :class="newFeature.type === 'feature' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'"
                  class="text-xs px-2 py-1 rounded-full"
                >
                  {{ newFeature.type === 'feature' ? '新功能' : '优化' }}
                </span>
              </div>
              <p class="text-gray-600 text-sm mb-2">{{ newFeature.description }}</p>
              <span class="text-xs text-gray-500">{{ newFeature.date }}</span>
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
            class="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ drive.icon }}</span>
                <div>
                  <h4 class="font-medium text-gray-900">{{ drive.name }}</h4>
                  <span
                    :class="drive.status === '已支持' ? 'text-green-600' : 'text-yellow-600'"
                    class="text-sm"
                  >
                    {{ drive.status }}
                  </span>
                </div>
              </div>
              <div
                :class="drive.status === '已支持' ? 'bg-green-500' : 'bg-yellow-500'"
                class="w-2 h-2 rounded-full"
              ></div>
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="feature in drive.features"
                :key="feature"
                class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
              >
                {{ feature }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速开始指南 -->
    <div class="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">快速开始</h2>
        <div class="space-y-4">
          <div class="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div>
              <h4 class="font-medium text-gray-900 mb-1">配置云盘账户</h4>
              <p class="text-gray-600 text-sm">
                前往
                <button
                  @click="navigateTo('/coulddrive/user-manager')"
                  class="text-blue-600 hover:underline font-medium"
                >
                  用户管理页面
                </button>
                ，输入您的云盘认证令牌，获取账户信息
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div>
              <h4 class="font-medium text-gray-900 mb-1">浏览文件</h4>
              <p class="text-gray-600 text-sm">
                在
                <button
                  @click="navigateTo('/coulddrive/file-manager')"
                  class="text-green-600 hover:underline font-medium"
                >
                  文件管理页面
                </button>
                浏览您的云盘文件，支持文件夹导航和文件操作
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div>
              <h4 class="font-medium text-gray-900 mb-1">管理资源</h4>
              <p class="text-gray-600 text-sm">
                在
                <button
                  @click="navigateTo('/coulddrive/resource-manager')"
                  class="text-orange-600 hover:underline font-medium"
                >
                  资源管理页面
                </button>
                管理云盘资源链接，查看浏览量趋势和统计数据
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              4
            </div>
            <div>
              <h4 class="font-medium text-gray-900 mb-1">执行同步任务</h4>
              <p class="text-gray-600 text-sm">
                配置同步规则后，在
                <button
                  @click="navigateTo('/coulddrive/sync-manager')"
                  class="text-purple-600 hover:underline font-medium"
                >
                  同步任务页面
                </button>
                执行自动化文件同步
              </p>
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
