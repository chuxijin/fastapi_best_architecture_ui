<script setup lang="ts">
import type {
  LayoutMode,
  RenderAnswerLayout,
  RenderContentMode,
  RenderDeliveryMode,
  RenderFileKind,
  RenderJobResult,
  RenderJobStatus,
  RenderOutputTargetsPayload,
  RenderTemplatePresetPayload,
  RenderTemplatePresetResult,
  RenderTemplatePreviewPayload,
  RenderTemplatePreviewResult,
  RenderTemplateSummary,
  RenderVariant,
  ThemeColor,
} from '#/plugins/render_book/api';

import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { message, Modal } from 'ant-design-vue';

import {
  buildRenderArtifactUrl,
  buildRenderJobFileUrl,
  createRenderJobApi,
  createRenderTemplatePresetApi,
  dispatchRenderJobApi,
  deleteRenderTemplatePresetApi,
  executeRenderJobApi,
  getRenderJobApi,
  getRenderJobListApi,
  getRenderTemplatesApi,
  getRenderTemplatePresetsApi,
  previewRenderTemplateApi,
  updateRenderTemplatePresetApi,
} from '#/plugins/render_book/api';

type Theme = ThemeColor;
type CoverStyle = 'exam' | 'practice';
type PaperSize = 'A4' | 'A5' | 'B5' | 'Legal' | 'Letter';
type PageNumberPosition = 'center' | 'left' | 'right';
type FontFamilyKey = 'fang' | 'hei' | 'kai' | 'song';

interface VariantConfig {
  content_mode: RenderContentMode;
  answer_layout: null | RenderAnswerLayout;
  delivery_mode: RenderDeliveryMode;
  solution_mode: 'appendix' | 'inline' | 'none' | 'separate';
  output_targets: RenderOutputTargetsPayload;
}

interface PreviewFormState {
  template_key: string;
  title: string;
  subtitle: string;
  subject: string;
  bank_id: null | number;
  chapter_id: null | number;
  cat_id: null | number;
  region: string;
  year_start: null | number;
  year_end: null | number;
  question_ids: string;
  question_types: string[];
  difficulties: string[];
  knowledge_points: string[];
  stem_keyword: string;
  option_keyword: string;
  analysis_keyword: string;
  question_count: number;
  wrong_only_recent_days: null | number;
  target_user_id: null | number;
  render_variant: RenderVariant;
  include_answer: boolean;
  include_analysis: boolean;
  layout_mode: LayoutMode;
  theme: Theme;
  dark_mode: boolean;
  show_source: boolean;
  cover_style: CoverStyle;
  paper_size: PaperSize;
  page_margin: string;
  base_font_size: string;
  body_font_family: FontFamilyKey;
  heading_font_family: FontFamilyKey;
  cover_font_family: FontFamilyKey;
  cover_title_line_1: string;
  cover_title_line_2: string;
  cover_sidebar_x: string;
  cover_sidebar_center_gap: string;
  cover_ticket_rule_length: string;
  cover_name_rule_length: string;
  cover_content_left: string;
  cover_content_right: string;
  cover_title_top: string;
  cover_notice_top: string;
  cover_bottom_note_left: string;
  cover_bottom_note_bottom: string;
  show_header: boolean;
  show_footer: boolean;
  show_header_rule: boolean;
  show_footer_rule: boolean;
  first_page_header_footer: boolean;
  show_page_number: boolean;
  page_number_position: PageNumberPosition;
  header_left: string;
  header_center: string;
  header_right: string;
  footer_left: string;
  footer_center: string;
  footer_right: string;
  upload_to_oss: boolean;
}

interface PresetFormState {
  preset_name: string;
  description: string;
  is_default: boolean;
  sort_order: number;
  remark: string;
}

const templates = ref<RenderTemplateSummary[]>([]);
const loading = ref(false);
const previewResult = ref<null | RenderTemplatePreviewResult>(null);
const previewUrl = ref('');
const presets = ref<RenderTemplatePresetResult[]>([]);
const presetsLoading = ref(false);
const presetSubmitting = ref(false);
const selectedPresetId = ref<number>();
const presetModalOpen = ref(false);
const previewMetaModalOpen = ref(false);
const jobDetailModalOpen = ref(false);
const finalSubmitting = ref(false);
const taskLoading = ref(false);
const selectedJobId = ref('');
const selectedJobDetail = ref<null | RenderJobResult>(null);
const autoRefreshTasks = ref(true);
const jobs = ref<RenderJobResult[]>([]);
const taskFilters = reactive<{
  keyword: string;
  status: '' | RenderJobStatus;
}>({
  keyword: '',
  status: '',
});
const taskPage = reactive({
  page: 1,
  size: 8,
  total: 0,
});
let taskPollingTimer: ReturnType<typeof setInterval> | undefined;

const formState = reactive<PreviewFormState>({
  template_key: 'exam_paper',
  title: '2026 年公务员行政职业能力测验',
  subtitle: '考前模拟卷',
  subject: '行测',
  bank_id: null,
  chapter_id: null,
  cat_id: null,
  region: '',
  year_start: null,
  year_end: null,
  question_ids: '',
  question_types: [],
  difficulties: [],
  knowledge_points: [],
  stem_keyword: '',
  option_keyword: '',
  analysis_keyword: '',
  question_count: 30,
  wrong_only_recent_days: null,
  target_user_id: null,
  render_variant: 'questions_only',
  include_answer: false,
  include_analysis: false,
  layout_mode: 'standard',
  theme: 'blue',
  dark_mode: false,
  show_source: true,
  cover_style: 'exam',
  paper_size: 'B5',
  page_margin: '1.8cm',
  base_font_size: '11pt',
  body_font_family: 'song',
  heading_font_family: 'hei',
  cover_font_family: 'hei',
  cover_title_line_1: '',
  cover_title_line_2: '',
  cover_sidebar_x: '1.34cm',
  cover_sidebar_center_gap: '4.48cm',
  cover_ticket_rule_length: '4.45cm',
  cover_name_rule_length: '4.05cm',
  cover_content_left: '3.15cm',
  cover_content_right: '1.15cm',
  cover_title_top: '4.85cm',
  cover_notice_top: '11.9cm',
  cover_bottom_note_left: '7.05cm',
  cover_bottom_note_bottom: '3.68cm',
  show_header: true,
  show_footer: true,
  show_header_rule: true,
  show_footer_rule: false,
  first_page_header_footer: true,
  show_page_number: true,
  page_number_position: 'center',
  header_left: '',
  header_center: '',
  header_right: '',
  footer_left: '',
  footer_center: '',
  footer_right: '',
  upload_to_oss: true,
});

const presetForm = reactive<PresetFormState>({
  preset_name: '',
  description: '',
  is_default: false,
  sort_order: 0,
  remark: '',
});

const templateMap = computed(() => {
  return templates.value.reduce<Record<string, RenderTemplateSummary>>((acc, item) => {
    acc[item.key] = item;
    return acc;
  }, {});
});

const selectedTemplate = computed(() => {
  return templateMap.value[formState.template_key] ?? null;
});

const selectedPreset = computed(() => {
  return presets.value.find((item) => item.id === selectedPresetId.value) ?? null;
});

const showWrongRecentDays = computed(() => formState.template_key === 'wrong_question');
const showTargetUserId = computed(() => formState.template_key === 'wrong_question');

const variantOptions = [
  { label: '题目版', value: 'questions_only' },
  { label: '解析版', value: 'solutions_only' },
  { label: '题解合订（逐题）', value: 'combined_inline' },
  { label: '题解合订（置后）', value: 'combined_appendix' },
];

const paperSizeOptions = [
  { label: 'A4', value: 'A4' },
  { label: 'A5', value: 'A5' },
  { label: 'B5', value: 'B5' },
  { label: 'Letter', value: 'Letter' },
  { label: 'Legal', value: 'Legal' },
];

const themeOptions = [
  { label: '蓝色', value: 'blue' },
  { label: '绿色', value: 'green' },
  { label: '橙色', value: 'orange' },
  { label: '紫色', value: 'purple' },
  { label: '青色', value: 'teal' },
  { label: '红色', value: 'crimson' },
  { label: '靛蓝', value: 'indigo' },
  { label: '琥珀', value: 'amber' },
];

const layoutModeOptions = [
  { label: '紧凑', value: 'compact' },
  { label: '标准', value: 'standard' },
  { label: '宽松', value: 'loose' },
  { label: '单题版', value: 'single' },
  { label: 'Pad 横版', value: 'pad_landscape' },
  { label: 'Pad 竖版', value: 'pad_portrait' },
];

const questionTypeOptions = [
  { label: '单选题', value: 'single' },
  { label: '多选题', value: 'multiple' },
  { label: '判断题', value: 'judgement' },
  { label: '填空题', value: 'fill' },
  { label: '简答题', value: 'shortAnswer' },
];

const difficultyFilterOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
];

const coverStyleOptions = [
  { label: '考试封面', value: 'exam' },
  { label: '练习封面', value: 'practice' },
];

const pageNumberPositionOptions = [
  { label: '左侧', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右侧', value: 'right' },
];

const fontFamilyOptions = [
  { label: '宋体', value: 'song' },
  { label: '黑体', value: 'hei' },
  { label: '楷体', value: 'kai' },
  { label: '仿宋', value: 'fang' },
];

const jobStatusOptions = [
  { label: '全部状态', value: '' },
  { label: '待执行', value: 'accepted' },
  { label: '执行中', value: 'running' },
  { label: '成功', value: 'succeeded' },
  { label: '失败', value: 'failed' },
];

const metadataJson = computed(() => {
  return JSON.stringify(previewResult.value?.resolved_metadata ?? {}, null, 2);
});

const payloadJson = computed(() => {
  return JSON.stringify(previewResult.value?.payload ?? {}, null, 2);
});

const selectedJobJson = computed(() => {
  return JSON.stringify(selectedJobDetail.value ?? {}, null, 2);
});

const selectedJobFiles = computed(() => {
  return selectedJobDetail.value?.files ?? [];
});

const runningJobCount = computed(() => {
  return jobs.value.filter((item) => item.status === 'accepted' || item.status === 'running').length;
});

const previewTabItems = computed(() => {
  return [
    {
      key: 'metadata',
      label: 'resolved_metadata',
      children: h('pre', { class: 'json-panel' }, metadataJson.value),
    },
    {
      key: 'payload',
      label: 'payload',
      children: h('pre', { class: 'json-panel' }, payloadJson.value),
    },
  ];
});

watch(
  () => formState.template_key,
  async (value) => {
    const nextCoverStyle: CoverStyle = value === 'exam_paper' ? 'exam' : 'practice';
    formState.cover_style = nextCoverStyle;
    if (value !== 'exam_paper' && formState.render_variant === 'questions_only') {
      formState.subtitle = '';
    }
    await fetchPresets(true);
    selectedJobId.value = '';
    selectedJobDetail.value = null;
    taskPage.page = 1;
    await fetchJobs(true);
  },
);

function resolveVariantConfig(renderVariant: RenderVariant) {
  if (renderVariant === 'solutions_only') {
    return {
      content_mode: 'questions_with_answers' as const,
      answer_layout: 'appendix' as const,
      delivery_mode: 'split_pdf' as const,
      solution_mode: 'separate' as const,
      output_targets: {
        question_pdf: false,
        solution_pdf: true,
      },
    } satisfies VariantConfig;
  }
  if (renderVariant === 'combined_inline') {
    return {
      content_mode: 'questions_with_answers' as const,
      answer_layout: 'inline' as const,
      delivery_mode: 'single_pdf' as const,
      solution_mode: 'inline' as const,
      output_targets: {
        question_pdf: true,
        solution_pdf: false,
      },
    } satisfies VariantConfig;
  }
  if (renderVariant === 'combined_appendix') {
    return {
      content_mode: 'questions_with_answers' as const,
      answer_layout: 'appendix' as const,
      delivery_mode: 'single_pdf' as const,
      solution_mode: 'appendix' as const,
      output_targets: {
        question_pdf: true,
        solution_pdf: false,
      },
    } satisfies VariantConfig;
  }
  return {
    content_mode: 'questions_only' as const,
    answer_layout: null,
    delivery_mode: 'single_pdf' as const,
    solution_mode: 'none' as const,
    output_targets: {
      question_pdf: true,
      solution_pdf: false,
    },
  } satisfies VariantConfig;
}

function inferVariantFromExportConfig(payload: RenderTemplatePresetPayload): null | RenderVariant {
  if (payload.render_variant) {
    return payload.render_variant;
  }

  const contentMode = payload.content_mode;
  const answerLayout = payload.answer_layout;
  const deliveryMode = payload.delivery_mode;
  if (contentMode === 'questions_only') {
    return 'questions_only';
  }
  if (contentMode === 'questions_with_answers') {
    if (answerLayout === 'inline') {
      return 'combined_inline';
    }
    if (deliveryMode === 'split_pdf') {
      const targets = payload.output_targets || { question_pdf: true, solution_pdf: false };
      if (!targets.question_pdf && targets.solution_pdf) {
        return 'solutions_only';
      }
      return 'questions_only';
    }
    return 'combined_appendix';
  }

  const legacySolutionMode = payload.solution_mode;
  if (legacySolutionMode === 'inline') {
    return 'combined_inline';
  }
  if (legacySolutionMode === 'appendix') {
    return 'combined_appendix';
  }
  if (legacySolutionMode === 'separate') {
    const targets = payload.output_targets || { question_pdf: true, solution_pdf: false };
    if (!targets.question_pdf && targets.solution_pdf) {
      return 'solutions_only';
    }
    return 'questions_only';
  }
  return 'questions_only';
}

function buildLayoutParams() {
  const coverTitleLines = [formState.cover_title_line_1, formState.cover_title_line_2].filter((item) =>
    item.trim(),
  );
  const layoutParams: Record<string, any> = {
    cover_style: formState.cover_style,
    paper_size: formState.paper_size,
    page_margin: formState.page_margin.trim(),
    base_font_size: formState.base_font_size.trim(),
    body_font_family: formState.body_font_family,
    heading_font_family: formState.heading_font_family,
    cover_font_family: formState.cover_font_family,
    cover_sidebar_x: formState.cover_sidebar_x.trim(),
    cover_sidebar_center_gap: formState.cover_sidebar_center_gap.trim(),
    cover_ticket_rule_length: formState.cover_ticket_rule_length.trim(),
    cover_name_rule_length: formState.cover_name_rule_length.trim(),
    cover_content_left: formState.cover_content_left.trim(),
    cover_content_right: formState.cover_content_right.trim(),
    cover_title_top: formState.cover_title_top.trim(),
    cover_notice_top: formState.cover_notice_top.trim(),
    cover_bottom_note_left: formState.cover_bottom_note_left.trim(),
    cover_bottom_note_bottom: formState.cover_bottom_note_bottom.trim(),
    cover_title_lines: coverTitleLines,
    show_header: formState.show_header,
    show_footer: formState.show_footer,
    show_header_rule: formState.show_header_rule,
    show_footer_rule: formState.show_footer_rule,
    first_page_header_footer: formState.first_page_header_footer,
    show_page_number: formState.show_page_number,
    page_number_position: formState.page_number_position,
  };

  const assignText = (key: string, value: string) => {
    const normalized = value.trim();
    if (normalized) {
      layoutParams[key] = normalized;
    }
  };

  assignText('header_left', formState.header_left);
  assignText('header_center', formState.header_center);
  assignText('header_right', formState.header_right);
  assignText('footer_left', formState.footer_left);
  assignText('footer_center', formState.footer_center);
  assignText('footer_right', formState.footer_right);

  return layoutParams;
}

function normalizeStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function buildFiltersFromForm() {
  const filters: Record<string, any> = {
    question_count: formState.question_count,
  };
  if (formState.bank_id) {
    filters.bank_id = formState.bank_id;
  }
  if (formState.chapter_id) {
    filters.chapter_id = formState.chapter_id;
  }
  if (formState.cat_id) {
    filters.cat_id = formState.cat_id;
  }
  if (formState.region.trim()) {
    filters.region = formState.region.trim();
  }
  if (formState.year_start) {
    filters.year_start = formState.year_start;
  }
  if (formState.year_end) {
    filters.year_end = formState.year_end;
  }
  if (formState.question_ids.trim()) {
    filters.question_ids = formState.question_ids.trim();
  }
  if (formState.question_types.length > 0) {
    filters.question_types = [...formState.question_types];
  }
  if (formState.difficulties.length > 0) {
    filters.difficulties = [...formState.difficulties];
  }
  if (formState.knowledge_points.length > 0) {
    filters.knowledge_points = [...formState.knowledge_points];
  }
  if (formState.stem_keyword.trim()) {
    filters.stem_keyword = formState.stem_keyword.trim();
  }
  if (formState.option_keyword.trim()) {
    filters.option_keyword = formState.option_keyword.trim();
  }
  if (formState.analysis_keyword.trim()) {
    filters.analysis_keyword = formState.analysis_keyword.trim();
  }
  if (showWrongRecentDays.value && formState.wrong_only_recent_days) {
    filters.wrong_only_recent_days = formState.wrong_only_recent_days;
  }
  return filters;
}

function buildPayload(): RenderTemplatePreviewPayload {
  const variantConfig = resolveVariantConfig(formState.render_variant);

  return {
    template_key: formState.template_key,
    mode: 'preview',
    title: formState.title.trim(),
    subtitle: formState.subtitle.trim() || null,
    subject: formState.subject.trim() || null,
    filters: buildFiltersFromForm(),
    content_mode: variantConfig.content_mode,
    answer_layout: variantConfig.answer_layout,
    delivery_mode: variantConfig.delivery_mode,
    solution_mode: variantConfig.solution_mode,
    output_targets: variantConfig.output_targets,
    options: {
      include_answer: formState.include_answer,
      include_analysis: formState.include_analysis,
      layout_mode: formState.layout_mode,
      theme: formState.theme,
      dark_mode: formState.dark_mode,
      show_source: formState.show_source,
    },
    metadata: {
      cover_style: formState.cover_style,
      ...(showTargetUserId.value && formState.target_user_id
        ? {
            user_id: formState.target_user_id,
          }
        : {}),
    },
    render_variant: formState.render_variant,
    layout_params: buildLayoutParams(),
    upload_to_oss: formState.upload_to_oss,
  };
}

function buildPresetPayloadFromForm(): RenderTemplatePresetPayload {
  const variantConfig = resolveVariantConfig(formState.render_variant);
  return {
    title: formState.title.trim(),
    subtitle: formState.subtitle.trim() || null,
    subject: formState.subject.trim() || null,
    content_mode: variantConfig.content_mode,
    answer_layout: variantConfig.answer_layout,
    delivery_mode: variantConfig.delivery_mode,
    solution_mode: variantConfig.solution_mode,
    filters: buildFiltersFromForm(),
    output_targets: variantConfig.output_targets,
    options: {
      include_answer: formState.include_answer,
      include_analysis: formState.include_analysis,
      layout_mode: formState.layout_mode,
      theme: formState.theme,
      dark_mode: formState.dark_mode,
      show_source: formState.show_source,
    },
    metadata: {
      cover_style: formState.cover_style,
      ...(showTargetUserId.value && formState.target_user_id
        ? {
            user_id: formState.target_user_id,
          }
        : {}),
    },
    render_variant: formState.render_variant,
    layout_params: buildLayoutParams(),
  };
}

function buildPreviewSrc(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

function buildFinalPayload(): RenderTemplatePreviewPayload {
  return {
    ...buildPayload(),
    mode: 'final',
  };
}

function formatDateTime(value?: null | string) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('zh-CN', { hour12: false });
}

function formatStatusText(status: RenderJobStatus) {
  const mapping: Record<RenderJobStatus, string> = {
    accepted: '待执行',
    running: '执行中',
    succeeded: '成功',
    failed: '失败',
  };
  return mapping[status] || status;
}

function statusBadge(status: RenderJobStatus) {
  const mapping: Record<RenderJobStatus, 'default' | 'error' | 'processing' | 'success' | 'warning'> = {
    accepted: 'warning',
    running: 'processing',
    succeeded: 'success',
    failed: 'error',
  };
  return mapping[status] || 'default';
}

function getFileKindLabel(fileKind: RenderFileKind) {
  const mapping: Record<RenderFileKind, string> = {
    question_pdf: '题目 PDF',
    solution_pdf: '解析 PDF',
    combined_pdf: '合订 PDF',
  };
  return mapping[fileKind] || fileKind;
}

function getJobOutputLink(job: RenderJobResult) {
  const preferred =
    [...job.files].find((item) => item.file_kind === 'combined_pdf' && item.status === 'available') ||
    [...job.files].find((item) => item.file_kind === 'question_pdf' && item.status === 'available') ||
    [...job.files].find((item) => item.status === 'available');
  if (!preferred) {
    return '';
  }
  return buildRenderJobFileUrl(job.job_id, preferred.file_kind as RenderFileKind, {
    preferUrl: true,
    renderVariant: preferred.render_variant || undefined,
  });
}

function openUrl(url: string) {
  if (!url) {
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function openPreviewMetaModal() {
  if (!previewResult.value) {
    message.info('请先生成一次预览');
    return;
  }
  previewMetaModalOpen.value = true;
}

function openJobDetailModal() {
  if (!selectedJobDetail.value) {
    message.info('请先从任务列表选择一个任务');
    return;
  }
  jobDetailModalOpen.value = true;
}

function revokePreviewUrl() {
  if (previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
}

async function fetchTemplates() {
  templates.value = await getRenderTemplatesApi();
}

async function fetchPresets(autoApply = false) {
  presetsLoading.value = true;
  try {
    const data = await getRenderTemplatePresetsApi({ template_key: formState.template_key });
    presets.value = data;
    if (autoApply) {
      const target = data.find((item) => item.is_default) ?? data[0];
      if (target) {
        selectedPresetId.value = target.id;
        applyPreset(target);
      } else {
        selectedPresetId.value = undefined;
      }
    } else if (selectedPresetId.value && !data.some((item) => item.id === selectedPresetId.value)) {
      selectedPresetId.value = undefined;
    }
  } finally {
    presetsLoading.value = false;
  }
}

async function fetchJobs(silent = false) {
  if (!silent) {
    taskLoading.value = true;
  }
  try {
    const data = await getRenderJobListApi({
      page: taskPage.page,
      size: taskPage.size,
      template_key: formState.template_key,
      mode: 'final',
      keyword: taskFilters.keyword.trim() || undefined,
      status: taskFilters.status || undefined,
    });
    jobs.value = data.items;
    taskPage.total = data.total;

    if (selectedJobId.value) {
      const matched = data.items.find((item) => item.job_id === selectedJobId.value);
      if (matched) {
        selectedJobDetail.value = matched;
      }
    }

    if (!selectedJobDetail.value && data.items.length > 0) {
      const firstJob = data.items[0];
      if (firstJob) {
        selectedJobId.value = firstJob.job_id;
        selectedJobDetail.value = firstJob;
      }
    }
  } finally {
    if (!silent) {
      taskLoading.value = false;
    }
  }
}

async function refreshJobDetail(jobId: string, silent = false) {
  if (!silent) {
    taskLoading.value = true;
  }
  try {
    const detail = await getRenderJobApi(jobId);
    selectedJobId.value = detail.job_id;
    selectedJobDetail.value = detail;
    jobs.value = jobs.value.map((item) => (item.job_id === detail.job_id ? detail : item));
  } finally {
    if (!silent) {
      taskLoading.value = false;
    }
  }
}

function applyPreset(preset: RenderTemplatePresetResult) {
  const payload = preset.payload;
  const filters = payload.filters ?? {};
  const options = payload.options ?? {
    include_answer: false,
    include_analysis: false,
    layout_mode: 'standard',
    theme: 'blue',
    dark_mode: false,
    show_source: true,
  };
  const layoutParams = payload.layout_params ?? {};
  const metadata = payload.metadata ?? {};
  const coverStyle = String(layoutParams.cover_style || metadata.cover_style || 'exam');

  formState.title = payload.title || '';
  formState.subtitle = payload.subtitle || '';
  formState.subject = payload.subject || '';
  formState.bank_id = typeof filters.bank_id === 'number' ? filters.bank_id : null;
  formState.chapter_id = typeof filters.chapter_id === 'number' ? filters.chapter_id : null;
  formState.cat_id = typeof filters.cat_id === 'number' ? filters.cat_id : null;
  formState.region = String(filters.region || '');
  formState.year_start = typeof filters.year_start === 'number' ? filters.year_start : null;
  formState.year_end = typeof filters.year_end === 'number' ? filters.year_end : null;
  formState.question_ids = Array.isArray(filters.question_ids)
    ? filters.question_ids.join(',')
    : String(filters.question_ids || '');
  formState.question_types = normalizeStringArray(filters.question_types);
  formState.difficulties = normalizeStringArray(filters.difficulties);
  formState.knowledge_points = normalizeStringArray(filters.knowledge_points);
  formState.stem_keyword = String(filters.stem_keyword || '');
  formState.option_keyword = String(filters.option_keyword || '');
  formState.analysis_keyword = String(filters.analysis_keyword || '');
  formState.question_count =
    typeof filters.question_count === 'number' && filters.question_count > 0 ? filters.question_count : 30;
  formState.wrong_only_recent_days =
    typeof filters.wrong_only_recent_days === 'number' && filters.wrong_only_recent_days > 0
      ? filters.wrong_only_recent_days
      : null;
  formState.target_user_id = typeof metadata.user_id === 'number' ? metadata.user_id : null;
  formState.render_variant = inferVariantFromExportConfig(payload) || 'questions_only';
  formState.include_answer = !!options.include_answer;
  formState.include_analysis = !!options.include_analysis;
  formState.layout_mode = (options as any).layout_mode || (options as any).density || 'standard';
  formState.theme = options.theme || 'blue';
  formState.dark_mode = !!(options as any).dark_mode;
  formState.show_source = options.show_source ?? true;
  formState.cover_style = coverStyle === 'practice' ? 'practice' : 'exam';
  formState.paper_size = (layoutParams.paper_size as PaperSize) || 'B5';
  formState.page_margin = String(layoutParams.page_margin || '1.8cm');
  formState.base_font_size = String(layoutParams.base_font_size || '11pt');
  formState.body_font_family = (layoutParams.body_font_family as FontFamilyKey) || 'song';
  formState.heading_font_family = (layoutParams.heading_font_family as FontFamilyKey) || 'hei';
  formState.cover_font_family = (layoutParams.cover_font_family as FontFamilyKey) || 'hei';
  formState.cover_title_line_1 = String(layoutParams.cover_title_lines?.[0] || '');
  formState.cover_title_line_2 = String(layoutParams.cover_title_lines?.[1] || '');
  formState.cover_sidebar_x = String(layoutParams.cover_sidebar_x || '1.34cm');
  formState.cover_sidebar_center_gap = String(layoutParams.cover_sidebar_center_gap || '4.48cm');
  formState.cover_ticket_rule_length = String(layoutParams.cover_ticket_rule_length || '4.45cm');
  formState.cover_name_rule_length = String(layoutParams.cover_name_rule_length || '4.05cm');
  formState.cover_content_left = String(layoutParams.cover_content_left || '3.15cm');
  formState.cover_content_right = String(layoutParams.cover_content_right || '1.15cm');
  formState.cover_title_top = String(layoutParams.cover_title_top || '4.85cm');
  formState.cover_notice_top = String(layoutParams.cover_notice_top || '11.9cm');
  formState.cover_bottom_note_left = String(layoutParams.cover_bottom_note_left || '7.05cm');
  formState.cover_bottom_note_bottom = String(layoutParams.cover_bottom_note_bottom || '3.68cm');
  formState.show_header = layoutParams.show_header ?? true;
  formState.show_footer = layoutParams.show_footer ?? true;
  formState.show_header_rule = layoutParams.show_header_rule ?? true;
  formState.show_footer_rule = layoutParams.show_footer_rule ?? false;
  formState.first_page_header_footer = layoutParams.first_page_header_footer ?? true;
  formState.show_page_number = layoutParams.show_page_number ?? true;
  formState.page_number_position = (layoutParams.page_number_position as PageNumberPosition) || 'center';
  formState.header_left = String(layoutParams.header_left || '');
  formState.header_center = String(layoutParams.header_center || '');
  formState.header_right = String(layoutParams.header_right || '');
  formState.footer_left = String(layoutParams.footer_left || '');
  formState.footer_center = String(layoutParams.footer_center || '');
  formState.footer_right = String(layoutParams.footer_right || '');
}

function openPresetModal() {
  presetForm.preset_name = selectedPreset.value?.preset_name || `${selectedTemplate.value?.name || '模板'}预设`;
  presetForm.description = selectedPreset.value?.description || '';
  presetForm.is_default = selectedPreset.value?.is_default || false;
  presetForm.sort_order = selectedPreset.value?.sort_order || 0;
  presetForm.remark = selectedPreset.value?.remark || '';
  presetModalOpen.value = true;
}

async function handleCreatePreset() {
  if (!presetForm.preset_name.trim()) {
    message.warning('请先填写预设名称');
    return;
  }
  presetSubmitting.value = true;
  try {
    const created = await createRenderTemplatePresetApi({
      template_key: formState.template_key,
      preset_name: presetForm.preset_name.trim(),
      description: presetForm.description.trim() || null,
      is_active: true,
      is_default: presetForm.is_default,
      sort_order: presetForm.sort_order,
      payload: buildPresetPayloadFromForm(),
      remark: presetForm.remark.trim() || null,
    });
    presetModalOpen.value = false;
    selectedPresetId.value = created.id;
    await fetchPresets(false);
    message.success('预设保存成功');
  } catch (error: any) {
    message.error(error?.message || '保存预设失败');
  } finally {
    presetSubmitting.value = false;
  }
}

async function handleUpdatePreset() {
  if (!selectedPreset.value) {
    message.warning('请先选择一个预设');
    return;
  }
  try {
    await updateRenderTemplatePresetApi(selectedPreset.value.id, {
      payload: buildPresetPayloadFromForm(),
    });
    await fetchPresets(false);
    message.success('当前预设已更新');
  } catch (error: any) {
    message.error(error?.message || '更新预设失败');
  }
}

async function handleDeletePreset() {
  if (!selectedPreset.value) {
    message.warning('请先选择一个预设');
    return;
  }
  Modal.confirm({
    title: '删除模板预设',
    content: `确定删除预设“${selectedPreset.value.preset_name}”吗？`,
    async onOk() {
      await deleteRenderTemplatePresetApi(selectedPreset.value!.id);
      selectedPresetId.value = undefined;
      await fetchPresets(false);
      message.success('预设已删除');
    },
  });
}

async function handlePresetChange(value: number | string) {
  const resolvedId = Number(value);
  selectedPresetId.value = Number.isNaN(resolvedId) ? undefined : resolvedId;
  const preset = presets.value.find((item) => item.id === resolvedId);
  if (preset) {
    applyPreset(preset);
    message.success(`已载入预设：${preset.preset_name}`);
  }
}

async function handlePreview() {
  if (!formState.title.trim()) {
    message.warning('请先填写题本标题');
    return;
  }
  loading.value = true;
  try {
    const result = await previewRenderTemplateApi(buildPayload());
    previewResult.value = result;
    revokePreviewUrl();
    previewUrl.value = result.pdf_url ? buildPreviewSrc(result.pdf_url) : '';
    if (!result.pdf_url) {
      message.warning('预览已生成，但未拿到可直接访问的 PDF 地址，请检查 OSS 或执行器地址。');
      return;
    }
    message.success('预览生成成功');
  } catch (error: any) {
    message.error(error?.message || '生成预览失败');
  } finally {
    loading.value = false;
  }
}

async function handleCreateFinalJob(dispatchAfterCreate = true) {
  if (!formState.title.trim()) {
    message.warning('请先填写题本标题');
    return;
  }
  finalSubmitting.value = true;
  try {
    const job = await createRenderJobApi(buildFinalPayload());
    selectedJobId.value = job.job_id;
    selectedJobDetail.value = job;
    message.success(dispatchAfterCreate ? '正式任务已创建，开始后台渲染' : '正式任务已创建');
    if (dispatchAfterCreate) {
      await dispatchRenderJobApi(job.job_id, true);
    }
    taskPage.page = 1;
    await fetchJobs(true);
    await refreshJobDetail(job.job_id, true);
  } catch (error: any) {
    message.error(error?.message || '创建正式任务失败');
  } finally {
    finalSubmitting.value = false;
  }
}

async function handleDispatchJob(job: RenderJobResult) {
  taskLoading.value = true;
  try {
    await dispatchRenderJobApi(job.job_id, true);
    message.success('已提交后台渲染');
    await refreshJobDetail(job.job_id, true);
    await fetchJobs(true);
  } catch (error: any) {
    message.error(error?.message || '后台渲染提交失败');
  } finally {
    taskLoading.value = false;
  }
}

async function handleExecuteJobSync(job: RenderJobResult) {
  taskLoading.value = true;
  try {
    await executeRenderJobApi(job.job_id, true);
    message.success('渲染完成');
    await refreshJobDetail(job.job_id, true);
    await fetchJobs(true);
  } catch (error: any) {
    message.error(error?.message || '同步执行失败');
  } finally {
    taskLoading.value = false;
  }
}

async function handleSelectJob(job: RenderJobResult) {
  selectedJobId.value = job.job_id;
  selectedJobDetail.value = job;
  await refreshJobDetail(job.job_id, true);
}

function asJobRecord(record: Partial<RenderJobResult> | Record<string, any>) {
  if (!record || typeof record.job_id !== 'string') {
    return null;
  }
  return record as RenderJobResult;
}

async function handleDispatchJobRow(record: Partial<RenderJobResult> | Record<string, any>) {
  const job = asJobRecord(record);
  if (!job) {
    return;
  }
  await handleDispatchJob(job);
}

async function handleExecuteJobSyncRow(record: Partial<RenderJobResult> | Record<string, any>) {
  const job = asJobRecord(record);
  if (!job) {
    return;
  }
  await handleExecuteJobSync(job);
}

function startTaskPolling() {
  stopTaskPolling();
  taskPollingTimer = setInterval(async () => {
    if (!autoRefreshTasks.value) {
      return;
    }
    // 没有正在运行的任务时停止轮询
    if (runningJobCount.value <= 0) {
      return;
    }
    await fetchJobs(true);
    if (selectedJobId.value) {
      await refreshJobDetail(selectedJobId.value, true);
    }
  }, 5000);
}

function stopTaskPolling() {
  if (taskPollingTimer) {
    clearInterval(taskPollingTimer);
    taskPollingTimer = undefined;
  }
}

onMounted(async () => {
  try {
    await fetchTemplates();
    await fetchPresets(true);
    await fetchJobs();
    startTaskPolling();
  } catch (error: any) {
    message.error(error?.message || '获取模板列表失败');
  }
});

onBeforeUnmount(() => {
  revokePreviewUrl();
  stopTaskPolling();
});
</script>

<template>
  <Page auto-content-height>
    <div class="render-book-preview h-full min-h-0">
      <section class="left-panel">
        <a-card class="panel-card" title="题本参数" variant="borderless">
          <a-alert
            v-if="selectedTemplate"
            class="mb-4"
            type="info"
            show-icon
            :message="selectedTemplate.name"
            :description="selectedTemplate.description"
          />

          <a-form layout="vertical">
            <a-form-item label="模板">
              <a-select
                v-model:value="formState.template_key"
                :options="
                  templates.map((item) => ({
                    label: item.name,
                    value: item.key,
                  }))
                "
                placeholder="请选择模板"
              />
            </a-form-item>

            <a-form-item label="模板预设">
              <div class="preset-row">
                <a-select
                  :value="selectedPresetId"
                  :options="
                    presets.map((item) => ({
                      label: item.is_default ? `${item.preset_name}（默认）` : item.preset_name,
                      value: item.id,
                    }))
                  "
                  :loading="presetsLoading"
                  placeholder="选择已保存的预设"
                  @change="handlePresetChange"
                />
                <a-button @click="fetchPresets(false)">刷新</a-button>
                <a-button type="dashed" @click="openPresetModal">保存当前</a-button>
              </div>
              <div class="preset-actions">
                <a-button :disabled="!selectedPreset" @click="handleUpdatePreset">覆盖当前预设</a-button>
                <a-button danger :disabled="!selectedPreset" @click="handleDeletePreset">删除当前预设</a-button>
              </div>
            </a-form-item>

            <a-form-item label="标题">
              <a-input v-model:value="formState.title" placeholder="题本标题" />
            </a-form-item>

            <a-form-item label="副标题">
              <a-input v-model:value="formState.subtitle" placeholder="可选" />
            </a-form-item>

            <div class="grid-row">
              <a-form-item label="学科">
                <a-input v-model:value="formState.subject" placeholder="如：行测" />
              </a-form-item>
              <a-form-item label="预览变体">
                <a-select v-model:value="formState.render_variant" :options="variantOptions" />
              </a-form-item>
            </div>

            <div class="grid-row">
              <a-form-item label="题库 ID">
                <a-input-number v-model:value="formState.bank_id" :min="1" class="w-full" />
              </a-form-item>
              <a-form-item label="章节 ID">
                <a-input-number v-model:value="formState.chapter_id" :min="1" class="w-full" />
              </a-form-item>
            </div>

            <div class="grid-row">
              <a-form-item label="分类 ID">
                <a-input-number v-model:value="formState.cat_id" :min="1" class="w-full" />
              </a-form-item>
              <a-form-item label="地区关键字">
                <a-input v-model:value="formState.region" placeholder="如：江苏 / 市地级" />
              </a-form-item>
            </div>

            <div class="grid-row">
              <a-form-item label="起始年份">
                <a-input-number v-model:value="formState.year_start" :min="1900" :max="2100" class="w-full" />
              </a-form-item>
              <a-form-item label="结束年份">
                <a-input-number v-model:value="formState.year_end" :min="1900" :max="2100" class="w-full" />
              </a-form-item>
            </div>

            <div class="grid-row">
              <a-form-item label="题量">
                <a-input-number
                  v-model:value="formState.question_count"
                  :min="1"
                  :max="200"
                  class="w-full"
                />
              </a-form-item>
              <a-form-item label="封面类型">
                <a-select v-model:value="formState.cover_style" :options="coverStyleOptions" />
              </a-form-item>
            </div>

            <a-form-item label="题目 ID 列表">
              <a-textarea
                v-model:value="formState.question_ids"
                :rows="3"
                placeholder="如：101,102,103"
              />
            </a-form-item>

            <a-form-item label="题型过滤">
              <a-select
                v-model:value="formState.question_types"
                mode="multiple"
                :options="questionTypeOptions"
                placeholder="可多选"
              />
            </a-form-item>

            <a-form-item label="难度过滤">
              <a-select
                v-model:value="formState.difficulties"
                mode="multiple"
                :options="difficultyFilterOptions"
                placeholder="可多选"
              />
            </a-form-item>

            <a-form-item label="考点过滤">
              <a-select
                v-model:value="formState.knowledge_points"
                mode="tags"
                :token-separators="[',', '，']"
                placeholder="输入后回车，可多项"
              />
            </a-form-item>

            <div class="grid-row">
              <a-form-item label="题干关键字">
                <a-input v-model:value="formState.stem_keyword" placeholder="模糊匹配题干" />
              </a-form-item>
              <a-form-item label="选项关键字">
                <a-input v-model:value="formState.option_keyword" placeholder="模糊匹配选项" />
              </a-form-item>
            </div>

            <a-form-item label="解析关键字">
              <a-input v-model:value="formState.analysis_keyword" placeholder="模糊匹配解析" />
            </a-form-item>

            <a-form-item v-if="showWrongRecentDays" label="最近错题天数">
              <a-input-number
                v-model:value="formState.wrong_only_recent_days"
                :min="1"
                :max="3650"
                class="w-full"
              />
            </a-form-item>

            <a-form-item v-if="showTargetUserId" label="目标用户 ID">
              <a-input-number v-model:value="formState.target_user_id" :min="1" class="w-full" />
            </a-form-item>

            <a-divider>渲染选项</a-divider>

            <div class="grid-row">
              <a-form-item label="主题色">
                <a-select v-model:value="formState.theme" :options="themeOptions" />
              </a-form-item>
              <a-form-item label="版式">
                <a-select v-model:value="formState.layout_mode" :options="layoutModeOptions" />
              </a-form-item>
            </div>

            <div class="switch-row">
              <a-switch v-model:checked="formState.dark_mode" />
              <span>暗色模式</span>
            </div>
            <div class="switch-row">
              <a-switch v-model:checked="formState.show_source" />
              <span>显示题目来源</span>
            </div>
            <div class="switch-row">
              <a-switch v-model:checked="formState.include_answer" />
              <span>附带答案</span>
            </div>
            <div class="switch-row">
              <a-switch v-model:checked="formState.include_analysis" />
              <span>附带解析</span>
            </div>
            <div class="switch-row">
              <a-switch v-model:checked="formState.upload_to_oss" />
              <span>预览后上传 OSS</span>
            </div>

            <a-divider>封面文案</a-divider>

            <a-form-item label="封面标题第 1 行">
              <a-input
                v-model:value="formState.cover_title_line_1"
                placeholder="为空时使用标题/副标题"
              />
            </a-form-item>

            <a-form-item label="封面标题第 2 行">
              <a-input v-model:value="formState.cover_title_line_2" placeholder="可选" />
            </a-form-item>

            <a-divider>版式参数</a-divider>

            <div class="grid-row">
              <a-form-item label="纸张">
                <a-select v-model:value="formState.paper_size" :options="paperSizeOptions" />
              </a-form-item>
              <a-form-item label="基础字号">
                <a-input v-model:value="formState.base_font_size" placeholder="11pt" />
              </a-form-item>
            </div>

            <div class="grid-row">
              <a-form-item label="正文字体">
                <a-select v-model:value="formState.body_font_family" :options="fontFamilyOptions" />
              </a-form-item>
              <a-form-item label="标题字体">
                <a-select v-model:value="formState.heading_font_family" :options="fontFamilyOptions" />
              </a-form-item>
            </div>

            <a-form-item label="封面字体">
              <a-select v-model:value="formState.cover_font_family" :options="fontFamilyOptions" />
            </a-form-item>

            <a-form-item label="页边距">
              <a-input v-model:value="formState.page_margin" placeholder="1.8cm" />
            </a-form-item>

            <div class="grid-row">
              <a-form-item label="侧栏 X">
                <a-input v-model:value="formState.cover_sidebar_x" />
              </a-form-item>
              <a-form-item label="侧栏中线间距">
                <a-input v-model:value="formState.cover_sidebar_center_gap" />
              </a-form-item>
            </div>

            <div class="grid-row">
              <a-form-item label="准考证号横线">
                <a-input v-model:value="formState.cover_ticket_rule_length" />
              </a-form-item>
              <a-form-item label="姓名横线">
                <a-input v-model:value="formState.cover_name_rule_length" />
              </a-form-item>
            </div>

            <div class="grid-row">
              <a-form-item label="内容左边界">
                <a-input v-model:value="formState.cover_content_left" />
              </a-form-item>
              <a-form-item label="内容右边界">
                <a-input v-model:value="formState.cover_content_right" />
              </a-form-item>
            </div>

            <div class="grid-row">
              <a-form-item label="标题顶部距离">
                <a-input v-model:value="formState.cover_title_top" />
              </a-form-item>
              <a-form-item label="提示顶部距离">
                <a-input v-model:value="formState.cover_notice_top" />
              </a-form-item>
            </div>

            <div class="grid-row">
              <a-form-item label="底部说明左边界">
                <a-input v-model:value="formState.cover_bottom_note_left" />
              </a-form-item>
              <a-form-item label="底部说明底边距">
                <a-input v-model:value="formState.cover_bottom_note_bottom" />
              </a-form-item>
            </div>

            <a-divider>页眉页脚</a-divider>

            <div class="switch-row">
              <a-switch v-model:checked="formState.show_header" />
              <span>显示页眉</span>
            </div>
            <div class="switch-row">
              <a-switch v-model:checked="formState.show_footer" />
              <span>显示页脚</span>
            </div>
            <div class="switch-row">
              <a-switch v-model:checked="formState.show_header_rule" />
              <span>显示页眉分隔线</span>
            </div>
            <div class="switch-row">
              <a-switch v-model:checked="formState.show_footer_rule" />
              <span>显示页脚分隔线</span>
            </div>
            <div class="switch-row">
              <a-switch v-model:checked="formState.first_page_header_footer" />
              <span>首页显示页眉页脚</span>
            </div>
            <div class="switch-row">
              <a-switch v-model:checked="formState.show_page_number" />
              <span>显示页码</span>
            </div>

            <a-form-item label="页码位置">
              <a-select
                v-model:value="formState.page_number_position"
                :disabled="!formState.show_page_number"
                :options="pageNumberPositionOptions"
              />
            </a-form-item>

            <div class="grid-row">
              <a-form-item label="页眉左">
                <a-input
                  v-model:value="formState.header_left"
                  placeholder="留空则默认题本标题"
                />
              </a-form-item>
              <a-form-item label="页眉中">
                <a-input v-model:value="formState.header_center" placeholder="可选" />
              </a-form-item>
            </div>

            <a-form-item label="页眉右">
              <a-input v-model:value="formState.header_right" placeholder="留空则默认渲染变体" />
            </a-form-item>

            <div class="grid-row">
              <a-form-item label="页脚左">
                <a-input v-model:value="formState.footer_left" placeholder="可选" />
              </a-form-item>
              <a-form-item label="页脚中">
                <a-input v-model:value="formState.footer_center" placeholder="可选" />
              </a-form-item>
            </div>

            <a-form-item label="页脚右">
              <a-input v-model:value="formState.footer_right" placeholder="可选" />
            </a-form-item>

            <div class="action-row">
              <a-button :loading="finalSubmitting" @click="handleCreateFinalJob(false)">
                创建正式任务
              </a-button>
              <a-button type="primary" ghost :loading="finalSubmitting" @click="handleCreateFinalJob(true)">
                后台生成正式 PDF
              </a-button>
              <a-button type="primary" :loading="loading" @click="handlePreview">
                生成预览
              </a-button>
            </div>
          </a-form>
        </a-card>
      </section>

      <section class="middle-panel">
        <a-card class="panel-card preview-card" title="PDF 预览" variant="borderless">
          <template #extra>
            <div v-if="previewResult" class="preview-extra">
              <span class="text-xs text-gray-500">Job ID: {{ previewResult.job.job_id }}</span>
              <a
                v-if="previewResult.pdf_url"
                :href="buildPreviewSrc(previewResult.pdf_url)"
                class="preview-link"
                rel="noopener noreferrer"
                target="_blank"
              >
                新窗口打开
              </a>
            </div>
          </template>

          <div v-if="previewUrl" class="preview-frame-wrap">
            <iframe :src="previewUrl" class="preview-frame"></iframe>
          </div>
          <a-empty
            v-else
            description="点击左侧“生成预览”后，这里会展示真实 PDF 成品。"
          />
        </a-card>
      </section>

      <section class="inspector-panel">
        <div class="stack-panel">
          <a-card class="panel-card" title="任务控制台" variant="borderless">
            <div class="console-actions">
              <a-button block @click="openPreviewMetaModal">
                查看预览参数
              </a-button>
              <a-button block :disabled="!selectedJobDetail" @click="openJobDetailModal">
                查看任务详情
              </a-button>
              <a-button
                block
                type="primary"
                ghost
                :disabled="!selectedJobDetail || !getJobOutputLink(selectedJobDetail)"
                @click="selectedJobDetail && openUrl(getJobOutputLink(selectedJobDetail))"
              >
                打开当前主输出
              </a-button>
            </div>

            <div v-if="selectedJobDetail" class="job-summary-card">
              <div class="job-summary-title">{{ selectedJobDetail.title }}</div>
              <div class="job-summary-meta">Job ID: {{ selectedJobDetail.job_id }}</div>
              <div class="job-summary-status">
                <a-tag :color="statusBadge(selectedJobDetail.status)">
                  {{ formatStatusText(selectedJobDetail.status) }}
                </a-tag>
                <span>{{ formatDateTime(selectedJobDetail.updated_at) }}</span>
              </div>
            </div>
            <a-empty v-else description="还没有选中正式任务" />
          </a-card>

          <a-card class="panel-card task-card" title="正式任务列表" variant="borderless">
            <template #extra>
              <div class="task-toolbar">
                <a-switch v-model:checked="autoRefreshTasks" size="small" />
                <span class="text-xs text-gray-500">自动刷新</span>
                <a-button size="small" :loading="taskLoading" @click="fetchJobs(false)">
                  刷新
                </a-button>
              </div>
            </template>

            <div class="task-filter-row">
              <a-input
                v-model:value="taskFilters.keyword"
                allow-clear
                placeholder="搜标题 / Job ID"
                @press-enter="taskPage.page = 1; fetchJobs(false)"
              />
              <a-select
                v-model:value="taskFilters.status"
                :options="jobStatusOptions"
                @change="taskPage.page = 1; fetchJobs(false)"
              />
            </div>

            <a-table
              size="small"
              row-key="job_id"
              :columns="[
                { title: '标题', dataIndex: 'title', key: 'title', width: 180 },
                { title: '状态', dataIndex: 'status', key: 'status', width: 84 },
                { title: '操作', key: 'action', width: 220 },
              ]"
              :data-source="jobs"
              :loading="taskLoading"
              :pagination="false"
              :custom-row="
                (record: RenderJobResult) => ({
                  onClick: () => handleSelectJob(record),
                  class: record.job_id === selectedJobId ? 'task-row-selected' : '',
                })
              "
              :scroll="{ y: 520 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'title'">
                  <div class="task-title-cell">
                    <div class="task-title-main">{{ record.title }}</div>
                    <div class="task-title-sub">{{ formatDateTime(record.created_at) }}</div>
                  </div>
                </template>
                <template v-else-if="column.key === 'status'">
                  <a-tag :color="statusBadge(record.status)">
                    {{ formatStatusText(record.status) }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="task-actions">
                    <a-button size="small" @click.stop="refreshJobDetail(record.job_id, false)">刷新</a-button>
                    <a-button
                      size="small"
                      type="primary"
                      ghost
                      :disabled="record.status === 'running'"
                      @click.stop="handleDispatchJobRow(record)"
                    >
                      后台生成
                    </a-button>
                    <a-button
                      size="small"
                      :disabled="record.status === 'running'"
                      @click.stop="handleExecuteJobSyncRow(record)"
                    >
                      同步执行
                    </a-button>
                  </div>
                </template>
              </template>
            </a-table>

            <div class="task-pagination">
              <a-pagination
                v-model:current="taskPage.page"
                v-model:page-size="taskPage.size"
                size="small"
                :show-size-changer="true"
                :page-size-options="['5', '8', '10', '20']"
                :total="taskPage.total"
                @change="fetchJobs(false)"
                @show-size-change="taskPage.page = 1; fetchJobs(false)"
              />
            </div>
          </a-card>
        </div>
      </section>
    </div>

    <a-modal
      v-model:open="presetModalOpen"
      title="保存模板预设"
      :confirm-loading="presetSubmitting"
      @ok="handleCreatePreset"
    >
      <a-form layout="vertical">
        <a-form-item label="预设名称" required>
          <a-input v-model:value="presetForm.preset_name" placeholder="如：国考-B5-考试封面" />
        </a-form-item>
        <a-form-item label="说明">
          <a-input v-model:value="presetForm.description" placeholder="可选，用于区分用途" />
        </a-form-item>
        <div class="grid-row">
          <a-form-item label="排序值">
            <a-input-number v-model:value="presetForm.sort_order" class="w-full" />
          </a-form-item>
          <a-form-item label="默认预设">
            <div class="switch-row modal-switch">
              <a-switch v-model:checked="presetForm.is_default" />
              <span>设为当前模板默认预设</span>
            </div>
          </a-form-item>
        </div>
        <a-form-item label="备注">
          <a-textarea v-model:value="presetForm.remark" :rows="3" placeholder="可选" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="previewMetaModalOpen"
      title="预览实际生效参数"
      width="960px"
      :footer="null"
    >
      <a-tabs :items="previewTabItems" />
    </a-modal>

    <a-modal
      v-model:open="jobDetailModalOpen"
      title="任务详情"
      width="980px"
      :footer="null"
    >
      <template v-if="selectedJobDetail">
        <div class="job-detail-block">
          <div class="job-detail-line"><span>标题</span><strong>{{ selectedJobDetail.title }}</strong></div>
          <div class="job-detail-line"><span>任务 ID</span><code>{{ selectedJobDetail.job_id }}</code></div>
          <div class="job-detail-line"><span>模板</span><span>{{ selectedJobDetail.template_key }}</span></div>
          <div class="job-detail-line"><span>创建时间</span><span>{{ formatDateTime(selectedJobDetail.created_at) }}</span></div>
          <div class="job-detail-line"><span>更新时间</span><span>{{ formatDateTime(selectedJobDetail.updated_at) }}</span></div>
          <div class="job-detail-line">
            <span>主输出</span>
            <a v-if="getJobOutputLink(selectedJobDetail)" @click.prevent="openUrl(getJobOutputLink(selectedJobDetail))">
              打开 PDF
            </a>
            <span v-else>-</span>
          </div>
          <div v-if="selectedJobDetail.error_message" class="job-error-box">
            {{ selectedJobDetail.error_message }}
          </div>
        </div>

        <template v-if="(selectedJobDetail as any).metadata?.preview_urls?.length">
          <a-divider>生成预览与试读</a-divider>
          <div class="overflow-x-auto pb-4" style="white-space: nowrap;">
            <a-image.PreviewGroup>
              <div style="display: inline-flex; gap: 16px;">
                <a-image
                  v-for="(url, idx) in (selectedJobDetail as any).metadata.preview_urls"
                  :key="idx"
                  :src="url"
                  :height="240"
                  style="border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); border: 1px solid #f0f0f0;"
                />
              </div>
            </a-image.PreviewGroup>
          </div>
        </template>

        <a-divider>文件下载</a-divider>
        <div class="job-file-list">
          <div v-for="file in selectedJobFiles" :key="`${file.file_kind}-${file.render_variant || 'default'}`" class="job-file-item">
            <div>
              <div class="job-file-title">
                {{ getFileKindLabel(file.file_kind as RenderFileKind) }}
                <span v-if="file.render_variant" class="job-file-variant">({{ file.render_variant }})</span>
              </div>
              <div class="job-file-meta">{{ file.filename }}</div>
            </div>
            <div class="job-file-actions">
              <a-button
                size="small"
                :disabled="file.status !== 'available'"
                @click="openUrl(buildRenderJobFileUrl(selectedJobDetail.job_id, file.file_kind as RenderFileKind, { inline: true, preferUrl: true, renderVariant: file.render_variant || undefined }))"
              >
                打开
              </a-button>
              <a-button
                size="small"
                :disabled="file.status !== 'available'"
                @click="openUrl(buildRenderJobFileUrl(selectedJobDetail.job_id, file.file_kind as RenderFileKind, { preferUrl: true, renderVariant: file.render_variant || undefined }))"
              >
                下载
              </a-button>
              <a-button
                v-if="file.render_variant"
                size="small"
                @click="openUrl(buildRenderArtifactUrl(selectedJobDetail.job_id, file.render_variant, 'log'))"
              >
                日志
              </a-button>
            </div>
          </div>
        </div>

        <a-divider>任务 JSON</a-divider>
        <pre class="json-panel job-json-panel">{{ selectedJobJson }}</pre>
      </template>
      <a-empty v-else description="暂无任务详情" />
    </a-modal>
  </Page>
</template>

<style scoped lang="scss">
.render-book-preview {
  display: grid;
  grid-template-columns: 420px minmax(0, 1.25fr) minmax(340px, 0.85fr);
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.left-panel,
.middle-panel,
.inspector-panel {
  min-height: 0;
}

.panel-card {
  height: 100%;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
}

.stack-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.preview-extra {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-link {
  font-size: 12px;
  color: #1677ff;
}

.grid-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.preset-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
}

.preset-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.modal-switch {
  margin-bottom: 0;
  margin-top: 6px;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.console-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.job-summary-card {
  margin-top: 16px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.9);
  padding: 14px;
}

.job-summary-title {
  color: #0f172a;
  font-weight: 600;
  line-height: 1.5;
}

.job-summary-meta {
  color: #64748b;
  font-size: 12px;
  margin-top: 4px;
}

.job-summary-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  margin-top: 10px;
}

.preview-card,
.meta-card {
  overflow: hidden;
}

.task-card {
  min-height: 0;
}

.preview-frame-wrap {
  height: 100%;
  min-height: 0;
  border-radius: 16px;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(30, 64, 175, 0.08), transparent 42%),
    linear-gradient(180deg, #edf2f7, #e2e8f0);
  padding: 12px;
}

.preview-frame {
  width: 100%;
  height: 100%;
  min-height: 720px;
  border: none;
  border-radius: 12px;
  background: white;
}

.json-panel {
  margin: 0;
  height: 100%;
  min-height: 640px;
  overflow: auto;
  border-radius: 12px;
  background: #0f172a;
  color: #dbeafe;
  padding: 16px;
  font-size: 12px;
  line-height: 1.6;
}

.job-json-panel {
  min-height: 280px;
}

.task-toolbar,
.task-filter-row,
.task-actions,
.job-file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-filter-row {
  margin-bottom: 12px;
}

.task-title-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-title-main {
  color: #0f172a;
  font-weight: 600;
}

.task-title-sub {
  color: #64748b;
  font-size: 12px;
}

.task-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

:deep(.task-row-selected > td) {
  background: rgba(22, 119, 255, 0.08) !important;
}

.job-detail-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.job-detail-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.job-detail-line span:first-child {
  color: #64748b;
  min-width: 72px;
}

.job-error-box {
  border-radius: 12px;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
}

.job-file-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.job-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.9);
  padding: 12px;
}

.job-file-title {
  color: #0f172a;
  font-weight: 600;
}

.job-file-variant,
.job-file-meta {
  color: #64748b;
  font-size: 12px;
}

:deep(.ant-card-body) {
  height: calc(100% - 57px);
  overflow: auto;
}

@media (max-width: 1280px) {
  .render-book-preview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .grid-row {
    grid-template-columns: 1fr;
  }

  .preset-row {
    grid-template-columns: 1fr;
  }

  .preset-actions {
    flex-direction: column;
  }

  .preview-frame {
    min-height: 560px;
  }

  .json-panel {
    min-height: 360px;
  }

  .task-filter-row,
  .task-toolbar,
  .task-actions,
  .job-file-item,
  .job-file-actions {
    flex-wrap: wrap;
  }
}
</style>
