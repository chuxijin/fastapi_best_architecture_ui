<script setup lang="ts">
import type { GrayscaleFeatureItem } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { confirm, Page, useVbenModal, VbenButton } from '@vben/common-ui';

import { Input, message, Slider, Switch, Tag } from 'antdv-next';

import {
  deleteGrayscaleConfigApi,
  getGrayscaleListApi,
  saveGrayscaleConfigApi,
} from '#/api';

const features = ref<GrayscaleFeatureItem[]>([]);
const pageLoading = ref(false);

const editingFeature = ref('');
const editEnabled = ref(true);
const editWhitelist = ref<string>('');
const editRatio = ref(0);

const newFeatureName = ref('');
const newEnabled = ref(true);
const newWhitelist = ref<string>('');
const newRatio = ref(0);

const savingFeature = ref('');

const fetchFeatures = async () => {
  pageLoading.value = true;
  try {
    const res = await getGrayscaleListApi();
    features.value = res.features;
  } catch {
    // ignore
  } finally {
    pageLoading.value = false;
  }
};

const startEdit = (item: GrayscaleFeatureItem) => {
  editingFeature.value = item.feature;
  editEnabled.value = item.enabled;
  editWhitelist.value = item.whitelist.join(', ');
  editRatio.value = Math.round(item.ratio * 100);
};

const cancelEdit = () => {
  editingFeature.value = '';
};

const saveEdit = async (feature: string) => {
  savingFeature.value = feature;
  try {
    const ids = editWhitelist.value
      .split(',')
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0);
    await saveGrayscaleConfigApi(feature, {
      enabled: editEnabled.value,
      whitelist: ids,
      ratio: editRatio.value / 100,
    });
    message.success('保存成功');
    editingFeature.value = '';
    await fetchFeatures();
  } catch {
    // ignore
  } finally {
    savingFeature.value = '';
  }
};

const deleteFeature = (feature: string) => {
  confirm({
    icon: 'warning',
    content: `确认删除灰度配置「${feature}」吗？删除后该功能将全量上线。`,
  }).then(async () => {
    try {
      await deleteGrayscaleConfigApi(feature);
      message.success('已删除，功能全量上线');
      await fetchFeatures();
    } catch {
      // ignore
    }
  });
};

const [AddModal, addModalApi] = useVbenModal({
  async onConfirm() {
    if (!newFeatureName.value.trim()) {
      message.warning('请输入功能名称');
      return;
    }
    try {
      const ids = newWhitelist.value
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n) && n > 0);
      await saveGrayscaleConfigApi(newFeatureName.value.trim(), {
        enabled: newEnabled.value,
        whitelist: ids,
        ratio: newRatio.value / 100,
      });
      message.success('创建成功');
      newFeatureName.value = '';
      newEnabled.value = true;
      newWhitelist.value = '';
      newRatio.value = 0;
      await addModalApi.close();
      await fetchFeatures();
    } catch {
      // ignore
    }
  },
});

const ratioLabel = (val: number) => `${val}%`;

const ratioTooltip = computed(() => {
  if (editRatio.value === 0) return '仅白名单用户可访问';
  if (editRatio.value === 100) return '白名单外所有用户均可访问';
  return `白名单外约 ${editRatio.value}% 用户可访问`;
});

const newRatioTooltip = computed(() => {
  if (newRatio.value === 0) return '仅白名单用户可访问';
  if (newRatio.value === 100) return '白名单外所有用户均可访问';
  return `白名单外约 ${newRatio.value}% 用户可访问`;
});

onMounted(() => {
  fetchFeatures();
});
</script>

<template>
  <Page>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold">灰度发布管理</h2>
      <VbenButton @click="() => addModalApi.open()">新增灰度</VbenButton>
    </div>

    <a-spin :spinning="pageLoading">
      <div v-if="features.length === 0" class="py-20 text-center text-gray-400">
        暂无灰度配置，点击「新增灰度」创建
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <a-card
          v-for="item in features"
          :key="item.feature"
          size="small"
          :title="item.feature"
        >
          <template v-if="editingFeature === item.feature">
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <span class="w-16 text-gray-500">启用</span>
                <Switch v-model:checked="editEnabled" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 shrink-0 text-gray-500">白名单</span>
                <Input
                  v-model:value="editWhitelist"
                  placeholder="用户 ID，逗号分隔，如 1, 2, 3"
                />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 shrink-0 text-gray-500">比例</span>
                <Slider
                  v-model:value="editRatio"
                  :min="0"
                  :max="100"
                  :step="1"
                  :tip-formatter="ratioLabel"
                  class="flex-1"
                />
                <span class="w-10 text-right text-sm">{{ editRatio }}%</span>
              </div>
              <div class="text-xs text-gray-400">{{ ratioTooltip }}</div>
              <div class="flex gap-2">
                <a-button
                  type="primary"
                  size="small"
                  :loading="savingFeature === item.feature"
                  @click="saveEdit(item.feature)"
                >
                  保存
                </a-button>
                <a-button size="small" @click="cancelEdit">取消</a-button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-gray-500">状态：</span>
                <Tag :color="item.enabled ? 'green' : 'red'">
                  {{ item.enabled ? '灰度中' : '已关闭' }}
                </Tag>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-500">白名单：</span>
                <span v-if="item.whitelist.length > 0">
                  <Tag v-for="id in item.whitelist" :key="id" color="blue">
                    {{ id }}
                  </Tag>
                </span>
                <span v-else class="text-gray-400">无</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-500">比例：</span>
                <span>{{ Math.round(item.ratio * 100) }}%</span>
              </div>
              <div class="flex gap-2 pt-2">
                <a-button size="small" @click="startEdit(item)">编辑</a-button>
                <a-button
                  size="small"
                  danger
                  @click="deleteFeature(item.feature)"
                >
                  删除
                </a-button>
              </div>
            </div>
          </template>
        </a-card>
      </div>
    </a-spin>

    <AddModal title="新增灰度配置">
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 text-gray-500">功能名称</span>
          <Input v-model:value="newFeatureName" placeholder="如 study_plan" />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 text-gray-500">启用</span>
          <Switch v-model:checked="newEnabled" />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 text-gray-500">白名单</span>
          <Input v-model:value="newWhitelist" placeholder="用户 ID，逗号分隔" />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-16 shrink-0 text-gray-500">比例</span>
          <Slider
            v-model:value="newRatio"
            :min="0"
            :max="100"
            :step="1"
            :tip-formatter="ratioLabel"
            class="flex-1"
          />
          <span class="w-10 text-right text-sm">{{ newRatio }}%</span>
        </div>
        <div class="text-xs text-gray-400">{{ newRatioTooltip }}</div>
      </div>
    </AddModal>
  </Page>
</template>
