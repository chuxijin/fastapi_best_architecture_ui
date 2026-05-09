<script lang="ts" setup>
import type { QuestClaimResult } from '#/api';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Button as AButton,
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  Image as AImage,
  Tag as ATag,
  Textarea as ATextarea,
  Modal,
  message,
} from 'ant-design-vue';

import {
  retryGrantQuestClaimApi,
  reviewQuestClaimApi,
  revokeQuestClaimApi,
} from '#/api';

import { claimStatusMap, rewardStatusMap } from './data';

const emit = defineEmits<{ refresh: [] }>();

const claim = ref<null | QuestClaimResult>(null);
const remark = ref('');
const submitting = ref(false);

const canReview = computed(() => claim.value?.claim_status === 1);
const canRevoke = computed(
  () => claim.value && [2, 4].includes(claim.value.claim_status),
);
const canRetryGrant = computed(() => claim.value?.reward_status === 2);

const submissionLinks = computed(() => claim.value?.submission_links ?? []);
const submissionImages = computed(() => claim.value?.submission_images ?? []);

const [Drawer, drawerApi] = useVbenDrawer({
  destroyOnClose: true,
  class: 'w-[920px]',
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      claim.value = drawerApi.getData<QuestClaimResult>();
      remark.value = claim.value?.review_remark ?? '';
    } else {
      claim.value = null;
      remark.value = '';
    }
  },
});

defineExpose({
  open(target: QuestClaimResult) {
    drawerApi.setData(target).open();
  },
});

async function handleApprove() {
  if (!claim.value) return;
  submitting.value = true;
  try {
    const result = await reviewQuestClaimApi(claim.value.id, {
      decision: 'approve',
      remark: remark.value || undefined,
    });
    message.success(result.message || '审核通过');
    emit('refresh');
    drawerApi.close();
  } finally {
    submitting.value = false;
  }
}

async function handleReject() {
  if (!claim.value) return;
  if (!remark.value.trim()) {
    message.warning('拒绝时请填写备注说明');
    return;
  }
  submitting.value = true;
  try {
    const result = await reviewQuestClaimApi(claim.value.id, {
      decision: 'reject',
      remark: remark.value,
    });
    message.success(result.message || '已拒绝');
    emit('refresh');
    drawerApi.close();
  } finally {
    submitting.value = false;
  }
}

async function handleRevoke() {
  if (!claim.value) return;
  Modal.confirm({
    title: '硬撤销',
    content:
      '撤销将回收已发放的奖励。仅经验/积分类型支持自动撤销, 会员/权益类型需手动处理。确认继续吗?',
    okType: 'danger',
    async onOk() {
      submitting.value = true;
      try {
        const result = await revokeQuestClaimApi(claim.value!.id, {
          remark: remark.value || undefined,
        });
        message.success(result.message || '已撤销');
        emit('refresh');
        drawerApi.close();
      } finally {
        submitting.value = false;
      }
    },
  });
}

async function handleRetryGrant() {
  if (!claim.value) return;
  submitting.value = true;
  try {
    await retryGrantQuestClaimApi(claim.value.id);
    message.success('已触发重试发奖');
    emit('refresh');
    drawerApi.close();
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer title="领取记录审核">
    <div v-if="claim" class="grid grid-cols-2 gap-6">
      <!-- 左侧: 提交内容 -->
      <div>
        <div class="mb-3 text-base font-semibold">提交内容</div>
        <ADescriptions :column="1" size="small" bordered>
          <ADescriptionsItem label="记录 ID">
            {{ claim.id }}
          </ADescriptionsItem>
          <ADescriptionsItem label="任务 ID">
            {{ claim.quest_id }}
          </ADescriptionsItem>
          <ADescriptionsItem label="用户 ID">
            {{ claim.user_id }}
          </ADescriptionsItem>
          <ADescriptionsItem label="领取状态">
            <ATag :color="claimStatusMap[claim.claim_status]?.color">
              {{ claimStatusMap[claim.claim_status]?.label }}
            </ATag>
          </ADescriptionsItem>
          <ADescriptionsItem label="奖励状态">
            <ATag :color="rewardStatusMap[claim.reward_status]?.color">
              {{ rewardStatusMap[claim.reward_status]?.label }}
            </ATag>
          </ADescriptionsItem>
          <ADescriptionsItem label="领取时间">
            {{ claim.claim_time || '-' }}
          </ADescriptionsItem>
          <ADescriptionsItem label="过期时间">
            {{ claim.expire_time || '不限时' }}
          </ADescriptionsItem>
          <ADescriptionsItem label="提交时间">
            {{ claim.submit_time || '-' }}
          </ADescriptionsItem>
        </ADescriptions>

        <div class="mt-4">
          <div class="mb-2 font-medium">提交链接</div>
          <div v-if="submissionLinks.length === 0" class="text-gray-400">
            (无)
          </div>
          <ul v-else class="list-disc pl-5">
            <li v-for="(url, idx) in submissionLinks" :key="idx">
              <a
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:underline break-all"
              >
                {{ url }}
              </a>
            </li>
          </ul>
        </div>

        <div class="mt-4">
          <div class="mb-2 font-medium">提交图片</div>
          <div v-if="submissionImages.length === 0" class="text-gray-400">
            (无)
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <AImage
              v-for="(url, idx) in submissionImages"
              :key="idx"
              :src="url"
              :width="120"
              :height="120"
              class="object-cover"
            />
          </div>
        </div>

        <div class="mt-4">
          <div class="mb-2 font-medium">提交说明</div>
          <div class="whitespace-pre-wrap text-gray-700">
            {{ claim.submission_note || '(无)' }}
          </div>
        </div>
      </div>

      <!-- 右侧: 审核操作 -->
      <div>
        <div class="mb-3 text-base font-semibold">审核操作</div>
        <div class="mb-2 font-medium">备注</div>
        <ATextarea
          v-model:value="remark"
          :rows="6"
          :max-length="500"
          placeholder="审核 / 撤销时填写, 拒绝必填"
        />
        <div class="mt-3 text-xs text-gray-500">
          已审核备注: {{ claim.review_remark || '(无)' }}
        </div>

        <div class="mt-6 flex flex-col gap-3">
          <AButton
            v-if="canReview"
            type="primary"
            :loading="submitting"
            @click="handleApprove"
          >
            审核通过
          </AButton>
          <AButton
            v-if="canReview"
            danger
            :loading="submitting"
            @click="handleReject"
          >
            拒绝
          </AButton>
          <AButton
            v-if="canRetryGrant"
            type="default"
            :loading="submitting"
            @click="handleRetryGrant"
          >
            重试发奖
          </AButton>
          <AButton
            v-if="canRevoke"
            danger
            type="primary"
            :loading="submitting"
            @click="handleRevoke"
          >
            硬撤销(回收奖励)
          </AButton>
        </div>
      </div>
    </div>
  </Drawer>
</template>
