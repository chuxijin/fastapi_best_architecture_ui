<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-2">应用授权管理</h1>
      <p class="text-gray-600">管理应用、设备、套餐、兑换码和授权信息</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">应用总数</p>
            <p class="text-2xl font-bold text-blue-600" :class="{ 'animate-pulse': loading }">
              {{ loading ? '...' : stats.applications }}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <div class="w-6 h-6 text-blue-600 font-bold text-lg">📱</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">设备总数</p>
            <p class="text-2xl font-bold text-green-600" :class="{ 'animate-pulse': loading }">
              {{ loading ? '...' : stats.devices }}
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <div class="w-6 h-6 text-green-600 font-bold text-lg">💻</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">有效授权</p>
            <p class="text-2xl font-bold text-orange-600" :class="{ 'animate-pulse': loading }">
              {{ loading ? '...' : stats.authorizations }}
            </p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <div class="w-6 h-6 text-orange-600 font-bold text-lg">🔐</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">兑换码</p>
            <p class="text-2xl font-bold text-purple-600" :class="{ 'animate-pulse': loading }">
              {{ loading ? '...' : stats.redeemCodes }}
            </p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <div class="w-6 h-6 text-purple-600 font-bold text-lg">🎫</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能导航 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="item in menuItems"
        :key="item.path"
        class="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
        @click="navigateTo(item.path)"
      >
        <div class="flex items-center mb-4">
          <div class="w-12 h-12 rounded-lg flex items-center justify-center mr-4" :class="item.iconBg">
            <div class="text-2xl">{{ item.icon }}</div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">{{ item.title }}</h3>
            <p class="text-sm text-gray-600">{{ item.description }}</p>
          </div>
        </div>
        <div class="flex items-center text-blue-600 text-sm font-medium">
          <span>进入管理</span>
          <span class="ml-1">→</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { MaterialSymbolsAdd } from '@vben/icons';
import { getAppAuthStatisticsApi } from '#/api/app-auth';

const router = useRouter();

const stats = ref({
  applications: 0,
  devices: 0,
  authorizations: 0,
  redeemCodes: 0,
});

const loading = ref(true);

const menuItems = [
  {
    title: '应用管理',
    description: '管理应用信息和配置',
    path: '/app-auth/application',
    icon: '📱',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    title: '设备管理',
    description: '管理设备信息和状态',
    path: '/app-auth/device',
    icon: '💻',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    title: '套餐管理',
    description: '管理套餐和价格策略',
    path: '/app-auth/package',
    icon: '📦',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    title: '订单管理',
    description: '管理订单和支付信息',
    path: '/app-auth/order',
    icon: '🛒',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    title: '兑换码管理',
    description: '生成和管理兑换码',
    path: '/app-auth/redeem-code',
    icon: '🎫',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  {
    title: '版本管理',
    description: '管理应用版本信息',
    path: '/app-auth/version',
    icon: '🔖',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    title: '授权管理',
    description: '管理设备授权和权限',
    path: '/app-auth/authorization',
    icon: '🔐',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
];

function navigateTo(path: string) {
  router.push(path);
}

onMounted(async () => {
  try {
    loading.value = true;
    // 加载真实的统计数据
    const response = await getAppAuthStatisticsApi();
    stats.value = {
      applications: response.applications,
      devices: response.devices,
      authorizations: response.authorizations,
      redeemCodes: response.redeem_codes,
    };
  } catch (error) {
    console.error('加载统计数据失败:', error);
    // 如果加载失败，使用默认值
    stats.value = {
      applications: 0,
      devices: 0,
      authorizations: 0,
      redeemCodes: 0,
    };
  } finally {
    loading.value = false;
  }
});
</script>
