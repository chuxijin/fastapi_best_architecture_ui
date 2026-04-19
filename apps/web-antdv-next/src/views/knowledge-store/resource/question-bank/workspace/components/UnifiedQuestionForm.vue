<script setup lang="ts">
import type { DifficultyType, QuestionType } from '#/api';

import { onMounted, ref, watch } from 'vue';

import {
  MaterialSymbolsAdd,
  MaterialSymbolsDelete,
} from '@vben/icons';

import {
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  InputNumber,
  message,
  Radio,
  Row,
  Select,
  Space,
  Switch,
} from 'ant-design-vue';

import { getQuestionDetailApi } from '#/api';
import { requestClient } from '#/api/request';
import HaloEditorWrapper from '#/components/HaloEditor/HaloEditorWrapper.vue';

import ShortAnswerEditor from './ShortAnswerEditor.vue';

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: any];
}>();

interface Props {
  bankId: number;
  questionType: QuestionType;
  chapterOptions: Array<{ label: string; value: number }>;
  editId?: null | number;
  prefillData?: any;
}

interface QuestionOption {
  label: string;
  content: string;
  is_correct: boolean;
}

interface BlankAnswer {
  blank_number: number;
  answer: string;
}

// 答案版本接口
interface AnswerVersion {
  type: string;
  answer: string;
  analysis: string;
  is_default: boolean;
}

// ==================== Store ====================

// ==================== 共享表单数据 ====================
const formData = ref({
  bank_id: props.bankId,
  type: props.questionType,
  usage: 'all',
  difficulty: 'medium' as DifficultyType,
  score: ['fill', 'shortAnswer'].includes(props.questionType) ? 5 : 1,
  sort_order: 0,
  chapter_id: undefined as number | undefined,
  stem: '',
  knowledge_point: '',
  source: '',
  year: undefined as number | undefined,
  is_active: true,
});

// ==================== 选择题专用 ====================
const choiceType = ref<'multiple' | 'single' | 'uncertain'>(
  props.questionType as 'multiple' | 'single' | 'uncertain',
);
const options = ref<QuestionOption[]>([
  { label: 'A', content: '', is_correct: false },
  { label: 'B', content: '', is_correct: false },
  { label: 'C', content: '', is_correct: false },
  { label: 'D', content: '', is_correct: false },
]);
const selectedAnswer = ref<string[]>([]);
const optionLabels = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

// ==================== 判断题专用 ====================
const judgmentAnswer = ref<string>('');

// ==================== 填空题专用 ====================
const blankAnswers = ref<BlankAnswer[]>([{ blank_number: 1, answer: '' }]);

// ==================== 问答题专用 ====================
const shortAnswerVersions = ref<AnswerVersion[]>([
  { type: 'official', answer: '', analysis: '', is_default: true },
]);

// ==================== 材料引用 ====================
const selectedMaterialIds = ref<number[]>([]); // 选中的材料ID数组
const materialOptions = ref<Array<{ label: string; value: number }>>([]);

// 加载材料列表
async function loadMaterialOptions() {
  try {
    const response = await requestClient.get<any>('/api/v1/qbank/materials', {
      params: { bank_id: props.bankId, size: 100 },
    });
    const items = response.items || response || [];
    materialOptions.value = items.map((item: any) => ({
      label: item.title,
      value: item.id,
    }));
  } catch (error) {
    console.error('加载材料列表失败', error);
  }
}

onMounted(() => {
  loadMaterialOptions();
});

// ==================== 共享：解析内容 ====================
const analysisContent = ref<string>('');

function toOptionsData(
  source: any,
): null | Record<string, { code: string; content: string }> {
  if (!source) return null;

  const data = source.options_data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data)
      .map(([key, value]: [string, any]) => {
        const code = value?.code || value?.option_code || key;
        const content = value?.content || value?.content_ref?.content || '';
        return [code, { code, content }] as const;
      })
      .filter(([, item]: [string, any]) => item.content !== '');
    if (entries.length > 0) {
      return Object.fromEntries(entries);
    }
  }

  if (Array.isArray(source.options) && source.options.length > 0) {
    const entries = source.options
      .map((item: any, idx: number) => {
        const code =
          item?.option_code ||
          item?.code ||
          optionLabels[idx] ||
          String(idx + 1);
        const content = item?.content || item?.content_ref?.content || '';
        return [code, { code, content }] as const;
      })
      .filter(([, item]: [string, any]) => item.content !== '');
    if (entries.length > 0) {
      return Object.fromEntries(entries);
    }
  }

  return null;
}

// ==================== 选项配置 ====================
const choiceTypeOptions = [
  { label: '单选', value: 'single' },
  { label: '多选', value: 'multiple' },
  { label: '不定项', value: 'uncertain' },
];

const usageOptions = [
  { label: '全部', value: 'all' },
  { label: '考试', value: 'exam' },
  { label: '练习', value: 'practice' },
];

const difficultyOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
];

// ==================== 选择题方法 ====================
function addOption() {
  if (options.value.length >= 26) {
    message.warning('选项数量不能超过26个');
    return;
  }
  const nextLabel = optionLabels[options.value.length]!;
  options.value.push({
    label: nextLabel,
    content: '',
    is_correct: false,
  });
}

function removeOption(index: number) {
  if (options.value.length <= 2) {
    message.warning('至少保留2个选项');
    return;
  }
  options.value.splice(index, 1);
  options.value.forEach((opt, idx) => {
    opt.label = optionLabels[idx]!;
  });
}

function handleAnswerChange(value: string | string[]) {
  const answers = Array.isArray(value) ? value : [value];
  selectedAnswer.value = answers;
  options.value.forEach((opt) => {
    opt.is_correct = answers.includes(opt.label);
  });
}

watch(choiceType, () => {
  selectedAnswer.value = [];
  options.value.forEach((opt) => (opt.is_correct = false));
});

// 监听题型变化，同步 choiceType
watch(
  () => props.questionType,
  (newType) => {
    if (newType === 'single' || newType === 'multiple') {
      choiceType.value = newType;
    }
  },
);

// ==================== 填空题方法 ====================
function addBlank() {
  blankAnswers.value.push({
    blank_number: blankAnswers.value.length + 1,
    answer: '',
  });
}

function removeBlank(index: number) {
  if (blankAnswers.value.length <= 1) {
    message.warning('至少保留1个填空');
    return;
  }
  blankAnswers.value.splice(index, 1);
  blankAnswers.value.forEach((blank, idx) => {
    blank.blank_number = idx + 1;
  });
}

// ==================== 提交方法 ====================
async function submit() {
  // 基本验证
  if (!formData.value.stem.trim()) {
    message.error('请输入题干');
    throw new Error('请输入题干');
  }

  // 1. 构建 Core 题目本体数据
  const coreData = {
    type: formData.value.type,
    stem: formData.value.stem,
    difficulty: formData.value.difficulty,
    default_score: formData.value.score,
    knowledge_point: formData.value.knowledge_point
      ? typeof formData.value.knowledge_point === 'string'
        ? formData.value.knowledge_point.split('、').filter(Boolean)
        : Array.isArray(formData.value.knowledge_point)
          ? formData.value.knowledge_point
          : null
      : null,
    content_status: 10,
  };

  // 2. 构建挂载数据 Placement
  const placementsData = [
    {
      bank_id: formData.value.bank_id,
      chapter_id: formData.value.chapter_id || null,
      sort_order: formData.value.sort_order,
      score: formData.value.score,
      is_active: formData.value.is_active,
    },
  ];

  // 3. 构建选项和答案
  let optionsData: any[] = [];
  let analysesData: any[] = [];

  switch (props.questionType) {
    case 'fill': {
      const hasEmptyAnswer = blankAnswers.value.some(
        (blank) => !blank.answer.trim(),
      );
      if (hasEmptyAnswer) {
        message.error('请填写所有填空的答案');
        throw new Error('请填写所有填空的答案');
      }
      analysesData = [
        {
          type: 'official',
          is_default: true,
          answer_data: {
            correct: blankAnswers.value.map((b) => b.answer),
          },
          content: analysisContent.value,
        },
      ];
      break;
    }
    case 'judgement': {
      if (!judgmentAnswer.value) {
        message.error('请选择答案');
        throw new Error('请选择答案');
      }
      analysesData = [
        {
          type: 'official',
          is_default: true,
          answer_data: {
            correct: judgmentAnswer.value === 'true' ? 'A' : 'B',
          },
          content: analysisContent.value,
        },
      ];
      break;
    }
    case 'multiple':
    // fall through
    case 'single': {
      if (selectedAnswer.value.length === 0) {
        message.error('请选择答案');
        throw new Error('请选择答案');
      }
      // 构建 options 数组
      optionsData = options.value.map((opt, idx) => ({
        option_code: opt.label,
        content: opt.content,
        sort_order: idx + 1,
        is_active: true,
      }));

      // 构建答案数据
      analysesData = [
        {
          type: 'official',
          is_default: true,
          answer_data: {
            correct:
              props.questionType === 'single'
                ? selectedAnswer.value[0]
                : selectedAnswer.value,
          },
          content: analysisContent.value,
        },
      ];
      break;
    }
    case 'shortAnswer': {
      if (shortAnswerVersions.value.length === 0) {
        message.error('请至少添加一个答案版本');
        throw new Error('请至少添加一个答案版本');
      }
      analysesData = shortAnswerVersions.value.map((v, idx) => ({
        type: v.type, // 机构名称存入 type 字段
        answer_data: {
          correct: v.answer, // 答案内容
        },
        content: v.analysis || '', // 解析内容
        is_default: v.is_default || idx === 0, // 第一个默认
      }));
      break;
    }
  }

  const finalSubmitData = {
    core: coreData,
    placements: placementsData,
    options: optionsData.length > 0 ? optionsData : undefined,
    analyses: analysesData,
    material_ids: selectedMaterialIds.value,
  };

  emit('submit', finalSubmitData);
}

// ==================== 数据加载 ====================
async function loadQuestionData(questionId: number) {
  try {
    const detail = (await getQuestionDetailApi(questionId)) as any;
    const detailOptionsData = toOptionsData(detail);
    const prefillOptionsData = toOptionsData(props.prefillData);
    const merged = {
      ...detail,
      options_data: detailOptionsData ?? prefillOptionsData ?? null,
      answer_data: detail.answer_data ?? props.prefillData?.answer_data ?? null,
      analysis_content:
        detail.analysis_content ?? props.prefillData?.analysis_content ?? '',
      analyses:
        Array.isArray(detail.analyses) && detail.analyses.length > 0
          ? detail.analyses
          : Array.isArray(props.prefillData?.analyses)
            ? props.prefillData.analyses
            : [],
    };

    const normalizedKnowledgePoint = Array.isArray(merged.knowledge_point)
      ? merged.knowledge_point
          .map((item: any) => {
            if (typeof item === 'string' || typeof item === 'number') {
              return String(item);
            }
            if (item && typeof item === 'object') {
              return (
                item.name ||
                item.label ||
                item.title ||
                item.code ||
                item.id ||
                ''
              );
            }
            return '';
          })
          .filter(Boolean)
          .join('、')
      : merged.knowledge_point || '';
    const fallbackAnalysis =
      (Array.isArray(merged.analyses)
        ? merged.analyses.find((item: any) => item?.is_default) ||
          merged.analyses[0]
        : undefined) ||
      (merged.answer_data || merged.analysis_content
        ? {
            answer_data: merged.answer_data || null,
            content: merged.analysis_content || '',
          }
        : undefined);

    const defaultPlacement = Array.isArray(merged.placements) && merged.placements.length > 0 
      ? merged.placements[0] 
      : null;

    // 填充共享数据
    formData.value = {
      bank_id: merged.bank_id ?? defaultPlacement?.bank_id ?? props.bankId,
      type: merged.type,
      usage: merged.usage || 'all',
      difficulty: merged.difficulty || 'medium',
      score: merged.score ?? defaultPlacement?.score ?? merged.default_score ?? (['fill', 'shortAnswer'].includes(props.questionType) ? 5 : 1),
      sort_order: merged.sort_order ?? defaultPlacement?.sort_order ?? 0,
      chapter_id: merged.chapter_id ?? defaultPlacement?.chapter_id ?? undefined,
      stem: merged.stem,
      knowledge_point: normalizedKnowledgePoint,
      source: merged.source || '',
      year: merged.year ?? undefined,
      is_active: merged.is_active ?? defaultPlacement?.is_active ?? true,
    };

    // 加载关联材料
    if (merged.material_ids && Array.isArray(merged.material_ids)) {
      selectedMaterialIds.value = merged.material_ids;
    } else if (merged.materials && Array.isArray(merged.materials)) {
      selectedMaterialIds.value = merged.materials.map((m: any) => m.id);
    }

    // 加载解析内容
    analysisContent.value = fallbackAnalysis?.content || '';

    // 根据题型填充专用数据
    switch (props.questionType) {
      case 'fill': {
        if (fallbackAnalysis && fallbackAnalysis.answer_data) {
          const answers = fallbackAnalysis.answer_data.correct;
          if (Array.isArray(answers)) {
            blankAnswers.value = answers.map((ans: string, index: number) => ({
              blank_number: index + 1,
              answer: ans,
            }));
          }
        }
        break;
      }
      case 'judgement': {
        if (fallbackAnalysis && fallbackAnalysis.answer_data) {
          const correct = fallbackAnalysis.answer_data.correct;
          judgmentAnswer.value = correct === 'A' ? 'true' : 'false';
        }
        break;
      }

      case 'multiple':
      // fall through
      case 'single': {
        choiceType.value = merged.type as any;
        if (merged.options_data && typeof merged.options_data === 'object') {
          options.value = Object.entries(merged.options_data).map(
            ([optionKey, optRaw]: [string, any]) => {
              const opt = optRaw || {};
              return {
                label: opt.code || optionKey,
                content: opt.content || '',
                is_correct: false,
              };
            },
          );
        } else {
          options.value = [
            { label: 'A', content: '', is_correct: false },
            { label: 'B', content: '', is_correct: false },
            { label: 'C', content: '', is_correct: false },
            { label: 'D', content: '', is_correct: false },
          ];
        }
        if (fallbackAnalysis && fallbackAnalysis.answer_data) {
          const correct = fallbackAnalysis.answer_data.correct;
          selectedAnswer.value = Array.isArray(correct) ? correct : [correct];
          options.value.forEach((opt) => {
            opt.is_correct = selectedAnswer.value.includes(opt.label);
          });
        }
        break;
      }

      case 'shortAnswer': {
        // 🔥 新格式：从 analyses 数组加载（每条记录是一个版本）
        if (
          merged.analyses &&
          Array.isArray(merged.analyses) &&
          merged.analyses.length > 0
        ) {
          shortAnswerVersions.value = merged.analyses.map((a: any) => ({
            type: a.type || 'official',
            answer: a.answer_data?.correct || '',
            analysis: a.content || '',
            is_default: a.is_default || false,
          }));
        }
        // 兼容旧格式：answer_data.versions
        else if (
          fallbackAnalysis &&
          fallbackAnalysis.answer_data &&
          fallbackAnalysis.answer_data.versions &&
          Array.isArray(fallbackAnalysis.answer_data.versions) &&
          fallbackAnalysis.answer_data.versions.length > 0
        ) {
          shortAnswerVersions.value = fallbackAnalysis.answer_data.versions;
        } else {
          // 最旧格式：单条解析
          let ans = '';
          if (fallbackAnalysis && fallbackAnalysis.answer_data) {
            const keywords = fallbackAnalysis.answer_data.keywords;
            const correct = fallbackAnalysis.answer_data.correct;
            // 处理 correct 可能是 string | string[]
            const correctStr = Array.isArray(correct)
              ? correct.join('\n')
              : (correct as string) || '';
            ans =
              correctStr ||
              (Array.isArray(keywords) ? keywords.join('\n') : keywords || '');
          }
          shortAnswerVersions.value = [
            {
              type: fallbackAnalysis?.type || 'official',
              answer: ans,
              analysis: fallbackAnalysis?.content || '',
              is_default: true,
            },
          ];
        }
        break;
      }
    }
  } catch (error) {
    message.error('加载题目数据失败');
    console.error(error);
  }
}

function setFormData(data: any) {
  loadQuestionData(data.id);
}

watch(
  () => props.editId,
  (newId) => {
    if (newId) {
      loadQuestionData(newId);
    }
  },
  { immediate: true },
);

defineExpose({
  submit,
  setFormData,
});
</script>

<template>
  <div class="unified-question-form">
    <Row :gutter="16">
      <!-- 第一行：题型特定字段 + 用途 -->
      <Col
        v-if="questionType === 'single' || questionType === 'multiple'"
        :span="12"
        class="mb-4"
      >
        <div class="form-label">题型<span class="text-red-500">*</span></div>
        <Select
          v-model:value="choiceType"
          :options="choiceTypeOptions"
          placeholder="请选择题型"
          class="w-full"
        />
      </Col>

      <Col
        :span="
          questionType === 'single' || questionType === 'multiple' ? 12 : 12
        "
        class="mb-4"
      >
        <div class="form-label">用途</div>
        <Select
          v-model:value="formData.usage"
          :options="usageOptions"
          placeholder="请选择用途"
          class="w-full"
        />
      </Col>

      <!-- 第二行：难度、分值、排序、章节 -->
      <Col :span="6" class="mb-4">
        <div class="form-label">难度</div>
        <Select
          v-model:value="formData.difficulty"
          :options="difficultyOptions"
          placeholder="请选择难度"
          class="w-full"
        />
      </Col>

      <Col :span="6" class="mb-4">
        <div class="form-label">分值<span class="text-red-500">*</span></div>
        <InputNumber
          v-model:value="formData.score"
          :min="0"
          :step="0.5"
          placeholder="请输入分值"
          class="w-full"
        />
      </Col>

      <Col :span="6" class="mb-4">
        <div class="form-label">排序</div>
        <InputNumber
          v-model:value="formData.sort_order"
          :min="0"
          :precision="0"
          placeholder="请输入排序"
          class="w-full"
        />
      </Col>

      <Col :span="6" class="mb-4">
        <div class="form-label">所属章节</div>
        <Select
          v-model:value="formData.chapter_id"
          :options="chapterOptions"
          placeholder="请选择章节"
          allow-clear
          class="w-full"
        />
      </Col>

      <!-- 题干 -->
      <Col :span="24" class="mb-4">
        <div class="form-label">
          题干<span class="text-red-500">*</span>
        </div>
        <HaloEditorWrapper v-model="formData.stem" :height="150" />
      </Col>

      <!-- 关联材料 -->
      <Col :span="24" class="mb-4">
        <div class="form-label">
          关联材料<span class="ml-2 text-xs text-gray-400"
            >（可选，用于材料题子题目）</span
          >
        </div>
        <Select
          v-model:value="selectedMaterialIds"
          :options="materialOptions"
          mode="multiple"
          placeholder="请选择材料（可多选）"
          class="w-full"
          :loading="materialOptions.length === 0"
        />
        <div class="mt-1 text-xs text-gray-500">
          如果没有找到需要的材料，由于材料管理是独立的功能，请先去材料管理添加。
        </div>
      </Col>

      <!-- 选择题：选项 -->
      <template v-if="questionType === 'single' || questionType === 'multiple'">
        <Col :span="24" class="mb-4">
          <div class="mb-2 flex items-center justify-between">
            <div class="form-label mb-0">
              题目选项<span class="text-red-500">*</span>
            </div>
            <Button type="primary" size="small" @click="addOption">
              <MaterialSymbolsAdd class="size-4" />
              添加选项
            </Button>
          </div>

          <div
            v-for="(option, index) in options"
            :key="index"
            class="option-item mb-3"
          >
            <div class="mb-2 flex items-center gap-2">
              <span class="option-label">选项 {{ option.label }}</span>
              <Button
                v-if="options.length > 2"
                type="text"
                danger
                size="small"
                @click="removeOption(index)"
              >
                <MaterialSymbolsDelete class="size-4" />
              </Button>
            </div>
            <HaloEditorWrapper v-model="option.content" :height="100" />
          </div>
        </Col>

        <Col :span="24" class="mb-4">
          <div class="form-label">答案<span class="text-red-500">*</span></div>
          <div v-if="choiceType === 'single'" class="answer-selector">
            <Radio.Group
              v-model:value="selectedAnswer[0]"
              @change="(e) => handleAnswerChange(e.target.value)"
            >
              <Space direction="vertical">
                <Radio
                  v-for="option in options"
                  :key="option.label"
                  :value="option.label"
                >
                  选项 {{ option.label }}
                </Radio>
              </Space>
            </Radio.Group>
          </div>
          <div v-else class="answer-selector">
            <Checkbox.Group
              v-model:value="selectedAnswer"
              @change="(val: any) => handleAnswerChange(val)"
            >
              <Space direction="vertical">
                <Checkbox
                  v-for="option in options"
                  :key="option.label"
                  :value="option.label"
                >
                  选项 {{ option.label }}
                </Checkbox>
              </Space>
            </Checkbox.Group>
          </div>
        </Col>
      </template>

      <!-- 判断题：答案 -->
      <Col v-if="questionType === 'judgement'" :span="24" class="mb-4">
        <div class="form-label">答案<span class="text-red-500">*</span></div>
        <Radio.Group v-model:value="judgmentAnswer" class="answer-selector">
          <Space>
            <Radio value="true">正确</Radio>
            <Radio value="false">错误</Radio>
          </Space>
        </Radio.Group>
      </Col>

      <!-- 填空题：填空列表 -->
      <template v-if="questionType === 'fill'">
        <Col :span="24" class="mb-2">
          <div class="mb-2 text-xs text-gray-500">
            提示：在题干中使用 _____ 或 【】 表示填空位置
          </div>
        </Col>

        <Col :span="24" class="mb-4">
          <div class="mb-2 flex items-center justify-between">
            <div class="form-label mb-0">
              填空答案<span class="text-red-500">*</span>
            </div>
            <Button type="primary" size="small" @click="addBlank">
              <MaterialSymbolsAdd class="size-4" />
              添加填空
            </Button>
          </div>

          <Space direction="vertical" class="w-full" :size="12">
            <Card
              v-for="(blank, index) in blankAnswers"
              :key="index"
              size="small"
              class="blank-card"
            >
              <template #title>
                <div class="flex items-center justify-between">
                  <span>填空 {{ blank.blank_number }}</span>
                  <Button
                    v-if="blankAnswers.length > 1"
                    type="text"
                    danger
                    size="small"
                    @click="removeBlank(index)"
                  >
                    <MaterialSymbolsDelete class="size-4" />
                  </Button>
                </div>
              </template>
              <Input
                v-model:value="blank.answer"
                placeholder="请输入该填空的答案"
                class="w-full"
              />
            </Card>
          </Space>
        </Col>
      </template>

      <!-- 简答题：多版本答案 -->
      <template v-if="questionType === 'shortAnswer'">
        <Col :span="24" class="mb-4">
          <div class="form-label">
            答案与解析<span class="text-red-500">*</span>
          </div>
          <ShortAnswerEditor v-model:value="shortAnswerVersions" />
        </Col>
      </template>

      <!-- 解析 (对于简答题，解析已包含在多版本中，故隐藏) -->
      <Col v-if="questionType !== 'shortAnswer'" :span="24" class="mb-4">
        <div class="form-label">题目解析</div>
        <HaloEditorWrapper v-model="analysisContent" :height="150" />
      </Col>

      <!-- 扩展信息 -->
      <Col :span="24" class="mb-4">
        <Card title="扩展信息（可选）" size="small">
          <Row :gutter="16">
            <Col :span="8">
              <div class="form-label">考点</div>
              <Input
                v-model:value="formData.knowledge_point"
                placeholder="题目考点"
              />
            </Col>
            <Col :span="8">
              <div class="form-label">来源</div>
              <Input v-model:value="formData.source" placeholder="题目来源" />
            </Col>
            <Col :span="8">
              <div class="form-label">年份</div>
              <InputNumber
                v-model:value="formData.year"
                :min="1900"
                :max="2100"
                placeholder="年份"
                class="w-full"
              />
            </Col>
          </Row>
        </Card>
      </Col>

      <!-- 状态 -->
      <Col :span="24" class="mb-4">
        <div class="flex items-center gap-3">
          <div class="form-label mb-0">启用状态</div>
          <Switch v-model:checked="formData.is_active" />
          <span class="text-sm text-gray-500">{{
            formData.is_active ? '已启用' : '已停用'
          }}</span>
        </div>
      </Col>
    </Row>

  </div>
</template>

<style scoped>
.unified-question-form {
  padding: 8px 0;
}

.form-label {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
}

.option-item {
  padding: 12px;
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.option-label {
  min-width: 60px;
  font-size: 14px;
  font-weight: 500;
}

.answer-selector {
  padding: 12px;
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
}
</style>



