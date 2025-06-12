<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type {
  CoulddriveUserInfo,
  CoulddriveUserInfoParams,
  CoulddriveRelationshipParams,
  CoulddriveRelationshipItem,
  CoulddriveUserListParams,
  CoulddriveDriveAccountDetail,
} from '#/api';

import { onMounted, ref } from 'vue';

import { Page, VbenButton, useVbenModal } from '@vben/common-ui';
import { AddData } from '@vben/icons';
import { createIconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

// 创建图标组件
const Refresh = createIconifyIcon('mdi:refresh');

import { message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCoulddriveUserInfoApi,
  getCoulddriveRelationshipListApi,
  getCoulddriveUserListApi,
  createCoulddriveUserApi,
  deleteCoulddriveUserApi,
  DRIVE_TYPE_OPTIONS,
} from '#/api';
import {
  userInfoFormSchema,
  userListQuerySchema,
  useUserListColumns,
} from '#/views/coulddrive/user-manager/data';

const driveType = ref<string>(DRIVE_TYPE_OPTIONS[0].value);
const authToken = ref<string>('');
const userInfo = ref<CoulddriveUserInfo | null>(null);
const fetchingUserInfo = ref<boolean>(false);

// 关系查看相关状态
const selectedUser = ref<CoulddriveDriveAccountDetail | null>(null);
const relationshipType = ref<'friend' | 'group'>('friend');
const friendList = ref<CoulddriveRelationshipItem[]>([]);
const groupList = ref<CoulddriveRelationshipItem[]>([]);
const loadingRelationships = ref<boolean>(false);

// 用户信息查询表单
const userFormOptions: VbenFormProps = {
  collapsed: false,
  showCollapseButton: false,
  submitButtonOptions: {
    content: '获取用户信息',
  },
  handleSubmit: fetchUserInfoInModal,
  schema: userInfoFormSchema,
};



// 用户列表查询表单
const userListFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('page.form.query'),
  },
  schema: userListQuerySchema,
};

// 用户列表表格配置
const userListGridOptions: VxeTableGridOptions<CoulddriveDriveAccountDetail> = {
  rowConfig: {
    keyField: 'id',
  },
  checkboxConfig: {
    highlight: true,
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: { code: 'query' },
    custom: true,
    zoom: true,
  },
  columns: useUserListColumns(onUserActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const params: CoulddriveUserListParams = {
          type: formValues.type || undefined,
          is_valid: formValues.is_valid !== '' ? formValues.is_valid : undefined,
          page: page.currentPage,
          size: page.pageSize,
        };
        return await getCoulddriveUserListApi(params);
      },
    },
  },
};

const [UserListGrid, userListGridApi] = useVbenVxeGrid({
  formOptions: userListFormOptions,
  gridOptions: userListGridOptions,
});

const [UserInfoForm, userInfoFormApi] = useVbenForm(userFormOptions);

// 创建模态框组件
// 创建关系查看模态框
const [RelationshipModal, relationshipModalApi] = useVbenModal({
  class: 'w-[800px]',
  destroyOnClose: true,
  onOpenChange(isOpen) {
    if (!isOpen) {
      selectedUser.value = null;
      friendList.value = [];
      groupList.value = [];
      relationshipType.value = 'friend';
    }
  },
});

const [UserInfoModal, userInfoModalApi] = useVbenModal({
  class: 'w-[600px]',
  destroyOnClose: true,
  async onConfirm() {
    if (userInfo.value && authToken.value && driveType.value) {
      userInfoModalApi.lock();
      try {
        // 调用创建用户API，将用户信息保存到数据库
        const params: CoulddriveUserInfoParams = {
          drive_type: driveType.value,
        };

        await createCoulddriveUserApi(params, authToken.value);
        message.success('用户信息已成功保存到数据库');
          await userInfoModalApi.close();
          // 刷新用户列表
          userListGridApi.query();
      } catch (error) {
        message.error('保存用户信息失败，请重试');
        console.error(error);
      } finally {
        userInfoModalApi.unlock();
      }
    } else {
      message.warning('请先获取用户信息');
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      // 重置表单
      userInfoFormApi.resetForm();
      userInfo.value = null;
      authToken.value = '';
      driveType.value = DRIVE_TYPE_OPTIONS[0].value;
    }
  },
});

// 在模态框中获取用户信息
async function fetchUserInfoInModal() {
  const { valid } = await userInfoFormApi.validate();
  if (valid) {
    fetchingUserInfo.value = true;
    const formData = await userInfoFormApi.getValues<{
      drive_type: string;
      auth_token: string;
    }>();

    driveType.value = formData.drive_type;
    authToken.value = formData.auth_token;

    try {
      const params: CoulddriveUserInfoParams = {
        drive_type: formData.drive_type,
      };
      userInfo.value = await getCoulddriveUserInfoApi(params, formData.auth_token);
      message.success('用户信息获取成功');
    } catch (error) {
      message.error('获取用户信息失败，请检查认证令牌是否正确');
      console.error(error);
      userInfo.value = null;
    } finally {
      fetchingUserInfo.value = false;
    }
  }
}

// 获取关系列表
async function fetchRelationships(user: CoulddriveDriveAccountDetail, type: 'friend' | 'group') {
  if (!user.cookies) {
    message.error('用户认证信息不完整');
    return;
  }

  loadingRelationships.value = true;
  try {
    const params: CoulddriveRelationshipParams = {
      drive_type: user.type,
      relationship_type: type,
      page: 1,
      size: 100,
    };

    const response = await getCoulddriveRelationshipListApi(params, user.cookies);

    if (type === 'friend') {
      friendList.value = response.items || [];
    } else {
      groupList.value = response.items || [];
    }
  } catch (error) {
    message.error(`获取${type === 'friend' ? '好友' : '群组'}列表失败`);
    console.error(error);
  } finally {
    loadingRelationships.value = false;
  }
}

// 用户操作处理
async function onUserActionClick({ code, row }: OnActionClickParams<CoulddriveDriveAccountDetail>) {
  switch (code) {
    case 'edit': {
      message.info(`编辑用户: ${row.username}`);
      // TODO: 实现编辑功能
      break;
    }
    case 'relationship': {
      selectedUser.value = row;
      relationshipModalApi.open();
      // 默认加载好友列表
      fetchRelationships(row, 'friend');
      break;
    }
    case 'delete': {
      // 确认删除
      const confirmed = await new Promise((resolve) => {
        const modal = Modal.confirm({
          title: '确认删除',
          content: `确定要删除用户 "${row.username}" 吗？此操作不可恢复。`,
          okText: '确定',
          cancelText: '取消',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });

      if (confirmed) {
        try {
          await deleteCoulddriveUserApi(row.id);
          message.success('删除成功');
          // 刷新用户列表
          userListGridApi.query();
        } catch (error) {
          message.error('删除失败，请重试');
          console.error(error);
        }
      }
      break;
    }
  }
}

// 获取用户信息
async function fetchUserInfo() {
  const { valid } = await userInfoFormApi.validate();
  if (valid) {
    const formData = await userInfoFormApi.getValues<{
      drive_type: string;
      auth_token: string;
    }>();

    driveType.value = formData.drive_type;
    authToken.value = formData.auth_token;

    try {
      const params: CoulddriveUserInfoParams = {
        drive_type: formData.drive_type,
      };
      userInfo.value = await getCoulddriveUserInfoApi(params, formData.auth_token);

      // 保存到本地存储
      localStorage.setItem('coulddrive_token', formData.auth_token);
      localStorage.setItem('coulddrive_drive_type', formData.drive_type);
    } catch (error) {
      message.error('获取用户信息失败，请检查认证令牌是否正确');
      console.error(error);
    }
  }
}

// 格式化文件大小
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 计算使用率
function getUsagePercentage(): number {
  if (!userInfo.value?.quota || !userInfo.value?.used) return 0;
  return Math.round((userInfo.value.used / userInfo.value.quota) * 100);
}



// 切换关系类型
function onRelationshipTypeChange(type: 'friend' | 'group') {
  relationshipType.value = type;
  if (selectedUser.value) {
    if (type === 'friend' && friendList.value.length === 0) {
      fetchRelationships(selectedUser.value, 'friend');
    } else if (type === 'group' && groupList.value.length === 0) {
      fetchRelationships(selectedUser.value, 'group');
    }
  }
}

function onRefreshUserList() {
  userListGridApi.query();
}

onMounted(() => {
  // 从本地存储恢复数据
  const savedToken = localStorage.getItem('coulddrive_token');
  const savedDriveType = localStorage.getItem('coulddrive_drive_type');

  if (savedToken && savedDriveType) {
    userInfoFormApi.setValues({
      auth_token: savedToken,
      drive_type: savedDriveType,
    });
    authToken.value = savedToken;
    driveType.value = savedDriveType;
  }
});
</script>

<template>
  <Page auto-content-height>
    <!-- 数据库用户列表 -->
    <UserListGrid>
      <template #toolbar-actions>
        <VbenButton @click="userInfoModalApi.open()">
          <AddData class="size-5" />
          添加用户
        </VbenButton>
      </template>

      <!-- 头像插槽 -->
      <template #avatar="{ row }">
        <a-avatar
          :src="row.avatar_url"
          :size="40"
        >
          <template #icon>
            <AddData />
          </template>
        </a-avatar>
      </template>



      <!-- 使用率插槽 -->
      <template #usage="{ row }">
        <div class="w-full">
          <a-progress
            :percent="row.quota && row.used ? Math.round((row.used / row.quota) * 100) : 0"
            :size="'small'"
            :status="row.quota && row.used && (row.used / row.quota) > 0.9 ? 'exception' : 'normal'"
            :show-info="true"
          />
        </div>
      </template>

      <!-- VIP状态插槽 -->
      <template #vip="{ row }">
        <a-tag
          v-if="row.is_supervip"
          color="purple"
        >
          超级会员
        </a-tag>
        <a-tag
          v-else-if="row.is_vip"
          color="gold"
        >
          VIP
        </a-tag>
        <a-tag
          v-else
          color="default"
        >
          普通用户
        </a-tag>
      </template>

      <!-- 账号状态插槽 -->
      <template #status="{ row }">
        <a-tag
          :color="row.is_valid ? 'success' : 'error'"
        >
          {{ row.is_valid ? '有效' : '无效' }}
        </a-tag>
      </template>
    </UserListGrid>



    <!-- 添加用户模态框 -->
    <UserInfoModal title="添加用户">
      <div class="grid grid-cols-1 gap-6">
        <!-- 认证表单 -->
        <div>
          <UserInfoForm />
        </div>

        <!-- 用户信息展示 -->
        <div v-if="userInfo" class="space-y-4">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <div class="flex items-center mb-3">
              <AddData class="mr-2 text-blue-600" />
              <h3 class="text-lg font-semibold text-gray-800">{{ userInfo.username }}</h3>
              <div class="ml-auto flex gap-2">
                <span
                  v-if="userInfo.is_vip"
                  class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                >
                  VIP
                </span>
                <span
                  v-if="userInfo.is_supervip"
                  class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                >
                  超级会员
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-600">用户ID:</span>
                <span class="ml-2 font-mono">{{ userInfo.user_id }}</span>
              </div>
              <div>
                <span class="text-gray-600">总空间:</span>
                <span class="ml-2 font-semibold">{{ formatFileSize(userInfo.quota ?? null) }}</span>
              </div>
              <div>
                <span class="text-gray-600">已使用:</span>
                <span class="ml-2 font-semibold">{{ formatFileSize(userInfo.used ?? null) }}</span>
              </div>
              <div>
                <span class="text-gray-600">使用率:</span>
                <span class="ml-2 font-semibold">{{ getUsagePercentage() }}%</span>
              </div>
            </div>

            <!-- 存储空间进度条 -->
            <div class="mt-4">
              <div class="flex justify-between text-xs text-gray-600 mb-1">
                <span>存储空间使用情况</span>
                <span>{{ getUsagePercentage() }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${getUsagePercentage()}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 未获取用户信息时的提示 -->
        <div v-else class="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <div class="text-center text-gray-500">
            <AddData class="mx-auto mb-2 text-4xl" />
            <p>请先获取用户信息</p>
          </div>
        </div>
      </div>
    </UserInfoModal>

    <!-- 关系查看模态框 -->
    <RelationshipModal :title="`${selectedUser?.username || ''} 的关系列表`">
      <div v-if="selectedUser" class="flex flex-col h-[500px]">
        <!-- 标签页切换 - 固定在顶部 -->
        <div class="flex border-b border-gray-200 bg-white sticky top-0 z-10">
          <button
            :class="[
              'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
              relationshipType === 'friend'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
            @click="onRelationshipTypeChange('friend')"
          >
            好友列表 ({{ friendList.length }})
          </button>
          <button
            :class="[
              'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
              relationshipType === 'group'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
            @click="onRelationshipTypeChange('group')"
          >
            群组列表 ({{ groupList.length }})
          </button>
        </div>

        <!-- 关系列表内容 - 可滚动区域 -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="loadingRelationships" class="flex items-center justify-center h-32">
            <div class="text-gray-500">加载中...</div>
          </div>

          <!-- 好友列表 -->
          <div v-else-if="relationshipType === 'friend'" class="space-y-2">
            <div v-if="friendList.length === 0" class="text-center text-gray-500 py-8">
              暂无好友
            </div>
            <div
              v-for="friend in friendList.filter(item => 'uk' in item)"
              :key="(friend as any).uk"
              class="flex items-center p-3 bg-gray-50 rounded-lg"
            >
              <img
                :src="(friend as any).avatar_url"
                :alt="(friend as any).uname"
                class="w-10 h-10 rounded-full mr-3"
                @error="($event.target as HTMLImageElement).src = '/default-avatar.png'"
              />
              <div class="flex-1">
                <div class="font-medium">{{ (friend as any).uname }}</div>
                <div class="text-sm text-gray-500">{{ (friend as any).nick_name || '无昵称' }}</div>
              </div>
              <div class="text-sm text-gray-400">ID: {{ (friend as any).uk }}</div>
            </div>
          </div>

          <!-- 群组列表 -->
          <div v-else class="space-y-2">
            <div v-if="groupList.length === 0" class="text-center text-gray-500 py-8">
              暂无群组
            </div>
            <div
              v-for="group in groupList.filter(item => 'gid' in item)"
              :key="(group as any).gid"
              class="flex items-center p-3 bg-gray-50 rounded-lg"
            >
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span class="text-green-600 font-bold">群</span>
              </div>
              <div class="flex-1">
                <div class="font-medium">{{ (group as any).name }}</div>
                <div class="text-sm text-gray-500">群号: {{ (group as any).gnum }}</div>
              </div>
              <div class="text-sm text-gray-400">ID: {{ (group as any).gid }}</div>
            </div>
          </div>
        </div>
      </div>
    </RelationshipModal>
  </Page>
</template>

<style scoped>
.grid {
  display: grid;
}
</style>
