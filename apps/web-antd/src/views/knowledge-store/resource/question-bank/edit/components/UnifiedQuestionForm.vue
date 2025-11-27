<script setup lang="ts">
import type { DifficultyType, FileInfo, QuestionType } from '#/api';

import { ref, watch } from 'vue';

import { MarkdownEditor } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';
import {
  createIconifyIcon,
  MaterialSymbolsAdd,
  MaterialSymbolsDelete,
} from '@vben/icons';
import { useAccessStore } from '@vben/stores';

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
import MediaPicker from '#/components/MediaPicker.vue';

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

interface SubQuestion {
  order: number;
  type: QuestionType;
  stem: string;
  options?: QuestionOption[]; // 选择题才有选项
  answer: string | string[]; // 单选/判断是字符串，多选/填空是数组
  score: number;
}

// ==================== Store ====================
const accessStore = useAccessStore();
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

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
const essayAnswer = ref<string>('');

// ==================== 材料题专用 ====================
const material = ref<string>('');
const subQuestions = ref<SubQuestion[]>([
  {
    order: 1,
    type: 'single',
    stem: '',
    options: [
      { label: 'A', content: '', is_correct: false },
      { label: 'B', content: '', is_correct: false },
    ],
    answer: '',
    score: 5,
  },
]);

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
        return `![${file.name}](${file.url})`;
      }
      return `[${file.name}](${file.url})`;
    })
    .join('\n');

  // 根据目标编辑器插入内容
  if (currentEditorTarget.value === 'stem') {
    formData.value.stem += (formData.value.stem ? '\n\n' : '') + imageMarkdown;
  } else if (currentEditorTarget.value === 'analysis') {
    analysisContent.value +=
      (analysisContent.value ? '\n\n' : '') + imageMarkdown;
  }

  message.success(`成功插入 ${files.length} 个文件`);
}

// ==================== Markdown 编辑器上传配置 ====================
const uploadOptions = {
  mode: 'ir' as 'ir', // 使用即时渲染模式，保持纯 Markdown 格式
  toolbar: [
    'emoji',
    'headings',
    'bold',
    'italic',
    'strike',
    'link',
    '|',
    'list',
    'ordered-list',
    'check',
    'outdent',
    'indent',
    '|',
    'quote',
    'line',
    'code',
    'inline-code',
    '|',
    'upload',
    'table',
    '|',
    'undo',
    'redo',
    '|',
    'edit-mode',
    'fullscreen',
    {
      name: 'more',
      toolbar: [
        'both',
        'preview',
        'outline',
        'export',
        'devtools',
        'info',
        'help',
      ],
    },
  ],
  upload: {
    url: `${apiURL}/api/v1/sys/files/upload`,
    fieldName: 'file',
    headers: {
      Authorization: `Bearer ${accessStore.accessToken || ''}`,
    },
    format(files: File[], responseText: string) {
      try {
        const response = JSON.parse(responseText);
        if (response.code === 200 && response.data?.url) {
          return JSON.stringify({
            code: 0,
            data: {
              errFiles: [],
              succMap: {
                [files[0].name]: response.data.url,
              },
            },
          });
        }
        return JSON.stringify({
          code: 1,
          msg: response.message || '上传失败',
        });
      } catch {
        return JSON.stringify({
          code: 1,
          msg: '上传失败',
        });
      }
    },
  },
  hint: {
    parse: false,
    emoji: {
      '+1': '👍',
      '-1': '👎',
      confused: '😕',
      eyes: '👀',
      heart: '❤️',
      rocket: '🚀',
      smile: '😄',
      tada: '🎉',
    },
  },
  preview: {
    markdown: {
      toc: true,
    },
  },
};

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

const subQuestionTypeOptions = [
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'judgement' },
  { label: '填空题', value: 'fill' },
  { label: '简答题', value: 'shortAnswer' },
];

// ==================== 选择题方法 ====================
function addOption() {
  if (options.value.length >= 26) {
    message.warning('选项数量不能超过26个');
    return;
  }
  const nextLabel = optionLabels[options.value.length];
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
    opt.label = optionLabels[idx];
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

// ==================== 材料题方法 ====================
function addSubQuestion() {
  subQuestions.value.push({
    order: subQuestions.value.length + 1,
    type: 'single', // 默认单选题
    stem: '',
    options: [
      { label: 'A', content: '', is_correct: false },
      { label: 'B', content: '', is_correct: false },
    ],
    answer: '',
    score: 5,
  });
  updateTotalScore();
}

function removeSubQuestion(index: number) {
  if (subQuestions.value.length <= 1) {
    message.warning('至少保留1个子题目');
    return;
  }
  subQuestions.value.splice(index, 1);
  subQuestions.value.forEach((sq, idx) => {
    sq.order = idx + 1;
  });
  updateTotalScore();
}

function updateTotalScore() {
  formData.value.score = subQuestions.value.reduce(
    (sum, sq) => sum + sq.score,
    0,
  );
}

// 处理子题题型变化
function handleSubQuestionTypeChange(sq: SubQuestion, newType: QuestionType) {
  sq.type = newType;
  sq.answer = '';

  // 根据题型初始化选项和答案
  if (newType === 'single' || newType === 'multiple') {
    // 选择题：初始化选项
    if (!sq.options || sq.options.length === 0) {
      sq.options = [
        { label: 'A', content: '', is_correct: false },
        { label: 'B', content: '', is_correct: false },
      ];
    }
  } else {
    // 非选择题：清空选项
    sq.options = undefined;
  }
}

// 为子题添加选项
function addSubQuestionOption(sq: SubQuestion) {
  if (!sq.options) {
    sq.options = [];
  }
  if (sq.options.length >= 26) {
    message.warning('选项数量不能超过26个');
    return;
  }
  const nextLabel = optionLabels[sq.options.length];
  sq.options.push({
    label: nextLabel,
    content: '',
    is_correct: false,
  });
}

// 删除子题选项
function removeSubQuestionOption(sq: SubQuestion, index: number) {
  if (!sq.options || sq.options.length <= 2) {
    message.warning('至少保留2个选项');
    return;
  }
  sq.options.splice(index, 1);
  sq.options.forEach((opt, idx) => {
    opt.label = optionLabels[idx];
  });
}

// 处理子题答案选择
function handleSubQuestionAnswerChange(
  sq: SubQuestion,
  value: string | string[],
) {
  sq.answer = value;
  if (sq.options) {
    const answers = Array.isArray(value) ? value : [value];
    sq.options.forEach((opt) => {
      opt.is_correct = answers.includes(opt.label);
    });
  }
}

// ==================== 提交方法 ====================
async function submit() {
  // 基本验证
  if (!formData.value.stem.trim()) {
    message.error('请输入题干');
    throw new Error('请输入题干');
  }

  // 构建基础题目数据（不包含答案）
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

    case 'material': {
      // 材料题验证
      if (!material.value.trim()) {
        message.error('请输入材料内容');
        throw new Error('请输入材料内容');
      }
      const hasEmptySubQuestion = subQuestions.value.some((sq) => {
        if (!sq.stem.trim()) return true;
        // 选择题需要验证选项
        if (sq.type === 'single' || sq.type === 'multiple') {
          if (!sq.options || sq.options.length === 0) return true;
          if (sq.options.some((opt) => !opt.content.trim())) return true;
        }
        // 验证答案
        if (!sq.answer || (Array.isArray(sq.answer) && sq.answer.length === 0))
          return true;
        return false;
      });
      if (hasEmptySubQuestion) {
        message.error('请完整填写所有子题目的内容和答案');
        throw new Error('请完整填写所有子题目的内容和答案');
      }
      submitData.stem = material.value; // 使用材料内容作为题干
      // 材料题的子问题信息（不含答案）存储在 options_data
      submitData.options_data = {
        sub_questions: subQuestions.value.map((sq) => {
          const subQ: any = {
            order: sq.order,
            type: sq.type,
            stem: sq.stem,
            score: sq.score,
          };
          // 选择题需要包含选项
          if ((sq.type === 'single' || sq.type === 'multiple') && sq.options) {
            subQ.options = {};
            sq.options.forEach((opt) => {
              subQ.options[opt.label] = {
                code: opt.label,
                content: opt.content,
              };
            });
          }
          return subQ;
        }),
      };
      // 材料题的答案数据只包含答案
      analysisData.answer_data = {
        sub_questions: subQuestions.value.map((sq) => {
          let answer = sq.answer;
          // 单选题：如果是数组，取第一个元素
          if (sq.type === 'single' && Array.isArray(answer)) {
            answer = answer[0] || '';
          }
          return {
            order: sq.order,
            answer,
          };
        }),
      };
      analysisData.content = analysisContent.value || '见子题目解析';
      break;
    }

    case 'multiple':
    // 多选题逻辑
    // fall through
    case 'single': {
      if (selectedAnswer.value.length === 0) {
        message.error('请选择答案');
        throw new Error('请选择答案');
      }
      // 构建 options_data（不含答案标识）
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
      analysisData.content = analysisContent.value; // 使用解析输入框的内容
      break;
    }

    case 'shortAnswer': {
      if (!essayAnswer.value.trim()) {
        message.error('请输入参考答案');
        throw new Error('请输入参考答案');
      }
      submitData.options_data = null;
      // 简答题：将答案按行分割作为关键词
      const keywords = essayAnswer.value.split('\n').filter((k) => k.trim());
      analysisData.answer_data = {
        keywords,
      };
      analysisData.content = analysisContent.value;
      break;
    }
  }

  // 将答案数据附加到提交数据中（前端处理后端会分离）
  submitData.analysis = analysisData;

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
      chapter_id: detail.chapter_id,
      stem: detail.stem,
      knowledge_point: detail.knowledge_point || '',
      source: detail.source || '',
      year: detail.year,
      is_active: detail.is_active ?? true,
    };

    // 加载解析内容（所有题型共用）
    if (detail.analysis) {
      analysisContent.value = detail.analysis.content || '';
    }

    // 根据题型填充特定数据
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

      case 'material': {
        // 材料题：材料内容在 stem 中
        material.value = detail.stem;
        // 从 options_data 中获取子题目的题干、题型和分值
        if (detail.options_data && detail.options_data.sub_questions) {
          const subQuestionsData = detail.options_data.sub_questions;
          if (Array.isArray(subQuestionsData)) {
            // 先从 options_data 加载题干、题型、选项和分值
            subQuestions.value = subQuestionsData.map((sq: any) => {
              const subQuestion: SubQuestion = {
                order: sq.order,
                type: sq.type || 'single',
                stem: sq.stem || '',
                score: sq.score || 5,
                answer: '', // 答案稍后从 analysis 中填充
              };

              // 如果是选择题，加载选项
              if (
                (sq.type === 'single' || sq.type === 'multiple') &&
                sq.options
              ) {
                subQuestion.options = Object.values(sq.options).map(
                  (opt: any) => ({
                    label: opt.code,
                    content: opt.content || '',
                    is_correct: false,
                  }),
                );
              }

              return subQuestion;
            });

            // 从 analysis 中获取答案
            if (
              detail.analysis &&
              detail.analysis.answer_data &&
              detail.analysis.answer_data.sub_questions
            ) {
              const answersData = detail.analysis.answer_data.sub_questions;
              if (Array.isArray(answersData)) {
                // 按 order 匹配答案
                answersData.forEach((answerItem: any) => {
                  const subQuestion = subQuestions.value.find(
                    (sq) => sq.order === answerItem.order,
                  );
                  if (subQuestion) {
                    subQuestion.answer = answerItem.answer || '';
                    // 标记正确答案选项
                    if (subQuestion.options) {
                      const answers = Array.isArray(answerItem.answer)
                        ? answerItem.answer
                        : [answerItem.answer];
                      subQuestion.options.forEach((opt) => {
                        opt.is_correct = answers.includes(opt.label);
                      });
                    }
                  }
                });
              }
            }

            // 更新总分值
            updateTotalScore();
          }
        }
        break;
      }

      case 'multiple':
      // 多选题逻辑
      // fall through
      case 'single': {
        choiceType.value = detail.type;
        if (detail.options_data) {
          // 将 options_data 的对象转换为数组
          options.value = Object.values(detail.options_data).map(
            (opt: any) => ({
              label: opt.code,
              content: opt.content || '',
              is_correct: false,
            }),
          );
        }
        // 从 analysis 中获取答案
        if (detail.analysis && detail.analysis.answer_data) {
          const correct = detail.analysis.answer_data.correct;
          selectedAnswer.value = Array.isArray(correct) ? correct : [correct];
          // 标记正确答案
          options.value.forEach((opt) => {
            opt.is_correct = selectedAnswer.value.includes(opt.label);
          });
        }
        break;
      }

      case 'shortAnswer': {
        if (detail.analysis && detail.analysis.answer_data) {
          const keywords = detail.analysis.answer_data.keywords;
          essayAnswer.value = Array.isArray(keywords)
            ? keywords.join('\n')
            : '';
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

// 移除 onMounted，避免重复加载
// onMounted 会和 watch immediate 同时触发导致重复请求

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
          :disabled="questionType === 'material'"
          :placeholder="questionType === 'material' ? '自动计算' : '请输入分值'"
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

      <!-- 题干（材料题不显示） -->
      <Col v-if="questionType !== 'material'" :span="24" class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <div class="form-label mb-0">
            题干<span class="text-red-500">*</span>
          </div>
          <Button type="default" size="small" @click="openMediaPicker('stem')">
            <FileImageOutlined />
            从媒体库选择
          </Button>
        </div>
        <MarkdownEditor
          v-model:value="formData.stem"
          :height="150"
          :options="uploadOptions"
        />
      </Col>

      <!-- 材料题：材料内容 -->
      <Col v-if="questionType === 'material'" :span="24" class="mb-4">
        <div class="form-label">
          材料内容<span class="text-red-500">*</span>
        </div>
        <MarkdownEditor
          v-model:value="material"
          :height="180"
          :options="uploadOptions"
        />
      </Col>

      <!-- 选择题：题干媒体 + 选项 -->
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
            <MarkdownEditor
              v-model:value="option.content"
              :height="100"
              :options="uploadOptions"
            />
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
              @change="handleAnswerChange"
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

      <!-- 问答题：答案 -->
      <template v-if="questionType === 'shortAnswer'">
        <Col :span="24" class="mb-4">
          <div class="form-label">
            参考答案<span class="text-red-500">*</span>
          </div>
          <div class="mb-2 text-xs text-gray-500">
            提示：每行一个关键词，用于答案匹配
          </div>
          <MarkdownEditor
            v-model:value="essayAnswer"
            :height="200"
            :options="uploadOptions"
          />
        </Col>
      </template>

      <!-- 材料题：子题目列表 -->
      <Col v-if="questionType === 'material'" :span="24" class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <div class="form-label mb-0">
            子题目<span class="text-red-500">*</span>
          </div>
          <Button type="primary" size="small" @click="addSubQuestion">
            <MaterialSymbolsAdd class="size-4" />
            添加子题目
          </Button>
        </div>

        <Space direction="vertical" class="w-full" :size="16">
          <Card
            v-for="(sq, index) in subQuestions"
            :key="index"
            class="sub-question-card"
          >
            <template #title>
              <div class="flex items-center justify-between">
                <span>子题目 {{ sq.order }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-500">分值：</span>
                  <InputNumber
                    v-model:value="sq.score"
                    :min="0"
                    :step="0.5"
                    size="small"
                    class="w-24"
                    @change="updateTotalScore"
                  />
                  <Button
                    v-if="subQuestions.length > 1"
                    type="text"
                    danger
                    size="small"
                    @click="removeSubQuestion(index)"
                  >
                    <MaterialSymbolsDelete class="size-4" />
                  </Button>
                </div>
              </div>
            </template>

            <!-- 子题题型选择 -->
            <div class="mb-3">
              <div class="form-label-sm">
                题型<span class="text-red-500">*</span>
              </div>
              <Select
                :value="sq.type"
                :options="subQuestionTypeOptions"
                @change="(value) => handleSubQuestionTypeChange(sq, value)"
                class="w-full"
              />
            </div>

            <!-- 子题题干 -->
            <div class="mb-3">
              <div class="form-label-sm">
                题干<span class="text-red-500">*</span>
              </div>
              <MarkdownEditor
                v-model:value="sq.stem"
                :height="100"
                :options="uploadOptions"
              />
            </div>

            <!-- 选择题：选项 -->
            <template v-if="sq.type === 'single' || sq.type === 'multiple'">
              <div class="mb-3">
                <div class="mb-2 flex items-center justify-between">
                  <div class="form-label-sm mb-0">
                    选项<span class="text-red-500">*</span>
                  </div>
                  <Button
                    type="link"
                    size="small"
                    @click="addSubQuestionOption(sq)"
                  >
                    <MaterialSymbolsAdd class="size-4" />
                    添加选项
                  </Button>
                </div>

                <div
                  v-for="(option, optIndex) in sq.options"
                  :key="optIndex"
                  class="option-item-sm mb-2"
                >
                  <div class="mb-1 flex items-center gap-2">
                    <span class="option-label-sm">{{ option.label }}</span>
                    <Button
                      v-if="sq.options && sq.options.length > 2"
                      type="text"
                      danger
                      size="small"
                      @click="removeSubQuestionOption(sq, optIndex)"
                    >
                      <MaterialSymbolsDelete class="size-3" />
                    </Button>
                  </div>
                  <Input
                    v-model:value="option.content"
                    placeholder="请输入选项内容"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- 答案选择 -->
              <div class="mb-3">
                <div class="form-label-sm">
                  答案<span class="text-red-500">*</span>
                </div>
                <div v-if="sq.type === 'single'" class="answer-selector-sm">
                  <Radio.Group
                    :value="Array.isArray(sq.answer) ? sq.answer[0] : sq.answer"
                    @change="
                      (e) => handleSubQuestionAnswerChange(sq, e.target.value)
                    "
                  >
                    <Space direction="vertical">
                      <Radio
                        v-for="option in sq.options"
                        :key="option.label"
                        :value="option.label"
                      >
                        选项 {{ option.label }}
                      </Radio>
                    </Space>
                  </Radio.Group>
                </div>
                <div v-else class="answer-selector-sm">
                  <Checkbox.Group
                    :value="
                      Array.isArray(sq.answer)
                        ? sq.answer
                        : sq.answer
                          ? [sq.answer]
                          : []
                    "
                    @change="
                      (value) => handleSubQuestionAnswerChange(sq, value)
                    "
                  >
                    <Space direction="vertical">
                      <Checkbox
                        v-for="option in sq.options"
                        :key="option.label"
                        :value="option.label"
                      >
                        选项 {{ option.label }}
                      </Checkbox>
                    </Space>
                  </Checkbox.Group>
                </div>
              </div>
            </template>

            <!-- 判断题：答案 -->
            <div v-if="sq.type === 'judgement'" class="mb-3">
              <div class="form-label-sm">
                答案<span class="text-red-500">*</span>
              </div>
              <Radio.Group v-model:value="sq.answer" class="answer-selector-sm">
                <Space>
                  <Radio value="A">正确</Radio>
                  <Radio value="B">错误</Radio>
                </Space>
              </Radio.Group>
            </div>

            <!-- 填空题/简答题：答案 -->
            <div v-if="sq.type === 'fill' || sq.type === 'shortAnswer'">
              <div class="form-label-sm">
                参考答案<span class="text-red-500">*</span>
              </div>
              <MarkdownEditor
                v-model:value="sq.answer"
                :height="100"
                :options="uploadOptions"
              />
            </div>
          </Card>
        </Space>
      </Col>

      <!-- 解析 -->
      <Col :span="24" class="mb-4">
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
        <MarkdownEditor
          v-model:value="analysisContent"
          :height="150"
          :options="uploadOptions"
        />
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

.form-label-sm {
  margin-bottom: 6px;
  font-size: 13px;
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

.option-item-sm {
  padding: 8px;
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: 4px;
}

.option-label-sm {
  display: inline-block;
  min-width: 30px;
  font-size: 12px;
  font-weight: 500;
}

.answer-selector-sm {
  padding: 10px;
  background-color: var(--background);
  border: 1px solid var(--border);
  border-radius: 4px;
}

.blank-card {
  border: 1px solid var(--border);
}

.sub-question-card {
  background-color: var(--background);
  border: 1px solid var(--border);
}

.mb-0 {
  margin-bottom: 0 !important;
}
</style>
