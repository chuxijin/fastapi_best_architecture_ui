<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type {
  AppDeviceResult,
  CreateAppDeviceParams,
  DeviceAuthorizationHistory,
} from '#/api';

import { computed, h, onMounted, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message, Table, Tag } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAppDeviceApi,
  deleteAppDeviceApi,
  disableAuthorizationApi,
  getAppDeviceListApi,
  getApplicationOptions,
  getAppPackageListApi,
  getDeviceAuthorizationHistoryApi,
  manualAuthorizeDeviceApi,
  redeemCodeAuthorizeApi,
  updateAppDeviceApi,
  updateAuthorizationTimeApi,
} from '#/api';

import { querySchema, schema, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.search'),
  },
  schema: querySchema,
};

const gridOptions: VxeTableGridOptions<AppDeviceResult> = {
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
  columns: useColumns(onActionClick),
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getAppDeviceListApi({
          page: page.currentPage,
          size: page.pageSize,
          ...formValues,
        });
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

function onRefresh() {
  gridApi.query();
}

function onActionClick({ code, row }: OnActionClickParams<AppDeviceResult>) {
  switch (code) {
    case 'delete': {
      deleteAppDeviceApi(row.id).then(() => {
        message.success({
          content: $t('ui.actionMessage.deleteSuccess', [
            row.device_name || row.device_id,
          ]),
          key: 'action_process_msg',
        });
        onRefresh();
      });
      break;
    }
    case 'edit': {
      modalApi.setData(row).open();
      break;
    }
    case 'view': {
      showHistoryModal(row);
      break;
    }
  }
}

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema,
});

interface FormAppDeviceParams extends CreateAppDeviceParams {
  id?: number;
}

const formData = ref<FormAppDeviceParams>();

const modalTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['设备'])
    : $t('ui.actionTitle.create', ['设备']);
});

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues<CreateAppDeviceParams>();
      try {
        await (formData.value?.id
          ? updateAppDeviceApi(formData.value?.id, data)
          : createAppDeviceApi(data));
        await modalApi.close();
        onRefresh();
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<FormAppDeviceParams>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
      }
    }
  },
});

// 授权历史相关
const historyData = ref<DeviceAuthorizationHistory | null>(null);
const currentDevice = ref<AppDeviceResult | null>(null);

// 应用和套餐选项
const applicationOptions = ref<Array<{ label: string; value: number }>>([]);
const packageOptions = ref<Array<{ label: string; value: number }>>([]);

// 表单数据
const manualAuthForm = ref({
  application_id: '',
  package_id: '',
});

const redeemAuthForm = ref({
  redeem_code: '',
});

const [HistoryModal, historyModalApi] = useVbenModal({
  title: '设备授权历史',
  destroyOnClose: true,
});

async function showHistoryModal(device: AppDeviceResult) {
  try {
    currentDevice.value = device;
    const data = await getDeviceAuthorizationHistoryApi(device.id);
    historyData.value = data;
    historyModalApi.open();
  } catch {
    message.error('获取授权历史失败');
  }
}

// 手动授权相关
const [ManualAuthModal, manualAuthModalApi] = useVbenModal({
  title: '手动授权',
  destroyOnClose: true,
  async onConfirm() {
    try {
      if (
        !manualAuthForm.value.application_id ||
        !manualAuthForm.value.package_id ||
        !currentDevice.value?.device_id
      ) {
        message.error('请填写完整的授权信息');
        return;
      }

      // 获取选中的套餐信息
      const selectedPackage = packageOptions.value.find(
        (pkg) => pkg.value === Number(manualAuthForm.value.package_id),
      );
      if (!selectedPackage) {
        message.error('请选择有效的套餐');
        return;
      }

      // 从套餐标签中提取天数（格式：套餐名称 (天数天)）
      const durationMatch = selectedPackage.label.match(/\((\d+)天\)/);
      const durationDays = durationMatch
        ? Number.parseInt(durationMatch[1] ?? '30', 10)
        : 30; // 默认30天

      await manualAuthorizeDeviceApi({
        application_id: Number(manualAuthForm.value.application_id),
        device_id: currentDevice.value!.device_id,
        duration_days: durationDays,
        remark: '手动授权',
      });

      message.success('手动授权成功');
      manualAuthModalApi.close();

      // 刷新授权历史
      if (currentDevice.value) {
        showHistoryModal(currentDevice.value);
      }
    } catch (error: any) {
      console.error('手动授权失败:', error);
      message.error(error.response?.data?.message || '手动授权失败');
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      // 重置表单
      manualAuthForm.value = {
        application_id: '',
        package_id: '',
      };
    }
  },
});

// 兑换码授权相关
const [RedeemAuthModal, redeemAuthModalApi] = useVbenModal({
  title: '兑换码授权',
  destroyOnClose: true,
  async onConfirm() {
    try {
      if (
        !redeemAuthForm.value.redeem_code ||
        !currentDevice.value?.device_id
      ) {
        message.error('请填写完整的授权信息');
        return;
      }

      await redeemCodeAuthorizeApi({
        code: redeemAuthForm.value.redeem_code,
        device_id: currentDevice.value!.device_id,
      });

      message.success('兑换码授权成功');
      redeemAuthModalApi.close();

      // 刷新授权历史
      if (currentDevice.value) {
        showHistoryModal(currentDevice.value);
      }
    } catch (error: any) {
      console.error('兑换码授权失败:', error);
      message.error(error.response?.data?.message || '兑换码授权失败');
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      // 重置表单
      redeemAuthForm.value = {
        redeem_code: '',
      };
    }
  },
});

// 授权历史表格列定义
const historyColumns = [
  {
    title: '应用名称',
    dataIndex: 'application_name',
    key: 'application_name',
    width: 150,
  },
  {
    title: '应用标识',
    dataIndex: 'app_key',
    key: 'app_key',
    width: 120,
  },
  {
    title: '授权类型',
    dataIndex: 'auth_type_text',
    key: 'auth_type_text',
    width: 100,
  },
  {
    title: '授权状态',
    dataIndex: 'status_text',
    key: 'status_text',
    width: 100,
    customRender: ({ record }: any) => {
      const color =
        record.status === 1 ? 'green' : record.status === 0 ? 'red' : 'orange';
      return h(Tag, { color }, () => record.status_text);
    },
  },
  {
    title: '开始时间',
    dataIndex: 'start_time',
    key: 'start_time',
    width: 150,
  },
  {
    title: '结束时间',
    dataIndex: 'end_time',
    key: 'end_time',
    width: 150,
  },
  {
    title: '剩余天数',
    dataIndex: 'remaining_days',
    key: 'remaining_days',
    width: 100,
    customRender: ({ record }: any) => {
      if (record.remaining_days === null) return '永久';
      if (record.remaining_days <= 0) return '已过期';
      return `${record.remaining_days}天`;
    },
  },
  {
    title: '授权来源',
    dataIndex: 'auth_source',
    key: 'auth_source',
    width: 120,
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'created_time',
    key: 'created_time',
    width: 150,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right' as const,
    customRender: ({ record }: any) => {
      return h('div', { class: 'flex gap-2' }, [
        h(
          VbenButton,
          {
            size: 'sm',
            onClick: () => handleEditAuthTime(record),
          },
          () => '修改时间',
        ),
        h(
          VbenButton,
          {
            size: 'sm',
            danger: true,
            onClick: () => handleDisableAuth(record),
          },
          () => '失效',
        ),
      ]);
    },
  },
];

// 初始化选项数据
const initOptions = async () => {
  try {
    // 加载应用选项
    const appResponse = await getApplicationOptions();
    applicationOptions.value = appResponse.map((item: any) => ({
      label: item.name,
      value: item.id,
    }));

    // 加载套餐选项
    const packageResponse = await getAppPackageListApi({ page: 1, size: 100 });
    packageOptions.value = packageResponse.items.map((item: any) => ({
      label: `${item.name} (${item.duration_days}天)`,
      value: item.id,
    }));
  } catch (error) {
    console.error('加载选项数据失败:', error);
  }
};

// 修改授权时间
const editAuthForm = ref({
  end_time: '',
  remark: '',
});

const currentAuth = ref<any>(null);

const [EditAuthModal, editAuthModalApi] = useVbenModal({
  title: '修改授权时间',
  destroyOnClose: true,
  async onConfirm() {
    try {
      if (!currentAuth.value) {
        message.error('授权信息不存在');
        return;
      }

      await updateAuthorizationTimeApi(currentAuth.value.id, {
        end_time: editAuthForm.value.end_time || undefined,
        remark: editAuthForm.value.remark || undefined,
      });

      message.success('修改授权时间成功');
      editAuthModalApi.close();

      // 刷新授权历史
      if (currentDevice.value) {
        showHistoryModal(currentDevice.value);
      }
    } catch (error: any) {
      console.error('修改授权时间失败:', error);
      message.error(error.response?.data?.message || '修改授权时间失败');
    }
  },
  onOpenChange(isOpen) {
    if (isOpen && currentAuth.value) {
      // 设置默认值
      editAuthForm.value = {
        end_time:
          currentAuth.value.end_time === '永久'
            ? ''
            : currentAuth.value.end_time.replace(' ', 'T'),
        remark: currentAuth.value.remark || '',
      };
    }
  },
});

function handleEditAuthTime(auth: any) {
  currentAuth.value = auth;
  editAuthModalApi.open();
}

async function handleDisableAuth(auth: any) {
  try {
    await disableAuthorizationApi(auth.id);
    message.success('授权已失效');

    // 刷新授权历史
    if (currentDevice.value) {
      showHistoryModal(currentDevice.value);
    }
  } catch (error: any) {
    console.error('使授权失效失败:', error);
    message.error(error.response?.data?.message || '使授权失效失败');
  }
}

onMounted(() => {
  initOptions();
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-actions>
        <VbenButton @click="() => modalApi.setData(null).open()">
          <MaterialSymbolsAdd class="size-5" />
          新增设备
        </VbenButton>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <Form />
    </Modal>

    <!-- 授权历史弹窗 -->
    <HistoryModal>
      <div v-if="historyData" class="history-container">
        <!-- 设备信息 -->
        <div class="device-info">
          <h3>设备信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">设备ID:</span>
              <span class="info-value">{{
                historyData.device_info.device_id
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">设备名称:</span>
              <span class="info-value">{{
                historyData.device_info.device_name || '-'
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">设备类型:</span>
              <span class="info-value">{{
                historyData.device_info.device_type || '-'
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">操作系统:</span>
              <span class="info-value">{{
                historyData.device_info.os_info || '-'
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">IP地址:</span>
              <span class="info-value">{{
                historyData.device_info.ip_address || '-'
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">首次发现:</span>
              <span class="info-value">{{
                historyData.device_info.first_seen
              }}</span>
            </div>
          </div>
        </div>

        <!-- 授权历史 -->
        <div class="history-section">
          <div class="mb-4 flex items-center justify-between">
            <h3>授权历史 (共 {{ historyData.total_count }} 条记录)</h3>
            <div class="flex gap-2">
              <VbenButton
                type="primary"
                size="sm"
                @click="manualAuthModalApi.open()"
              >
                手动授权
              </VbenButton>
              <VbenButton size="sm" @click="redeemAuthModalApi.open()">
                兑换码授权
              </VbenButton>
            </div>
          </div>
          <Table
            :columns="historyColumns"
            :data-source="historyData.authorizations"
            :pagination="false"
            :scroll="{ x: 1400 }"
            size="small"
            bordered
          />
        </div>
      </div>
    </HistoryModal>

    <!-- 手动授权弹窗 -->
    <ManualAuthModal>
      <div class="p-4">
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium">应用</label>
            <select
              v-model="manualAuthForm.application_id"
              class="w-full rounded border px-3 py-2"
            >
              <option value="">请选择应用</option>
              <option
                v-for="app in applicationOptions"
                :key="app.value"
                :value="app.value"
              >
                {{ app.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">设备</label>
            <input
              type="text"
              class="w-full rounded border bg-gray-100 px-3 py-2"
              :value="currentDevice?.device_id"
              readonly
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">套餐</label>
            <select
              v-model="manualAuthForm.package_id"
              class="w-full rounded border px-3 py-2"
            >
              <option value="">请选择套餐</option>
              <option
                v-for="pkg in packageOptions"
                :key="pkg.value"
                :value="pkg.value"
              >
                {{ pkg.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </ManualAuthModal>

    <!-- 兑换码授权弹窗 -->
    <RedeemAuthModal>
      <div class="p-4">
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium">兑换码说明</label>
            <p class="rounded bg-gray-50 p-2 text-sm text-gray-600">
              兑换码包含应用信息，无需选择应用
            </p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">设备</label>
            <input
              type="text"
              class="w-full rounded border bg-gray-100 px-3 py-2"
              :value="currentDevice?.device_id"
              readonly
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">兑换码</label>
            <input
              v-model="redeemAuthForm.redeem_code"
              type="text"
              class="w-full rounded border px-3 py-2"
              placeholder="请输入兑换码"
            />
          </div>
        </div>
      </div>
    </RedeemAuthModal>

    <!-- 修改授权时间弹窗 -->
    <EditAuthModal>
      <div class="p-4">
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium">当前授权信息</label>
            <div v-if="currentAuth" class="rounded bg-gray-50 p-3">
              <p><strong>应用:</strong> {{ currentAuth.application_name }}</p>
              <p><strong>当前结束时间:</strong> {{ currentAuth.end_time }}</p>
              <p><strong>当前状态:</strong> {{ currentAuth.status_text }}</p>
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">新的结束时间</label>
            <input
              v-model="editAuthForm.end_time"
              type="datetime-local"
              class="w-full rounded border px-3 py-2"
              placeholder="留空表示永久授权"
            />
            <p class="mt-1 text-xs text-gray-500">留空表示永久授权</p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">备注</label>
            <textarea
              v-model="editAuthForm.remark"
              class="w-full rounded border px-3 py-2"
              rows="3"
              placeholder="请输入修改原因或备注信息"
            ></textarea>
          </div>
        </div>
      </div>
    </EditAuthModal>
  </Page>
</template>

<style scoped>
.history-container {
  padding: 16px;
}

.device-info {
  margin-bottom: 24px;
}

.device-info h3,
.history-section h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-label {
  min-width: 80px;
  margin-right: 8px;
  font-weight: 500;
  color: #666;
}

.info-value {
  flex: 1;
  color: #333;
}

.history-section {
  margin-top: 24px;
}

:deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  background: #fafafa;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5;
}

/* 加宽授权历史模态框 */
:deep(.ant-modal) {
  width: 90vw;
  max-width: 1200px;
}

:deep(.ant-modal-content) {
  width: 100%;
}
</style>
