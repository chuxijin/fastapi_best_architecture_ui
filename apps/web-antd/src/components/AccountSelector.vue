<script setup lang="ts">
import type { CoulddriveDriveAccountDetail } from '#/api';

import { computed } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { getDriveTypeColor, getDriveTypeLabel } from '#/api';

const props = withDefaults(defineProps<Props>(), {
  selectedAccountId: null,
  loading: false,
});
const emit = defineEmits<Emits>();
// 图标
const QuarkIcon = createIconifyIcon('simple-icons:quark');
const BaiduIcon = createIconifyIcon('simple-icons:baidu');
const DefaultIcon = createIconifyIcon('mdi:account-circle');

interface Props {
  accounts: CoulddriveDriveAccountDetail[];
  selectedAccountId?: null | number;
  loading?: boolean;
}

interface Emits {
  (e: 'select', accountId: number): void;
}

// 获取网盘类型图标
function getDriveIcon(type: string) {
  switch (type?.toLowerCase()) {
    case 'baidu': {
      return BaiduIcon;
    }
    case 'quark': {
      return QuarkIcon;
    }
    default: {
      return DefaultIcon;
    }
  }
}

// 获取网盘类型Tailwind颜色类
function getDriveTailwindColor(type: string) {
  const color = getDriveTypeColor(type);
  switch (color) {
    case 'blue': {
      return 'bg-blue-500';
    }
    case 'green': {
      return 'bg-green-500';
    }
    case 'orange': {
      return 'bg-orange-500';
    }
    default: {
      return 'bg-gray-500';
    }
  }
}

// 生成头像背景色
function getAvatarColor(account: CoulddriveDriveAccountDetail) {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500',
  ];
  const index = (account.id || 0) % colors.length;
  return colors[index];
}

// 处理账号选择
function handleAccountSelect(account: CoulddriveDriveAccountDetail) {
  if (account.id) {
    emit('select', account.id);
  }
}

// 检查账号是否被选中
function isSelected(account: CoulddriveDriveAccountDetail) {
  return account.id === props.selectedAccountId;
}

// 排序账号：ID小的且正常的靠前
const sortedAccounts = computed(() => {
  return [...props.accounts].sort((a, b) => {
    // 首先按状态排序，正常的在前
    if (a.is_valid !== b.is_valid) {
      return a.is_valid ? -1 : 1;
    }
    // 然后按ID排序，小的在前
    return (a.id || 0) - (b.id || 0);
  });
});
</script>

<template>
  <div class="account-selector">
    <div v-if="loading" class="flex items-center justify-center py-4">
      <div class="text-gray-500">加载账号中...</div>
    </div>

    <div
      v-else-if="accounts.length === 0"
      class="flex items-center justify-center py-4"
    >
      <div class="text-gray-500">暂无可用账号</div>
    </div>

    <div v-else class="flex gap-2 overflow-x-auto pb-2">
      <div
        v-for="account in sortedAccounts"
        :key="account.id"
        class="account-card relative cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:shadow-sm"
        :class="{
          'border-blue-500 bg-blue-50 shadow-sm': isSelected(account),
          'border-gray-200 bg-white hover:border-gray-300':
            !isSelected(account) && account.is_valid,
          'border-gray-300 bg-gray-50 opacity-60': !account.is_valid,
        }"
        @click="handleAccountSelect(account)"
      >
        <!-- 选中状态指示器 -->
        <div
          v-if="isSelected(account)"
          class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white"
        >
          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <div class="flex items-center space-x-2">
          <!-- 头像 -->
          <img
            v-if="account.avatar_url"
            :src="account.avatar_url"
            :alt="account.username || account.user_id"
            class="h-8 w-8 rounded-full object-cover"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <div
            v-else
            class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            :class="getAvatarColor(account)"
          >
            {{
              (account.username || account.user_id?.toString() || '用户')
                .charAt(0)
                .toUpperCase()
            }}
          </div>

          <!-- 账号信息 -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center space-x-1">
              <span
                class="truncate text-sm font-medium"
                :class="account.is_valid ? 'text-gray-900' : 'text-gray-500'"
              >
                {{ account.username || account.user_id || '未知用户' }}
              </span>
              <span class="text-xs text-gray-400"> #{{ account.id }} </span>
            </div>

            <!-- 网盘类型徽章 -->
            <div
              class="mt-1 inline-flex items-center space-x-1 rounded px-1.5 py-0.5 text-xs font-medium text-white"
              :class="getDriveTailwindColor(account.type)"
            >
              <component :is="getDriveIcon(account.type)" class="h-3 w-3" />
              <span>{{ getDriveTypeLabel(account.type) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-card {
  flex-shrink: 0;
  min-width: 200px;
}

.account-card:hover {
  transform: translateY(-1px);
}

.account-selector {
  max-height: 200px;

  /* Firefox 滚动条样式 */
  scrollbar-color: #c1c1c1 #f1f1f1;
  scrollbar-width: thin;
}

/* 横向滚动条样式 */
.account-selector ::-webkit-scrollbar {
  height: 6px;
}

.account-selector ::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.account-selector ::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.account-selector ::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
