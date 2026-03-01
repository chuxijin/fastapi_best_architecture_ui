<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const stats = ref({
  applications: 0,
  devices: 0,
  authorizations: 0,
  redeemCodes: 0,
});

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
  // 这里可以加载统计数据
  // 暂时使用模拟数据
  stats.value = {
    applications: 12,
    devices: 156,
    authorizations: 89,
    redeemCodes: 234,
  };
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="mb-2 text-2xl font-bold text-gray-800">应用授权管理</h1>
      <p class="text-gray-600">管理应用、设备、套餐、兑换码和授权信息</p>
    </div>

    <!-- 统计卡片 -->
    <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">应用总数</p>
            <p class="text-2xl font-bold text-blue-600">
              {{ stats.applications }}
            </p>
          </div>
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100"
          >
            <div class="h-6 w-6 text-lg font-bold text-blue-600">📱</div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">设备总数</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.devices }}</p>
          </div>
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100"
          >
            <div class="h-6 w-6 text-lg font-bold text-green-600">💻</div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">有效授权</p>
            <p class="text-2xl font-bold text-orange-600">
              {{ stats.authorizations }}
            </p>
          </div>
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100"
          >
            <div class="h-6 w-6 text-lg font-bold text-orange-600">🔐</div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">兑换码</p>
            <p class="text-2xl font-bold text-purple-600">
              {{ stats.redeemCodes }}
            </p>
          </div>
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100"
          >
            <div class="h-6 w-6 text-lg font-bold text-purple-600">🎫</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能导航 -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="item in menuItems"
        :key="item.path"
        class="cursor-pointer rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        @click="navigateTo(item.path)"
      >
        <div class="mb-4 flex items-center">
          <div
            class="mr-4 flex h-12 w-12 items-center justify-center rounded-lg"
            :class="item.iconBg"
          >
            <div class="text-2xl">{{ item.icon }}</div>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">
              {{ item.title }}
            </h3>
            <p class="text-sm text-gray-600">{{ item.description }}</p>
          </div>
        </div>
        <div class="flex items-center text-sm font-medium text-blue-600">
          <span>进入管理</span>
          <span class="ml-1">→</span>
        </div>
      </div>
    </div>
  </div>
</template>
