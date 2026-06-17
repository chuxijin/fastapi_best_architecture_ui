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
  pass: 'default',
};

function formatMatched(matched?: null | Record<string, unknown>): string {
  if (!matched) {
    return '';
  }
  return JSON.stringify(matched);
}

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
            <Button type="primary" :loading="loading" @click="handleRun">
              运行决策
            </Button>
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
      :title="result.decision.allowed ? '允许访问' : '拒绝访问'"
      style="margin-top: 16px"
    >
      <template #extra>
        <Tag :color="result.decision.allowed ? 'green' : 'red'" class="text-sm">
          {{ result.decision.allowed ? 'ALLOW' : 'DENY' }}
        </Tag>
      </template>
      <p><strong>原因码:</strong> {{ result.decision.reason_code }}</p>
      <p v-if="result.decision.matched_grant">
        <strong>命中权益:</strong> {{ result.decision.matched_grant }}
      </p>

      <h4 style="margin-top: 16px">Evaluator 链路</h4>
      <Empty
        v-if="
          !result.decision.explanation ||
          result.decision.explanation.length === 0
        "
        description="无链路输出"
      />
      <div
        v-for="(step, index) in result.decision.explanation"
        :key="index"
        class="border-l-4 pl-3 py-2 mb-2"
        :class="{
          'border-l-green-500': step.outcome === 'allow',
          'border-l-red-500': step.outcome === 'deny',
          'border-l-gray-300': step.outcome === 'pass',
        }"
      >
        <div class="flex items-center justify-between">
          <strong>{{ step.evaluator }}</strong>
          <Tag :color="decisionColor[step.outcome] || 'default'">
            {{ step.outcome.toUpperCase() }}
          </Tag>
        </div>
        <div v-if="step.reason" class="text-sm text-gray-500 mt-1">
          {{ step.reason }}
        </div>
        <div v-if="step.matched" class="text-xs text-gray-500 mt-1">
          matched: {{ formatMatched(step.matched) }}
        </div>
      </div>

      <h4 style="margin-top: 16px">命中规则</h4>
      <Empty
        v-if="!result.rules || result.rules.length === 0"
        description="无规则"
      />
      <div
        v-for="rule in result.rules"
        :key="rule.id"
        class="mb-2 rounded border border-gray-200 px-3 py-2 text-sm"
      >
        <div class="flex items-center justify-between">
          <span>
            #{{ rule.id }} {{ rule.resource_type }}:{{ rule.resource_id }}
          </span>
          <Tag :color="rule.grant_mode === 'free_pass' ? 'green' : 'blue'">
            {{ rule.grant_mode }}
          </Tag>
        </div>
        <div class="mt-1 text-gray-500">
          {{ rule.entitlement_code }} · priority={{ rule.priority }} ·
          inherit={{ rule.inherit_to_children }}
        </div>
      </div>

      <h4 style="margin-top: 16px">用户权益快照</h4>
      <p>
        <strong>订阅 ID:</strong>
        {{ result.snapshot.subscription_ids.join(', ') || '-' }}
      </p>
      <p>
        <strong>直接授予 ID:</strong>
        {{ result.snapshot.direct_grant_ids.join(', ') || '-' }}
      </p>
      <div class="flex flex-wrap gap-2">
        <Tag
          v-for="code in result.snapshot.entitlement_codes"
          :key="code"
          color="blue"
        >
          {{ code }}
        </Tag>
      </div>
    </Card>
  </Page>
</template>
