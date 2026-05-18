<script lang="ts" setup>
import type { DecideResult } from '#/api/access';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
  Tag,
} from 'ant-design-vue';

import { runAccessDecideApi } from '#/api/access';

const userId = ref<number | undefined>();
const resourceType = ref('qbank.bank');
const resourceId = ref('');
const loading = ref(false);
const result = ref<DecideResult | null>(null);
const errorMsg = ref('');

const resourceTypeOptions = [
  { label: 'qbank.bank (题库)', value: 'qbank.bank' },
  { label: 'qbank.chapter (章节)', value: 'qbank.chapter' },
  { label: 'content.article (资料)', value: 'content.article' },
  { label: 'render.export (题本导出)', value: 'render.export' },
  { label: 'ai.grading (AI 评分)', value: 'ai.grading' },
];

const decisionColor: Record<string, string> = {
  allow: 'green',
  deny: 'red',
  skip: 'default',
};

async function handleRun(): Promise<void> {
  if (!userId.value || !resourceId.value) {
    message.warning('请填写完整的 user_id / resource_type / resource_id');
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  result.value = null;
  try {
    result.value = await runAccessDecideApi({
      user_id: userId.value,
      resource_type: resourceType.value,
      resource_id: resourceId.value,
    });
  } catch (error: any) {
    errorMsg.value = error?.msg || error?.message || '调用失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <Card title="决策入参" size="small">
      <Form layout="vertical">
        <Form layout="inline">
          <FormItem label="用户 ID" required>
            <InputNumber
              v-model:value="userId"
              placeholder="user_id"
              :min="1"
              style="width: 160px"
            />
          </FormItem>
          <FormItem label="资源类型" required>
            <Select
              v-model:value="resourceType"
              :options="resourceTypeOptions"
              style="width: 240px"
            />
          </FormItem>
          <FormItem label="资源 ID" required>
            <Input
              v-model:value="resourceId"
              placeholder="如 123 或 article_456"
              style="width: 200px"
            />
          </FormItem>
          <FormItem>
            <Button type="primary" :loading="loading" @click="handleRun"
              >
运行决策
</Button
            >
          </FormItem>
        </Form>
      </Form>
    </Card>

    <Alert
      v-if="errorMsg"
      type="error"
      :message="errorMsg"
      style="margin-top: 16px"
      closable
    />

    <Card
      v-if="result"
      :title="result.allow ? '允许访问' : '拒绝访问'"
      style="margin-top: 16px"
    >
      <template #extra>
        <Tag :color="result.allow ? 'green' : 'red'" class="text-sm">
          {{ result.allow ? 'ALLOW' : 'DENY' }}
        </Tag>
      </template>
      <p v-if="result.reason"><strong>原因:</strong> {{ result.reason }}</p>
      <p v-if="result.matched_rule">
        <strong>命中规则:</strong> {{ result.matched_rule }}
      </p>

      <h4 style="margin-top: 16px">Evaluator 链路</h4>
      <Empty
        v-if="!result.steps || result.steps.length === 0"
        description="无链路输出"
      />
      <div
        v-for="(step, index) in result.steps"
        :key="index"
        class="border-l-4 pl-3 py-2 mb-2"
        :class="{
          'border-l-green-500': step.decision === 'allow',
          'border-l-red-500': step.decision === 'deny',
          'border-l-gray-300': step.decision === 'skip',
        }"
      >
        <div class="flex items-center justify-between">
          <strong>{{ step.evaluator }}</strong>
          <Tag :color="decisionColor[step.decision] || 'default'">
            {{ step.decision.toUpperCase() }}
          </Tag>
        </div>
        <div v-if="step.reason" class="text-sm text-gray-500 mt-1">
          {{ step.reason }}
        </div>
      </div>
    </Card>
  </Page>
</template>
