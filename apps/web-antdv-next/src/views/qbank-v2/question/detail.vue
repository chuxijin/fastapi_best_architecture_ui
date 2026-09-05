<script lang="ts" setup>
import type { GetQuestionDetail } from '#/api';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsArrowBack } from '@vben/icons';

import { getQuestionApi } from '#/api/qbank-v2/question';

const route = useRoute();
const router = useRouter();
const questionId = Number(route.params.id);

const question = ref<GetQuestionDetail>();

onMounted(async () => {
  question.value = await getQuestionApi(questionId);
});

const typeLabels: Record<string, string> = {
  single_choice: '单选题',
  multiple_choice: '多选题',
  true_false: '判断题',
  fill_blank: '填空题',
  short_answer: '简答题',
  composite: '综合题',
  interactive: '交互题',
};
</script>

<template>
  <Page auto-content-height>
    <template #header>
      <div class="flex items-center gap-3 p-4">
        <VbenButton size="sm" @click="router.push('/qbank-v2/question')">
          <MaterialSymbolsArrowBack class="size-4" />
          返回
        </VbenButton>
        <span class="text-lg font-medium">题目详情</span>
        <a-tag>{{ question?.code }}</a-tag>
        <a-tag v-if="question" color="blue">
          {{ typeLabels[question.question_type] || question.question_type }}
        </a-tag>
      </div>
    </template>

    <div class="p-4 space-y-4">
      <a-card title="基本信息" size="small">
        <a-descriptions :column="3" size="small" bordered>
          <a-descriptions-item label="题目编码">
            {{ question?.code }}
          </a-descriptions-item>
          <a-descriptions-item label="题型">
            {{ question ? typeLabels[question.question_type] : '' }}
          </a-descriptions-item>
          <a-descriptions-item label="默认分值">
            {{ question?.default_score }}
          </a-descriptions-item>
          <a-descriptions-item label="难度">
            {{ question?.difficulty ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="来源">
            {{ question?.origin_type }}
          </a-descriptions-item>
          <a-descriptions-item label="可见范围">
            {{ question?.visibility }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="题干" size="small">
        <div
          class="leading-relaxed whitespace-pre-wrap"
          v-html="question?.stem"
        ></div>
      </a-card>

      <a-card v-if="question?.options?.length" title="选项" size="small">
        <div v-for="(opt, idx) in question.options" :key="idx" class="py-1">
          <span class="font-mono mr-2"
            >{{ opt.option_code || String.fromCharCode(65 + idx) }}.</span
          >
          <span v-html="opt.content"></span>
        </div>
      </a-card>

      <a-card title="答案" size="small">
        <pre class="whitespace-pre-wrap bg-gray-50 p-3 rounded">{{
          JSON.stringify(question?.answer?.answer_data, null, 2) || '-'
        }}</pre>
      </a-card>

      <a-card title="解析" size="small">
        <div v-if="question?.explanations?.length">
          <div
            v-for="exp in question.explanations"
            :key="exp.id"
            class="mb-2 p-3 bg-gray-50 rounded"
          >
            <div class="mb-1 text-xs text-gray-500">
              {{ exp.explanation_type }}{{ exp.is_default ? ' (默认)' : '' }}
            </div>
            <div v-html="exp.content"></div>
          </div>
        </div>
        <span v-else class="text-gray-400">暂无解析</span>
      </a-card>

      <a-card
        v-if="question?.knowledge_points?.length"
        title="关联知识点"
        size="small"
      >
        <a-tag
          v-for="kp in question.knowledge_points"
          :key="kp.id"
          class="mb-1"
        >
          {{ kp.knowledge_point_name }}
          <span class="text-xs ml-1 text-gray-400">({{ kp.role }})</span>
        </a-tag>
      </a-card>
    </div>
  </Page>
</template>
