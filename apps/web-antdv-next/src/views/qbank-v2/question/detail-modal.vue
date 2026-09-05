<script setup lang="ts">
import type { GetQuestionDetail } from '#/api/qbank-v2/question';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Card, Descriptions, Empty, Spin, Tag } from 'antdv-next';

import { getQuestionApi } from '#/api/qbank-v2/question';

import { questionTypeMap, statusMap } from './data';

const loading = ref(false);
const detail = ref<GetQuestionDetail | null>(null);

const gradingMethodMap: Record<string, string> = {
  exact: '完全匹配 (exact)',
  set: '集合匹配 (set)',
  ordered: '按序匹配 (ordered)',
  range: '范围匹配 (range)',
  keyword: '关键词匹配 (keyword)',
  rubric: '量规判分 (rubric)',
  manual: '人工批改 (manual)',
};

const explanationTypeMap: Record<string, string> = {
  official: '官方解析',
  expert: '专家解析',
  ai: 'AI 解析',
};

const isChoiceType = computed(() =>
  ['multiple_choice', 'single_choice', 'true_false'].includes(
    detail.value?.question_type || '',
  ),
);

const correctAnswerKeys = computed<string[]>(() => {
  const correct = detail.value?.answer?.answer_data?.correct;
  if (!correct) return [];
  if (Array.isArray(correct)) return correct.map(String);
  return [String(correct)];
});

const formattedAnswerText = computed(() => {
  const correct = detail.value?.answer?.answer_data?.correct;
  if (correct === undefined || correct === null) return '暂无答案';
  if (Array.isArray(correct)) return correct.join(', ');
  if (typeof correct === 'object') return JSON.stringify(correct, null, 2);
  return String(correct);
});

async function fetchDetail(id: number) {
  loading.value = true;
  try {
    detail.value = await getQuestionApi(id);
  } catch {
    detail.value = null;
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-4/5 max-w-4xl',
  showCancelButton: false,
  showConfirmButton: false,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      detail.value = null;
      return;
    }
    const data = modalApi.getData<{ id: number }>();
    if (data?.id) {
      await fetchDetail(data.id);
    }
  },
});
</script>

<template>
  <Modal :title="detail ? `题目详情 - ${detail.code}` : '题目详情'">
    <Spin :spinning="loading">
      <div v-if="detail" class="max-h-[78vh] overflow-y-auto space-y-4 p-2">
        <!-- 头部全景属性栏 -->
        <Card size="small" class="bg-blue-50/30 border-blue-100">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-mono text-base font-bold text-gray-800"
                >#{{ detail.id }}</span
              >
              <Tag color="blue" class="text-sm font-medium">
                {{
                  questionTypeMap[detail.question_type]?.label ||
                  detail.question_type
                }}
              </Tag>
              <Tag :color="statusMap[detail.status]?.color || 'default'">
                {{ statusMap[detail.status]?.label || detail.status }}
              </Tag>
              <Tag color="purple">分值: {{ detail.default_score }} 分</Tag>
              <Tag v-if="detail.difficulty" color="orange">
                难度: {{ detail.difficulty }}
              </Tag>
            </div>
            <div class="text-xs text-gray-500">
              可见范围:
              <span class="font-medium text-gray-700">{{
                detail.visibility
              }}</span>
              | 来源:
              <span class="font-medium text-gray-700">{{
                detail.origin_type
              }}</span>
            </div>
          </div>
        </Card>

        <!-- 题干与选项展示区 -->
        <Card title="题干与选项" size="small" class="shadow-sm">
          <!-- 题干正文 -->
          <div
            class="mb-4 rounded bg-gray-50 p-4 text-base leading-relaxed text-gray-800 border"
          >
            <div v-html="detail.stem"></div>
          </div>

          <!-- 选择题选项 -->
          <div v-if="isChoiceType && detail.options?.length" class="space-y-2">
            <div class="text-xs font-semibold text-gray-500 mb-2">
              选项列表：
            </div>
            <div
              v-for="(opt, idx) in detail.options"
              :key="idx"
              class="flex items-center justify-between rounded-lg border p-3 transition-all"
              :class="
                correctAnswerKeys.includes(opt.option_code)
                  ? 'border-green-400 bg-green-50/40 text-green-900 font-medium'
                  : 'border-gray-200 bg-white text-gray-700'
              "
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                  :class="
                    correctAnswerKeys.includes(opt.option_code)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  "
                >
                  {{ opt.option_code }}
                </span>
                <span v-html="opt.content || '(无内容)'"></span>
              </div>
              <Tag
                v-if="correctAnswerKeys.includes(opt.option_code)"
                color="success"
              >
                ✓ 正确答案
              </Tag>
            </div>
          </div>
        </Card>

        <!-- 标准答案 & 判分配置 -->
        <Card title="标准答案与判分规则" size="small" class="shadow-sm">
          <Descriptions :column="2" bordered size="small">
            <a-descriptions-item label="标准答案">
              <span class="font-semibold text-green-600">{{
                formattedAnswerText
              }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="判分方式">
              <span>{{
                gradingMethodMap[detail.answer?.grading_method || ''] ||
                detail.answer?.grading_method ||
                '-'
              }}</span>
            </a-descriptions-item>
          </Descriptions>
        </Card>

        <!-- 解析展示 -->
        <Card title="题目解析" size="small" class="shadow-sm">
          <div v-if="detail.explanations?.length" class="space-y-3">
            <div
              v-for="exp in detail.explanations"
              :key="exp.id"
              class="rounded-lg border p-3"
              :class="
                exp.is_default ? 'border-blue-300 bg-blue-50/20' : 'bg-gray-50'
              "
            >
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Tag color="cyan">
                    {{
                      explanationTypeMap[exp.explanation_type] ||
                      exp.explanation_type
                    }}
                  </Tag>
                  <Tag v-if="exp.is_default" color="green">默认展示解析</Tag>
                </div>
                <span class="text-xs text-gray-400"
                  >版本 v{{ exp.version_no }}</span
                >
              </div>
              <div
                class="text-sm leading-relaxed text-gray-700"
                v-html="exp.content"
              ></div>
            </div>
          </div>
          <Empty
            v-else
            description="暂无题目解析"
            :image-style="{ height: '40px' }"
          />
        </Card>

        <!-- 关联知识点 / 材料 / 交互题额外属性 -->
        <div class="grid grid-cols-2 gap-4">
          <!-- 知识点 -->
          <Card title="关联知识点" size="small" class="shadow-sm">
            <div
              v-if="detail.knowledge_points?.length"
              class="flex flex-wrap gap-2"
            >
              <Tag
                v-for="kp in detail.knowledge_points"
                :key="kp.id"
                color="purple"
              >
                {{
                  kp.knowledge_point_name || `知识点 #${kp.knowledge_point_id}`
                }}
                <span v-if="kp.role" class="ml-1 opacity-75"
                  >({{ kp.role }})</span
                >
              </Tag>
            </div>
            <span v-else class="text-xs text-gray-400">未标注知识点</span>
          </Card>

          <!-- 关联材料 -->
          <Card title="关联材料" size="small" class="shadow-sm">
            <div v-if="detail.materials?.length" class="space-y-1 text-xs">
              <div
                v-for="mat in detail.materials"
                :key="`${mat.material_id}-${mat.material_revision_id}-${mat.role}`"
                class="flex items-center justify-between rounded bg-gray-50 p-2"
              >
                <span
                  >材料 ID:
                  <strong class="text-blue-600">#{{ mat.material_id }}</strong>
                  (版本 #{{ mat.material_revision_id }})</span
                >
                <Tag color="blue">{{ mat.role }}</Tag>
              </div>
            </div>
            <span v-else class="text-xs text-gray-400">未关联材料</span>
          </Card>
        </div>

        <!-- 详细元信息 -->
        <Card title="系统元数据" size="small" class="shadow-sm bg-gray-50/50">
          <Descriptions :column="3" size="small">
            <a-descriptions-item label="创建时间">
              {{ detail.created_time || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="更新时间">
              {{ detail.updated_time || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="内容哈希 (content_hash)">
              <span class="font-mono text-xs text-gray-500">{{
                detail.content_hash || '-'
              }}</span>
            </a-descriptions-item>
          </Descriptions>
        </Card>
      </div>
    </Spin>
  </Modal>
</template>

<style scoped></style>
