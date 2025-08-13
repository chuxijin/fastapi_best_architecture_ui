<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  CoulddriveDriveAccountDetail,
  CoulddriveRelationshipItem,
  CoulddriveRelationshipParams,
  CoulddriveUserInfo,
  CoulddriveUserInfoParams,
  CoulddriveUserListParams,
} from '#/api';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { AddData } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, Modal } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createCoulddriveUserApi,
  deleteCoulddriveUserApi,
  DRIVE_TYPE_OPTIONS,
  getCoulddriveRelationshipListApi,
  getCoulddriveUserInfoApi,
  getCoulddriveUserListApi,
  getDriveTypeLabel,
  refreshCoulddriveUserApi,
} from '#/api';
import {
  getUserInfoFormSchema,
  userListQuerySchema,
  useUserListColumns,
} from '#/views/coulddrive/user-manager/data';

// 创建图标组件（如需更多图标可按需添加）

const driveType = ref<string>(DRIVE_TYPE_OPTIONS[0].value);
const authToken = ref<string>('');
const userInfo = ref<CoulddriveUserInfo | null>(null);
const fetchingUserInfo = ref<boolean>(false);

// 编辑模式相关状态
const isEditMode = ref<boolean>(false);
const editingUser = ref<CoulddriveDriveAccountDetail | null>(null);

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
  schema: getUserInfoFormSchema(false), // 默认非编辑模式
};

// 用户列表查询表单
const userListFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.search'),
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
          is_valid:
            formValues.is_valid === '' ? undefined : formValues.is_valid,
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
    if (isEditMode.value) {
      // 编辑模式：获取最新用户信息并更新到数据库
      const { valid } = await userInfoFormApi.validate();
      if (valid && editingUser.value) {
        userInfoModalApi.lock();
        try {
          const formData = await userInfoFormApi.getValues<{
            auth_token: string;
            drive_type: string;
          }>();

          // 使用新的认证令牌获取用户信息
          const params: CoulddriveUserInfoParams = {
            drive_type: formData.drive_type,
          };
          await getCoulddriveUserInfoApi(params, formData.auth_token);

          // 创建或更新用户信息到数据库
          await createCoulddriveUserApi(params, formData.auth_token);

          message.success('用户信息已更新');
          await userInfoModalApi.close();
          // 刷新用户列表
          userListGridApi.query();
        } catch (error) {
          message.error('更新用户信息失败，请检查认证令牌是否正确');
          console.error(error);
        } finally {
          userInfoModalApi.unlock();
        }
      } else {
        message.warning('请填写完整的认证信息');
      }
    } else {
      // 添加模式：保存用户信息到数据库
      if (userInfo.value && authToken.value && driveType.value) {
        userInfoModalApi.lock();
        try {
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
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      if (!isEditMode.value) {
        // 添加模式：重置表单
        userInfoFormApi.resetForm();
        userInfo.value = null;
        authToken.value = '';
        driveType.value = DRIVE_TYPE_OPTIONS[0].value;
      }
    } else {
      // 关闭时重置状态
      isEditMode.value = false;
      editingUser.value = null;
      // 重置表单schema
      userFormOptions.schema = getUserInfoFormSchema(false);
    }
  },
});

// 在模态框中获取用户信息
async function fetchUserInfoInModal() {
  const { valid } = await userInfoFormApi.validate();
  if (valid) {
    fetchingUserInfo.value = true;
    const formData = await userInfoFormApi.getValues<{
      auth_token: string;
      drive_type: string;
    }>();

    driveType.value = formData.drive_type;
    authToken.value = formData.auth_token;

    try {
      const params: CoulddriveUserInfoParams = {
        drive_type: formData.drive_type,
      };
      userInfo.value = await getCoulddriveUserInfoApi(
        params,
        formData.auth_token,
      );
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
async function fetchRelationships(
  user: CoulddriveDriveAccountDetail,
  type: 'friend' | 'group',
) {
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

    const response = await getCoulddriveRelationshipListApi(
      params,
      user.cookies,
    );

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

// 编辑用户信息
function editUser(user: CoulddriveDriveAccountDetail) {
  isEditMode.value = true;
  editingUser.value = user;

  // 更新表单schema以禁用网盘类型选择
  userFormOptions.schema = getUserInfoFormSchema(true);

  // 设置表单数据
  userInfoFormApi.setValues({
    drive_type: user.type,
    auth_token: user.cookies || '',
  });

  // 设置用户信息显示
  userInfo.value = {
    user_id: user.user_id,
    username: user.username,
    avatar_url: user.avatar_url,
    quota: user.quota,
    used: user.used,
    is_vip: user.is_vip,
    is_supervip: user.is_supervip,
  };

  driveType.value = user.type;
  authToken.value = user.cookies || '';

  userInfoModalApi.open();
}

// 用户操作处理
async function onUserActionClick({
  code,
  row,
}: OnActionClickParams<CoulddriveDriveAccountDetail>) {
  switch (code) {
    case 'delete': {
      // 确认删除
      const confirmed = await new Promise((resolve) => {
        Modal.confirm({
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
    case 'edit': {
      editUser(row);
      break;
    }
    case 'refresh': {
      try {
        message.loading('正在刷新用户信息...', 0);
        await refreshCoulddriveUserApi(row.id);
        message.destroy();
        message.success('用户信息刷新成功');
        // 刷新用户列表
        userListGridApi.query();
      } catch (error) {
        message.destroy();
        message.error('刷新用户信息失败，请重试');
        console.error(error);
        // 刷新失败后也要刷新列表，因为可能账户状态已更新
        userListGridApi.query();
      }
      break;
    }
    case 'relationship': {
      selectedUser.value = row;
      relationshipModalApi.open();
      // 默认加载好友列表
      fetchRelationships(row, 'friend');
      break;
    }
  }
}

// 保留占位以便后续拓展（当前不使用）

// 格式化文件大小
function formatFileSize(bytes: null | number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
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

// 刷新用户列表（已通过 toolbar refresh 触发，无需单独方法）

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
        <a-avatar :src="row.avatar_url" :size="40">
          <template #icon>
            <AddData />
          </template>
        </a-avatar>
      </template>

      <!-- 使用率插槽 -->
      <template #usage="{ row }">
        <div class="w-full">
          <a-progress
            :percent="
              row.quota && row.used
                ? Math.round((row.used / row.quota) * 100)
                : 0
            "
            size="small"
            :status="
              row.quota && row.used && row.used / row.quota > 0.9
                ? 'exception'
                : 'normal'
            "
            :show-info="true"
          />
        </div>
      </template>

      <!-- VIP状态插槽 -->
      <template #vip="{ row }">
        <a-tag v-if="row.is_supervip" color="purple"> 超级会员 </a-tag>
        <a-tag v-else-if="row.is_vip" color="gold"> VIP </a-tag>
        <a-tag v-else color="default"> 普通用户 </a-tag>
      </template>

      <!-- 账号状态插槽 -->
      <template #status="{ row }">
        <a-tag :color="row.is_valid ? 'success' : 'error'">
          {{ row.is_valid ? '有效' : '无效' }}
        </a-tag>
      </template>
    </UserListGrid>

    <!-- 添加用户模态框 -->
    <UserInfoModal :title="isEditMode ? '编辑用户' : '添加用户'">
      <div class="grid grid-cols-1 gap-6">
        <!-- 认证表单 -->
        <div>
          <UserInfoForm />
        </div>

        <!-- 编辑模式下显示当前用户信息 -->
        <div v-if="isEditMode" class="rounded-lg bg-blue-50 p-4">
          <h4 class="mb-2 text-lg font-semibold text-gray-800">当前用户信息</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-600">网盘类型:</span>
              <span class="ml-2 font-semibold">{{
                getDriveTypeLabel(editingUser?.type || '')
              }}</span>
            </div>
            <div>
              <span class="text-gray-600">用户名:</span>
              <span class="ml-2 font-semibold">{{
                editingUser?.username
              }}</span>
            </div>
          </div>
        </div>

        <!-- 用户信息展示 -->
        <div v-if="userInfo" class="space-y-4">
          <div
            class="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4"
          >
            <div class="mb-3 flex items-center">
              <AddData class="mr-2 text-blue-600" />
              <h3 class="text-lg font-semibold text-gray-800">
                {{ userInfo.username }}
              </h3>
              <div class="ml-auto flex gap-2">
                <span
                  v-if="userInfo.is_vip"
                  class="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800"
                >
                  VIP
                </span>
                <span
                  v-if="userInfo.is_supervip"
                  class="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800"
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
                <span class="ml-2 font-semibold">{{
                  formatFileSize(userInfo.quota ?? null)
                }}</span>
              </div>
              <div>
                <span class="text-gray-600">已使用:</span>
                <span class="ml-2 font-semibold">{{
                  formatFileSize(userInfo.used ?? null)
                }}</span>
              </div>
              <div>
                <span class="text-gray-600">使用率:</span>
                <span class="ml-2 font-semibold"
                  >{{ getUsagePercentage() }}%</span
                >
              </div>
            </div>

            <!-- 存储空间进度条 -->
            <div class="mt-4">
              <div class="mb-1 flex justify-between text-xs text-gray-600">
                <span>存储空间使用情况</span>
                <span>{{ getUsagePercentage() }}%</span>
              </div>
              <div class="h-2 w-full rounded-full bg-gray-200">
                <div
                  class="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  :style="{ width: `${getUsagePercentage()}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 未获取用户信息时的提示 -->
        <div
          v-else
          class="flex h-32 items-center justify-center rounded-lg bg-gray-50"
        >
          <div class="text-center text-gray-500">
            <AddData class="mx-auto mb-2 text-4xl" />
            <p>请先获取用户信息</p>
          </div>
        </div>
      </div>
    </UserInfoModal>

    <!-- 关系查看模态框 -->
    <RelationshipModal :title="`${selectedUser?.username || ''} 的关系列表`">
      <div v-if="selectedUser" class="flex h-[500px] flex-col">
        <!-- 标签页切换 - 固定在顶部 -->
        <div class="sticky top-0 z-10 flex border-b border-gray-200 bg-white">
          <button
            class="border-b-2 px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              relationshipType === 'friend'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
            @click="onRelationshipTypeChange('friend')"
          >
            好友列表 ({{ friendList.length }})
          </button>
          <button
            class="border-b-2 px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              relationshipType === 'group'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
            @click="onRelationshipTypeChange('group')"
          >
            群组列表 ({{ groupList.length }})
          </button>
        </div>

        <!-- 关系列表内容 - 可滚动区域 -->
        <div class="flex-1 overflow-y-auto p-4">
          <div
            v-if="loadingRelationships"
            class="flex h-32 items-center justify-center"
          >
            <div class="text-gray-500">加载中...</div>
          </div>

          <!-- 好友列表 -->
          <div v-else-if="relationshipType === 'friend'" class="space-y-2">
            <div
              v-if="friendList.length === 0"
              class="py-8 text-center text-gray-500"
            >
              暂无好友
            </div>
            <div
              v-for="friend in friendList.filter((item) => 'uk' in item)"
              :key="(friend as any).uk"
              class="flex items-center rounded-lg bg-gray-50 p-3"
            >
              <img
                :src="(friend as any).avatar_url"
                :alt="(friend as any).uname"
                class="mr-3 h-10 w-10 rounded-full"
                @error="
                  ($event.target as HTMLImageElement).src =
                    '/default-avatar.png'
                "
              />
              <div class="flex-1">
                <div class="font-medium">{{ (friend as any).uname }}</div>
                <div class="text-sm text-gray-500">
                  {{ (friend as any).nick_name || '无昵称' }}
                </div>
              </div>
              <div class="text-sm text-gray-400">
                ID: {{ (friend as any).uk }}
              </div>
            </div>
          </div>

          <!-- 群组列表 -->
          <div v-else class="space-y-2">
            <div
              v-if="groupList.length === 0"
              class="py-8 text-center text-gray-500"
            >
              暂无群组
            </div>
            <div
              v-for="group in groupList.filter((item) => 'gid' in item)"
              :key="(group as any).gid"
              class="flex items-center rounded-lg bg-gray-50 p-3"
            >
              <div
                class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100"
              >
                <span class="font-bold text-green-600">群</span>
              </div>
              <div class="flex-1">
                <div class="font-medium">{{ (group as any).name }}</div>
                <div class="text-sm text-gray-500">
                  群号: {{ (group as any).gnum }}
                </div>
              </div>
              <div class="text-sm text-gray-400">
                ID: {{ (group as any).gid }}
              </div>
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
