<script setup lang="ts">
import type { DifficultyType, FileInfo, QuestionType } from '#/api';

import { onMounted, ref, watch } from 'vue';

import {
  createIconifyIcon,
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
import MediaPicker from '#/components/MediaPicker.vue';
import WangEditor from '#/components/WangEditor/index.vue';

import ShortAnswerEditor from './ShortAnswerEditor.vue';

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: any];
}>();

// 创建需要的图标
const FileImageOutlined = createIconifyIcon('material-symbols:image-outline');

interface Props {
  bankId: number;
  questionType: QuestionType;
  chapterOptions: Array<{ label: string; value: number }>;
  editId?: null | number;
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

// ==================== Media Picker 媒体选择器 ====================
const showMediaPicker = ref(false);
const currentEditorTarget = ref<'analysis' | 'stem' | null>(null);

function openMediaPicker(target: 'analysis' | 'stem') {
  currentEditorTarget.value = target;
  showMediaPicker.value = true;
}

function handleMediaSelect(files: FileInfo[]) {
  if (files.length === 0) return;

  // 将选中的图片插入到对应的编辑器中
  const imageMarkdown = files
    .map((file) => {
      if (file.type === 'image') {
        return `<img src="${file.url}" alt="${file.name}" style="max-width:100%" />`;
      }
      return `<a href="${file.url}" target="_blank">${file.name}</a>`;
    })
    .join('<br/>');

  // 根据目标编辑器插入内容
  if (currentEditorTarget.value === 'stem') {
    formData.value.stem += (formData.value.stem ? '\n\n' : '') + imageMarkdown;
  } else if (currentEditorTarget.value === 'analysis') {
    analysisContent.value +=
      (analysisContent.value ? '\n\n' : '') + imageMarkdown;
  }
  message.success(`成功插入 ${files.length} 个文件`);
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

  // 构建基础题目数据
  const submitData: any = {
    bank_id: formData.value.bank_id,
    type: formData.value.type,
    stem: formData.value.stem,
    chapter_id: formData.value.chapter_id,
    difficulty: formData.value.difficulty,
    score: formData.value.score,
    knowledge_point: formData.value.knowledge_point,
    source: formData.value.source,
    year: formData.value.year,
    usage: formData.value.usage,
    is_active: formData.value.is_active,
    material_ids: selectedMaterialIds.value, // 对所有题型生效
  };

  // 构建答案数据（QuestionAnalysis）
  const analysisData: any = {};

  // 根据题型构建选项和答案
  switch (props.questionType) {
    case 'fill': {
      const hasEmptyAnswer = blankAnswers.value.some(
        (blank) => !blank.answer.trim(),
      );
      if (hasEmptyAnswer) {
        message.error('请填写所有填空的答案');
        throw new Error('请填写所有填空的答案');
      }
      submitData.options_data = null;
      analysisData.answer_data = {
        correct: blankAnswers.value.map((b) => b.answer),
      };
      analysisData.content = analysisContent.value;
      break;
    }
    case 'judgement': {
      if (!judgmentAnswer.value) {
        message.error('请选择答案');
        throw new Error('请选择答案');
      }
      submitData.options_data = null;
      analysisData.answer_data = {
        correct: judgmentAnswer.value === 'true' ? 'A' : 'B',
      };
      analysisData.content = analysisContent.value;
      break;
    }

    case 'multiple':
    // fall through
    case 'single': {
      if (selectedAnswer.value.length === 0) {
        message.error('请选择答案');
        throw new Error('请选择答案');
      }
      // 构建 options_data
      const optionsData: Record<string, any> = {};
      options.value.forEach((opt) => {
        optionsData[opt.label] = {
          code: opt.label,
          content: opt.content,
        };
      });
      submitData.options_data = optionsData;

      // 构建答案数据
      analysisData.answer_data = {
        correct:
          props.questionType === 'single'
            ? selectedAnswer.value[0]
            : selectedAnswer.value,
      };
      analysisData.content = analysisContent.value;
      break;
    }

    case 'shortAnswer': {
      if (shortAnswerVersions.value.length === 0) {
        message.error('请至少添加一个答案版本');
        throw new Error('请至少添加一个答案版本');
      }

      // 🔥 新格式：每个版本作为独立的解析记录
      submitData.analyses = shortAnswerVersions.value.map((v, idx) => ({
        type: v.type, // 机构名称存入 type 字段
        answer_data: {
          correct: v.answer, // 答案内容
        },
        content: v.analysis || '', // 解析内容
        is_default: v.is_default || idx === 0, // 第一个默认
      }));

      // 不再使用单条 analysis
      break;
    }
  }

  // 如果有 analyses 则不设置 analysis（新格式优先）
  if (!submitData.analyses) {
    submitData.analysis = analysisData;
  }
  emit('submit', submitData);
}

// ==================== 数据加载 ====================
async function loadQuestionData(questionId: number) {
  try {
    const detail = await getQuestionDetailApi(questionId);

    // 填充共享数据
    formData.value = {
      bank_id: detail.bank_id,
      type: detail.type,
      usage: detail.usage || 'all',
      difficulty: detail.difficulty || 'medium',
      score: detail.score,
      chapter_id: detail.chapter_id ?? undefined,
      stem: detail.stem,
      knowledge_point: detail.knowledge_point || '',
      source: detail.source || '',
      year: detail.year ?? undefined,
      is_active: detail.is_active ?? true,
    };

    // 加载关联材料
    if (detail.material_ids && Array.isArray(detail.material_ids)) {
      selectedMaterialIds.value = detail.material_ids;
    } else if (detail.materials && Array.isArray(detail.materials)) {
      selectedMaterialIds.value = detail.materials.map((m: any) => m.id);
    }

    // 加载解析内容
    analysisContent.value = detail.analysis?.content || '';

    // 根据题型填充专用数据
    switch (props.questionType) {
      case 'fill': {
        if (detail.analysis && detail.analysis.answer_data) {
          const answers = detail.analysis.answer_data.correct;
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
        if (detail.analysis && detail.analysis.answer_data) {
          const correct = detail.analysis.answer_data.correct;
          judgmentAnswer.value = correct === 'A' ? 'true' : 'false';
        }
        break;
      }

      case 'multiple':
      // fall through
      case 'single': {
        choiceType.value = detail.type as any;
        if (detail.options_data) {
          options.value = Object.values(detail.options_data).map(
            (opt: any) => ({
              label: opt.code,
              content: opt.content || '',
              is_correct: false,
            }),
          );
        }
        if (detail.analysis && detail.analysis.answer_data) {
          const correct = detail.analysis.answer_data.correct;
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
          detail.analyses &&
          Array.isArray(detail.analyses) &&
          detail.analyses.length > 0
        ) {
          shortAnswerVersions.value = detail.analyses.map((a: any) => ({
            type: a.type || 'official',
            answer: a.answer_data?.correct || '',
            analysis: a.content || '',
            is_default: a.is_default || false,
          }));
        }
        // 兼容旧格式：answer_data.versions
        else if (
          detail.analysis &&
          detail.analysis.answer_data &&
          detail.analysis.answer_data.versions &&
          Array.isArray(detail.analysis.answer_data.versions) &&
          detail.analysis.answer_data.versions.length > 0
        ) {
          shortAnswerVersions.value = detail.analysis.answer_data.versions;
        } else {
          // 最旧格式：单条解析
          let ans = '';
          if (detail.analysis && detail.analysis.answer_data) {
            const keywords = detail.analysis.answer_data.keywords;
            const correct = detail.analysis.answer_data.correct;
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
              type: detail.analysis?.type || 'official',
              answer: ans,
              analysis: detail.analysis?.content || '',
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

      <!-- 第二行：难度、分值、章节 -->
      <Col :span="8" class="mb-4">
        <div class="form-label">难度</div>
        <Select
          v-model:value="formData.difficulty"
          :options="difficultyOptions"
          placeholder="请选择难度"
          class="w-full"
        />
      </Col>

      <Col :span="8" class="mb-4">
        <div class="form-label">分值<span class="text-red-500">*</span></div>
        <InputNumber
          v-model:value="formData.score"
          :min="0"
          :step="0.5"
          placeholder="请输入分值"
          class="w-full"
        />
      </Col>

      <Col :span="8" class="mb-4">
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
        <div class="mb-2 flex items-center justify-between">
          <div class="form-label mb-0">
            题干<span class="text-red-500">*</span>
          </div>
          <Button type="default" size="small" @click="openMediaPicker('stem')">
            <FileImageOutlined />
            从媒体库选择
          </Button>
        </div>
        <WangEditor v-model="formData.stem" :height="150" />
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
            <WangEditor v-model="option.content" :height="100" />
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
        <div class="mb-2 flex items-center justify-between">
          <div class="form-label mb-0">题目解析</div>
          <Button
            type="default"
            size="small"
            @click="openMediaPicker('analysis')"
          >
            <FileImageOutlined />
            从媒体库选择
          </Button>
        </div>
        <WangEditor v-model="analysisContent" :height="150" />
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

    <!-- 媒体选择器 -->
    <MediaPicker
      v-model:open="showMediaPicker"
      :multiple="true"
      accept="image/*,video/*,.pdf"
      @select="handleMediaSelect"
    />
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
