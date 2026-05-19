<script lang="ts" setup>
import type { SubscriptionTemplateResult } from '#/api/access';
import type {
  ActcodeBatchResult,
  CreateBatchParams,
} from '#/api/knowledge-store';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Spin,
  Table,
  TabPane,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { getSubscriptionTemplateDetailApi } from '#/api/access';
import {
  createActcodeBatchApi,
  getActcodeBatchListApi,
} from '#/api/knowledge-store';

const route = useRoute();
const router = useRouter();

const templateId = computed(() => Number(route.params.id));
const detail = ref<null | SubscriptionTemplateResult>(null);
const detailLoading = ref(false);

const batches = ref<ActcodeBatchResult[]>([]);
const batchesLoading = ref(false);
const activeTab = ref<'base' | 'batches' | 'subscriptions'>('base');

const batchFormState = ref<{
  app_id: string;
  max_use_per_code: number;
  name: string;
  total_count: number;
  valid_to: null | string;
}>({
  app_id: '',
  name: '',
  total_count: 10,
  max_use_per_code: 1,
  valid_to: null,
});

async function loadDetail(): Promise<void> {
  detailLoading.value = true;
  try {
    detail.value = await getSubscriptionTemplateDetailApi(templateId.value);
    if (!batchFormState.value.name && detail.value) {
      batchFormState.value.name = `${detail.value.name} - 批次`;
    }
  } catch (error) {
    console.error('加载模板详情失败:', error);
    message.error('模板详情加载失败');
  } finally {
    detailLoading.value = false;
  }
}

async function loadBatches(): Promise<void> {
  if (!detail.value) {
    return;
  }
  batchesLoading.value = true;
  try {
    const res = await getActcodeBatchListApi({
      page: 1,
      size: 100,
    } as any);
    batches.value = ((res?.items || []) as ActcodeBatchResult[]).filter(
      (item: any) => item?.reward_data?.template_code === detail.value?.code,
    );
  } catch (error) {
    console.error('加载关联批次失败:', error);
    batches.value = [];
  } finally {
    batchesLoading.value = false;
  }
}

function handleTabChange(value: any): void {
  activeTab.value = value;
  if (value === 'batches' && batches.value.length === 0) {
    void loadBatches();
  }
}

const [BatchModal, batchModalApi] = useVbenModal({
  title: '为该模板生成激活码批次',
  onConfirm: async () => {
    if (!detail.value) {
      return;
    }
    if (!batchFormState.value.app_id || !batchFormState.value.name) {
      message.warning('请填写应用 ID 和批次名称');
      return;
    }
    try {
      const params: CreateBatchParams = {
        app_id: batchFormState.value.app_id,
        name: batchFormState.value.name,
        reward_type: 'subscription',
        reward_data: { template_code: detail.value.code },
        total_count: batchFormState.value.total_count,
        max_use_per_code: batchFormState.value.max_use_per_code,
        valid_to: batchFormState.value.valid_to,
      } as any;
      await createActcodeBatchApi(params);
      message.success('批次创建成功');
      batchModalApi.close();
      await loadBatches();
    } catch (error) {
      console.error('创建批次失败:', error);
    }
  },
});

function openBatchModal(): void {
  batchFormState.value = {
    app_id: '',
    name: `${detail.value?.name || ''} - 批次`,
    total_count: 10,
    max_use_per_code: 1,
    valid_to: null,
  };
  batchModalApi.open();
}

function goToRedeemCodeCenter(): void {
  router.push({
    path: '/app-auth/redeem-code',
    query: { template_code: detail.value?.code, reward_type: 'subscription' },
  });
}

const batchColumns = [
  { title: 'ID', dataIndex: 'id', width: 70 },
  { title: '批次编号', dataIndex: 'batch_no' },
  { title: '名称', dataIndex: 'name' },
  { title: '总数', dataIndex: 'total_count', width: 80 },
  { title: '已用', dataIndex: 'used_count', width: 80 },
  { title: '创建时间', dataIndex: 'created_time', width: 170 },
];

onMounted(() => {
  void loadDetail();
});
</script>

<template>
  <Page auto-content-height>
    <div class="rounded-lg bg-white p-4">
      <Spin :spinning="detailLoading">
        <Empty v-if="!detail" description="未找到模板" />
        <template v-else>
          <div class="mb-3 flex items-center justify-between">
            <div>
              <span class="text-lg font-bold">{{ detail.name }}</span>
              <Tag class="ml-2" color="blue">{{ detail.code }}</Tag>
              <Tag :color="detail.status === 'active' ? 'green' : 'default'">
                {{ detail.status === 'active' ? '生效' : '停用' }}
              </Tag>
            </div>
            <Button @click="router.back()">返回</Button>
          </div>

          <Tabs :active-key="activeTab" @change="handleTabChange">
            <TabPane key="base" tab="基础信息">
              <Descriptions :column="2" bordered size="small">
                <DescriptionsItem label="模板编码">
                  {{ detail.code }}
                </DescriptionsItem>
                <DescriptionsItem label="模板名称">
                  {{ detail.name }}
                </DescriptionsItem>
                <DescriptionsItem label="Pack">
                  {{ detail.pack_code }}
                </DescriptionsItem>
                <DescriptionsItem label="有效天数">
                  {{ detail.duration_days }} 天
                </DescriptionsItem>
                <DescriptionsItem label="现价">
                  ¥{{
                    (
                      Number(detail.price_cents ?? detail.price ?? 0) / 100
                    ).toFixed(2)
                  }}
                </DescriptionsItem>
                <DescriptionsItem label="原价">
                  ¥{{ (Number(detail.original_price ?? 0) / 100).toFixed(2) }}
                </DescriptionsItem>
                <DescriptionsItem label="关联领域">
                  <Tag v-for="d in detail.domain_codes" :key="d" color="blue">
                    {{ d }}
                  </Tag>
                </DescriptionsItem>
                <DescriptionsItem label="描述">
                  {{ detail.description || '-' }}
                </DescriptionsItem>
              </Descriptions>
            </TabPane>

            <TabPane key="batches" tab="关联激活码批次">
              <div class="mb-3 flex items-center justify-between">
                <span class="text-sm text-gray-500">
                  通过 reward_data.template_code 关联, 共
                  {{ batches.length }} 个批次
                </span>
                <div>
                  <Button class="mr-2" @click="goToRedeemCodeCenter">
                    前往激活码中心
                  </Button>
                  <Button type="primary" @click="openBatchModal">
                    + 创建批次
                  </Button>
                </div>
              </div>
              <Table
                :data-source="batches"
                :columns="batchColumns"
                :loading="batchesLoading"
                :pagination="false"
                row-key="id"
                size="small"
              />
            </TabPane>

            <TabPane key="subscriptions" tab="订阅快照">
              <Empty
                description="此处可挂载用户订阅列表(filter by template_code)"
              />
            </TabPane>
          </Tabs>
        </template>
      </Spin>
    </div>

    <BatchModal>
      <Form layout="vertical">
        <FormItem label="应用 ID" required>
          <Input
            v-model:value="batchFormState.app_id"
            placeholder="例如 fba-mini"
          />
        </FormItem>
        <FormItem label="批次名称" required>
          <Input v-model:value="batchFormState.name" />
        </FormItem>
        <FormItem label="生成数量" required>
          <InputNumber
            v-model:value="batchFormState.total_count"
            :min="1"
            :max="100000"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="单码最大使用次数">
          <InputNumber
            v-model:value="batchFormState.max_use_per_code"
            :min="1"
            :max="100"
            style="width: 100%"
          />
        </FormItem>
      </Form>
    </BatchModal>
  </Page>
</template>
