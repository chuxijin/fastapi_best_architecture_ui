<script setup lang="ts">
import type {
  CreateQuestionParam,
  GetQuestionDetail,
  QuestionAnswerParam,
  QuestionExplanationParam,
  QuestionOption,
  UpdateQuestionParam,
} from '#/api/qbank-v2/question';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
  Spin,
  TabPane,
  Tabs,
  Tag,
  TextArea,
} from 'antdv-next';

import { getMaterialRevisionsApi } from '#/api/qbank-v2/material';
import {
  getQuestionApi,
  qbankV2CreateQuestionApi,
  qbankV2UpdateQuestionApi,
} from '#/api/qbank-v2/question';

import MaterialSearchSelect from '../components/MaterialSearchSelect.vue';

const emit = defineEmits(['success']);

const activeTab = ref('base');
const loading = ref(false);
const submitting = ref(false);
const questionId = ref<null | number>(null);

const questionTypeOptions = [
  { label: '单选题', value: 'single_choice' },
  { label: '多选题', value: 'multiple_choice' },
  { label: '判断题', value: 'true_false' },
  { label: '填空题', value: 'fill_blank' },
  { label: '简答题', value: 'short_answer' },
  { label: '综合题', value: 'composite' },
  { label: '交互题', value: 'interactive' },
];

const originTypeOptions = [
  { label: '精选真题 (curated)', value: 'curated' },
  { label: '批量导入 (imported)', value: 'imported' },
  { label: '用户创建 (user_created)', value: 'user_created' },
  { label: 'AI 生成 (generated)', value: 'generated' },
];

const contentFormatOptions = [
  { label: 'HTML 富文本', value: 'html' },
  { label: 'Markdown 语法', value: 'markdown' },
  { label: 'Plain 纯文本', value: 'plain' },
  { label: 'JSON 结构化', value: 'json' },
];

const gradingMethodOptions = [
  { label: '完全匹配 (exact)', value: 'exact' },
  { label: '集合匹配 (set)', value: 'set' },
  { label: '按序匹配 (ordered)', value: 'ordered' },
  { label: '范围匹配 (range)', value: 'range' },
  { label: '关键词匹配 (keyword)', value: 'keyword' },
  { label: '量规判分 (rubric)', value: 'rubric' },
  { label: '人工批改 (manual)', value: 'manual' },
];

const visibilityOptions = [
  { label: '公开 (public)', value: 'public' },
  { label: '内部 (internal)', value: 'internal' },
  { label: '私有 (private)', value: 'private' },
];

const statusOptions = [
  { label: '启用 (active)', value: 'active' },
  { label: '停用 (disabled)', value: 'disabled' },
  { label: '归档 (archived)', value: 'archived' },
];

const explanationTypeOptions = [
  { label: '官方解析 (official)', value: 'official' },
  { label: '专家解析 (expert)', value: 'expert' },
  { label: 'AI 解析 (ai)', value: 'ai' },
];

const materialRoleOptions = [
  { label: '阅读材料 (passage)', value: 'passage' },
  { label: '题目提示 (prompt)', value: 'prompt' },
  { label: '参考材料 (reference)', value: 'reference' },
  { label: '附件 (attachment)', value: 'attachment' },
];

const knowledgePointRoleOptions = [
  { label: '主知识点 (primary)', value: 'primary' },
  { label: '次要知识点 (secondary)', value: 'secondary' },
];

const formState = reactive<{
  answer: QuestionAnswerParam;
  code: string;
  content_format: 'html' | 'json' | 'markdown' | 'plain';
  default_score: number;
  explanations: QuestionExplanationParam[];
  knowledge_points: { knowledge_point_id: number; role: string }[];
  materials: Array<{
    material_id?: null | number;
    material_revision_id?: null | number;
    role: string;
  }>;
  options: QuestionOption[];
  origin_type: 'curated' | 'generated' | 'imported' | 'user_created';
  question_type: string;
  selectedOptions: string[];
  status: 'active' | 'archived' | 'disabled';
  stem: string;
  textAnswer: string;
  visibility: 'internal' | 'private' | 'public';
}>({
  code: '',
  question_type: 'single_choice',
  default_score: 1,
  visibility: 'public',
  status: 'active',
  origin_type: 'curated',
  content_format: 'html',
  stem: '',
  options: [
    { option_code: 'A', content: '', sort_order: 0 },
    { option_code: 'B', content: '', sort_order: 1 },
    { option_code: 'C', content: '', sort_order: 2 },
    { option_code: 'D', content: '', sort_order: 3 },
  ],
  answer: {
    answer_data: { correct: [] },
    grading_method: 'exact',
    grading_config: {},
  },
  explanations: [
    {
      content: '',
      explanation_type: 'official',
      is_default: true,
      version_no: 1,
    },
  ],
  materials: [],
  knowledge_points: [],
  selectedOptions: [],
  textAnswer: '',
});
const calculatedDifficulty = ref<number>();

const isChoiceType = computed(() =>
  ['multiple_choice', 'single_choice', 'true_false'].includes(
    formState.question_type,
  ),
);

function resetForm() {
  questionId.value = null;
  calculatedDifficulty.value = undefined;
  activeTab.value = 'base';
  Object.assign(formState, {
    code: `q_${Date.now().toString().slice(-6)}`,
    question_type: 'single_choice',
    default_score: 1,
    visibility: 'public',
    status: 'active',
    origin_type: 'curated',
    content_format: 'html',
    stem: '',
    options: [
      { option_code: 'A', content: '', sort_order: 0 },
      { option_code: 'B', content: '', sort_order: 1 },
      { option_code: 'C', content: '', sort_order: 2 },
      { option_code: 'D', content: '', sort_order: 3 },
    ],
    answer: {
      answer_data: { correct: [] },
      grading_method: 'exact',
      grading_config: {},
    },
    explanations: [
      {
        content: '',
        explanation_type: 'official',
        is_default: true,
        version_no: 1,
      },
    ],
    materials: [],
    knowledge_points: [],
    selectedOptions: [],
    textAnswer: '',
  });
}

function handleQuestionTypeChange(type: string) {
  if (type === 'true_false') {
    formState.options = [
      { option_code: 'A', content: '正确', sort_order: 0 },
      { option_code: 'B', content: '错误', sort_order: 1 },
    ];
  } else if (isChoiceType.value && formState.options.length === 0) {
    formState.options = [
      { option_code: 'A', content: '', sort_order: 0 },
      { option_code: 'B', content: '', sort_order: 1 },
      { option_code: 'C', content: '', sort_order: 2 },
      { option_code: 'D', content: '', sort_order: 3 },
    ];
  }
}

function addOption() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nextCode =
    letters[formState.options.length] || `OPT${formState.options.length + 1}`;
  formState.options.push({
    option_code: nextCode,
    content: '',
    sort_order: formState.options.length,
  });
}

function removeOption(index: number) {
  formState.options.splice(index, 1);
  formState.options.forEach((opt, idx) => {
    opt.sort_order = idx;
  });
}

function addExplanation() {
  formState.explanations.push({
    content: '',
    explanation_type: 'expert',
    is_default: false,
    version_no: formState.explanations.length + 1,
  });
}

function removeExplanation(index: number) {
  if (formState.explanations.length <= 1) {
    message.warning('必须至少保留一份解析');
    return;
  }
  const removed = formState.explanations.splice(index, 1)[0];
  if (removed?.is_default && formState.explanations.length > 0) {
    const first = formState.explanations[0];
    if (first) first.is_default = true;
  }
}

function setDefaultExplanation(index: number) {
  formState.explanations.forEach((item, idx) => {
    item.is_default = idx === index;
  });
}

const revisionOptionsMap = reactive<
  Record<number, Array<{ label: string; value: number }>>
>({});
const revisionLoadingMap = reactive<Record<number, boolean>>({});

async function loadMaterialRevisions(materialId: number) {
  revisionLoadingMap[materialId] = true;
  try {
    const revisions = await getMaterialRevisionsApi(materialId);
    revisionOptionsMap[materialId] = revisions.map((r) => ({
      label: `v${r.revision_no} · ${r.status}`,
      value: r.id,
    }));
    return revisions;
  } catch (error: any) {
    message.error(
      error?.response?.data?.detail || error?.message || '载入材料版本失败',
    );
    revisionOptionsMap[materialId] = [];
    return [];
  } finally {
    revisionLoadingMap[materialId] = false;
  }
}

async function handleMaterialSelect(
  item: { material_id?: null | number; material_revision_id?: null | number },
  materialId: null | number,
) {
  item.material_id = materialId;
  item.material_revision_id = null;
  if (!materialId) return;
  const revisions = await loadMaterialRevisions(materialId);
  const published = revisions.find((r) => r.status === 'published');
  const target = published || revisions[0];
  if (target) {
    item.material_revision_id = target.id;
  }
}

function addMaterialItem() {
  formState.materials.push({
    material_id: null,
    material_revision_id: null,
    role: 'passage',
  });
}

function removeMaterialItem(index: number) {
  formState.materials.splice(index, 1);
}

function addKnowledgePointItem() {
  formState.knowledge_points.push({ knowledge_point_id: 1, role: 'primary' });
}

function removeKnowledgePointItem(index: number) {
  formState.knowledge_points.splice(index, 1);
}

function toggleOptionAnswer(code: string) {
  if (
    formState.question_type === 'single_choice' ||
    formState.question_type === 'true_false'
  ) {
    formState.selectedOptions = [code];
  } else {
    const idx = formState.selectedOptions.indexOf(code);
    if (idx === -1) {
      formState.selectedOptions.push(code);
    } else {
      formState.selectedOptions.splice(idx, 1);
    }
  }
}

async function loadDetail(id: number) {
  loading.value = true;
  try {
    const detail: GetQuestionDetail = await getQuestionApi(id);
    questionId.value = detail.id;
    formState.code = detail.code;
    formState.question_type = detail.question_type;
    formState.default_score = Number(detail.default_score || 1);
    calculatedDifficulty.value = detail.difficulty
      ? Number(detail.difficulty)
      : undefined;
    formState.visibility = detail.visibility as any;
    formState.status = detail.status as any;
    formState.origin_type = (detail.origin_type as any) || 'curated';
    formState.content_format = (detail.content_format as any) || 'html';
    formState.stem = detail.stem || '';
    formState.options = Array.isArray(detail.options)
      ? [...detail.options]
      : [];

    if (detail.answer) {
      formState.answer = {
        answer_data: detail.answer.answer_data || { correct: [] },
        grading_method: detail.answer.grading_method as any,
        grading_config: detail.answer.grading_config || {},
      };
      const correct = detail.answer.answer_data?.correct;
      if (Array.isArray(correct)) {
        formState.selectedOptions = correct.map(String);
      } else if (correct !== undefined && correct !== null) {
        formState.selectedOptions = [String(correct)];
      }
      formState.textAnswer = typeof correct === 'string' ? correct : '';
    }

    if (Array.isArray(detail.explanations) && detail.explanations.length > 0) {
      formState.explanations = detail.explanations.map((exp) => ({
        content: exp.content,
        explanation_type: exp.explanation_type as any,
        is_default: exp.is_default,
        version_no: exp.version_no || 1,
      }));
    } else {
      formState.explanations = [
        {
          content: '',
          explanation_type: 'official',
          is_default: true,
          version_no: 1,
        },
      ];
    }

    if (Array.isArray(detail.materials)) {
      formState.materials = detail.materials.map((m) => ({
        material_id: m.material_id,
        material_revision_id: m.material_revision_id,
        role: m.role || 'passage',
      }));
      await Promise.all(
        formState.materials.map(async (m) => {
          if (m.material_id) {
            await loadMaterialRevisions(m.material_id);
          }
        }),
      );
    }

    if (Array.isArray(detail.knowledge_points)) {
      formState.knowledge_points = detail.knowledge_points.map((kp) => ({
        knowledge_point_id: kp.knowledge_point_id,
        role: kp.role || 'primary',
      }));
    }
  } catch (error: any) {
    message.error(
      error?.response?.data?.detail || error?.message || '加载题目详情失败',
    );
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-4/5 max-w-4xl',
  destroyOnClose: true,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await handleSubmit();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    resetForm();
    const data = modalApi.getData<{ id?: number }>();
    if (data?.id) {
      await loadDetail(data.id);
    }
  },
});

async function handleSubmit() {
  if (!formState.code.trim()) {
    message.warning('请输入题目编码');
    return;
  }
  if (!formState.stem.trim()) {
    message.warning('请输入题干内容');
    return;
  }
  if (
    formState.explanations.length === 0 ||
    !formState.explanations.some((exp) => exp.is_default)
  ) {
    message.warning('题目必须包含至少一份解析并指定默认解析');
    return;
  }

  let answerCorrect: any = formState.selectedOptions;
  if (
    formState.question_type === 'single_choice' ||
    formState.question_type === 'true_false'
  ) {
    answerCorrect = formState.selectedOptions[0] || '';
  } else if (!isChoiceType.value) {
    answerCorrect = formState.textAnswer;
  }

  const answerPayload: QuestionAnswerParam = {
    answer_data: { correct: answerCorrect },
    grading_method: formState.answer.grading_method as any,
    grading_config: formState.answer.grading_config || {},
  };

  const completeMaterials = formState.materials.filter(
    (m) => m.material_id && m.material_revision_id,
  );
  if (completeMaterials.length < formState.materials.length) {
    message.warning(
      `已忽略 ${formState.materials.length - completeMaterials.length} 行未选齐材料或版本的关联`,
    );
  }

  submitting.value = true;
  modalApi.setState({ confirmLoading: true });
  try {
    if (questionId.value) {
      const updatePayload: UpdateQuestionParam = {
        code: formState.code,
        question_type: formState.question_type as any,
        default_score: formState.default_score,
        visibility: formState.visibility,
        status: formState.status,
        stem: formState.stem,
        content_format: formState.content_format,
        options: isChoiceType.value ? formState.options : [],
        answer: answerPayload,
        explanations: formState.explanations,
        materials: completeMaterials as any,
        knowledge_points: formState.knowledge_points as any,
      };
      await qbankV2UpdateQuestionApi(questionId.value, updatePayload);
      message.success('题目修改成功');
    } else {
      const createPayload: CreateQuestionParam = {
        code: formState.code,
        question_type: formState.question_type as any,
        default_score: formState.default_score,
        visibility: formState.visibility,
        status: formState.status,
        origin_type: formState.origin_type,
        stem: formState.stem,
        content_format: formState.content_format,
        options: isChoiceType.value ? formState.options : [],
        answer: answerPayload,
        explanations: formState.explanations,
        knowledge_points: formState.knowledge_points as any,
        materials: completeMaterials as any,
      };
      await qbankV2CreateQuestionApi(createPayload);
      message.success('题目创建成功');
    }
    modalApi.close();
    emit('success');
  } catch (error: any) {
    message.error(
      error?.response?.data?.detail || error?.message || '保存题目失败',
    );
  } finally {
    submitting.value = false;
    modalApi.setState({ confirmLoading: false });
  }
}
</script>

<template>
  <Modal :title="questionId ? '编辑题目 (qbank-v2)' : '新增题目 (qbank-v2)'">
    <Spin :spinning="loading">
      <Form layout="vertical" class="p-2">
        <Tabs v-model:active-key="activeTab">
          <!-- Tab 1: 基础属性 & 题干选项 -->
          <TabPane key="base" tab="基础属性与选项">
            <div class="grid grid-cols-4 gap-3">
              <FormItem label="题目编码" required>
                <Input v-model:value="formState.code" placeholder="如 q_1001" />
              </FormItem>
              <FormItem label="题型" required>
                <Select
                  v-model:value="formState.question_type"
                  :options="questionTypeOptions"
                  @change="handleQuestionTypeChange"
                />
              </FormItem>
              <FormItem label="默认分值" required>
                <InputNumber
                  v-model:value="formState.default_score"
                  :min="0"
                  class="w-full"
                />
              </FormItem>
              <FormItem label="数据难度">
                <div
                  class="flex h-8 items-center text-sm text-muted-foreground"
                >
                  {{
                    questionId && calculatedDifficulty
                      ? `当前 ${calculatedDifficulty}`
                      : '有效作答达到 50 次后自动计算'
                  }}
                </div>
              </FormItem>
            </div>

            <div class="grid grid-cols-4 gap-3">
              <FormItem label="来源类型">
                <Select
                  v-model:value="formState.origin_type"
                  :options="originTypeOptions"
                />
              </FormItem>
              <FormItem label="内容格式">
                <Select
                  v-model:value="formState.content_format"
                  :options="contentFormatOptions"
                />
              </FormItem>
              <FormItem label="可见范围">
                <Select
                  v-model:value="formState.visibility"
                  :options="visibilityOptions"
                />
              </FormItem>
              <FormItem label="身份状态">
                <Select
                  v-model:value="formState.status"
                  :options="statusOptions"
                />
              </FormItem>
            </div>

            <FormItem label="题干内容 (stem)" required>
              <TextArea
                v-model:value="formState.stem"
                :rows="4"
                placeholder="请输入题干富文本或 Markdown / HTML 内容"
              />
            </FormItem>

            <!-- 动态选项编辑器 (仅选择题) -->
            <Card v-if="isChoiceType" size="small" class="mt-4 bg-gray-50">
              <template #title>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">选项编辑器</span>
                  <Button size="small" type="primary" ghost @click="addOption">
                    + 添加选项
                  </Button>
                </div>
              </template>
              <div class="space-y-3">
                <div
                  v-for="(opt, idx) in formState.options"
                  :key="idx"
                  class="flex items-center gap-3 rounded border bg-white p-2"
                >
                  <Tag color="blue" class="w-10 text-center font-bold">
                    {{ opt.option_code }}
                  </Tag>
                  <Input
                    v-model:value="opt.content"
                    class="flex-1"
                    placeholder="请输入选项内容"
                  />
                  <Button
                    size="small"
                    danger
                    type="link"
                    @click="removeOption(idx)"
                  >
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          </TabPane>

          <!-- Tab 2: 权威答案与判分配置 -->
          <TabPane key="answer" tab="标准答案与判分规则">
            <Card size="small" title="答案选择/输入" class="mb-4">
              <div v-if="isChoiceType" class="space-y-2">
                <div class="mb-2 text-xs text-gray-500">
                  点击下方选项标签设置为正确答案：
                </div>
                <div class="flex flex-wrap gap-3">
                  <Tag
                    v-for="opt in formState.options"
                    :key="opt.option_code"
                    :color="
                      formState.selectedOptions.includes(opt.option_code)
                        ? 'green'
                        : 'default'
                    "
                    class="cursor-pointer px-3 py-1 text-sm font-medium"
                    @click="toggleOptionAnswer(opt.option_code)"
                  >
                    {{ opt.option_code }}. {{ opt.content || '(空选项)' }}
                    <span
                      v-if="formState.selectedOptions.includes(opt.option_code)"
                    >
                      ✓</span
                    >
                  </Tag>
                </div>
              </div>
              <div v-else>
                <FormItem label="标准答案内容">
                  <TextArea
                    v-model:value="formState.textAnswer"
                    :rows="3"
                    placeholder="请输入主观题/填空题标准答案"
                  />
                </FormItem>
              </div>
            </Card>

            <Card size="small" title="判分模式配置">
              <FormItem label="判分方式 (grading_method)">
                <Select
                  v-model:value="formState.answer.grading_method"
                  :options="gradingMethodOptions"
                />
              </FormItem>
            </Card>
          </TabPane>

          <!-- Tab 3: 题目解析管理 -->
          <TabPane key="explanation" tab="题目解析">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-xs text-gray-500"
                >每道题目必须包含至少一份解析，且指定一份作为默认展示解析。</span
              >
              <Button size="small" type="primary" ghost @click="addExplanation">
                + 添加解析
              </Button>
            </div>

            <div class="space-y-3">
              <Card
                v-for="(exp, idx) in formState.explanations"
                :key="idx"
                size="small"
                :class="{ 'border-blue-500 bg-blue-50/20': exp.is_default }"
              >
                <template #title>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium">解析 #{{ idx + 1 }}</span>
                    <Tag v-if="exp.is_default" color="green">默认解析</Tag>
                  </div>
                </template>
                <template #extra>
                  <div class="flex items-center gap-2">
                    <Button
                      v-if="!exp.is_default"
                      size="small"
                      type="link"
                      @click="setDefaultExplanation(idx)"
                    >
                      设为默认
                    </Button>
                    <Button
                      size="small"
                      danger
                      type="link"
                      @click="removeExplanation(idx)"
                    >
                      删除
                    </Button>
                  </div>
                </template>
                <div class="grid grid-cols-2 gap-3 mb-2">
                  <FormItem label="解析类型" class="!mb-0">
                    <Select
                      v-model:value="exp.explanation_type"
                      :options="explanationTypeOptions"
                    />
                  </FormItem>
                </div>
                <FormItem label="解析正文" class="!mb-0">
                  <TextArea
                    v-model:value="exp.content"
                    :rows="3"
                    placeholder="请输入题目详细解析富文本"
                  />
                </FormItem>
              </Card>
            </div>
          </TabPane>

          <!-- Tab 4: 关联材料与知识点 -->
          <TabPane key="rel" tab="关联材料与知识点">
            <!-- 关联材料配置 -->
            <Card size="small" title="关联材料配置" class="mb-4">
              <template #extra>
                <Button
                  size="small"
                  type="primary"
                  ghost
                  @click="addMaterialItem"
                >
                  + 关联材料
                </Button>
              </template>
              <div v-if="formState.materials.length > 0" class="space-y-2">
                <div
                  v-for="(item, idx) in formState.materials"
                  :key="idx"
                  class="flex items-center gap-3 rounded border bg-gray-50 p-2"
                >
                  <div class="w-64">
                    <FormItem label="材料" class="!mb-0">
                      <MaterialSearchSelect
                        v-model:value="item.material_id"
                        class="w-full"
                        @change="(val) => handleMaterialSelect(item, val)"
                      />
                    </FormItem>
                  </div>
                  <div class="w-48">
                    <FormItem label="材料版本" class="!mb-0">
                      <Select
                        v-model:value="item.material_revision_id"
                        class="w-full"
                        :disabled="!item.material_id"
                        :loading="
                          !!(
                            item.material_id &&
                            revisionLoadingMap[item.material_id]
                          )
                        "
                        :options="
                          item.material_id
                            ? revisionOptionsMap[item.material_id] || []
                            : []
                        "
                        placeholder="选择材料后自动载入"
                        show-search
                        option-filter-prop="label"
                      />
                    </FormItem>
                  </div>
                  <div class="w-48">
                    <FormItem label="使用角色" class="!mb-0">
                      <Select
                        v-model:value="item.role"
                        :options="materialRoleOptions"
                      />
                    </FormItem>
                  </div>
                  <Button
                    size="small"
                    danger
                    type="link"
                    class="mt-5"
                    @click="removeMaterialItem(idx)"
                  >
                    解除关联
                  </Button>
                </div>
              </div>
              <div v-else class="py-2 text-center text-xs text-gray-400">
                暂未关联任何大题材料
              </div>
            </Card>

            <!-- 关联知识点标注 -->
            <Card size="small" title="知识点标注配置">
              <template #extra>
                <Button
                  size="small"
                  type="primary"
                  ghost
                  @click="addKnowledgePointItem"
                >
                  + 标注知识点
                </Button>
              </template>
              <div
                v-if="formState.knowledge_points.length > 0"
                class="space-y-2"
              >
                <div
                  v-for="(item, idx) in formState.knowledge_points"
                  :key="idx"
                  class="flex items-center gap-3 rounded border bg-gray-50 p-2"
                >
                  <div class="w-48">
                    <FormItem label="知识点 ID" class="!mb-0">
                      <InputNumber
                        v-model:value="item.knowledge_point_id"
                        :min="1"
                        class="w-full"
                        placeholder="输入知识点ID"
                      />
                    </FormItem>
                  </div>
                  <div class="w-48">
                    <FormItem label="权重角色" class="!mb-0">
                      <Select
                        v-model:value="item.role"
                        :options="knowledgePointRoleOptions"
                      />
                    </FormItem>
                  </div>
                  <Button
                    size="small"
                    danger
                    type="link"
                    class="mt-5"
                    @click="removeKnowledgePointItem(idx)"
                  >
                    移除标注
                  </Button>
                </div>
              </div>
              <div v-else class="py-2 text-center text-xs text-gray-400">
                暂未标注知识点
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </Form>
    </Spin>
  </Modal>
</template>

<style scoped></style>
