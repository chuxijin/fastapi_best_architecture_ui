<script setup lang="ts">
import type { UploadFile, UploadProps } from 'ant-design-vue';

import type {
  BatchImportQuestionResult,
  PdfMarkdownResult,
  QuestionImportRow,
  ReviewAnswerItem,
  ReviewJobEvent,
  ReviewJobResult,
} from '#/api';

import { computed, ref, toRaw } from 'vue';

import { VbenButton } from '@vben/common-ui';
import {
  MaterialSymbolsDescriptionOutline,
  MaterialSymbolsUploadFileOutline,
} from '@vben/icons';

import {
  Alert,
  Upload as AUpload,
  Card,
  Checkbox,
  Drawer,
  Empty,
  Input,
  message,
  Modal,
  Progress,
  Select,
  Step,
  Steps,
  Table,
  TabPane,
  Tabs,
  Tag,
} from 'ant-design-vue';
import { VxeColumn, VxeTable } from 'vxe-table';

import {
  batchImportQuestionsApi,
  commitReviewJobApi,
  convertPdfToMarkdownApi,
  createReviewJobStreamApi,
  downloadImportTemplateApi,
  downloadParseFileApi,
  exportReviewJobExcelApi,
  importExcelQuestionsApi,
  recoverLlamaParseMarkdownApi,
  updateReviewJobApi,
} from '#/api';

import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css';

interface Props {
  bankId: number;
}

const props = defineProps<Props>();

// ============ 通用状态 ============
const activeImportTab = ref('review');
const importResult = ref<BatchImportQuestionResult | null>(null);
const showResultDrawer = ref(false);

// ============ Tab 0: AI 审核台 ============
const reviewFileList = ref<UploadFile[]>([]);
const reviewJob = ref<null | ReviewJobResult>(null);
const reviewLoading = ref(false);
const reviewSaving = ref(false);
const reviewCommitting = ref(false);
const reviewProviderId = ref(4);
const reviewStage = ref('');
const reviewMessage = ref('');
const reviewProgress = ref(0);
const reviewError = ref('');
const selectedReviewQuestionIndex = ref(0);
const selectedReviewMaterialIndex = ref(0);
const selectedReviewAnswerIndex = ref(0);

const selectedReviewQuestion = computed(() => {
  return reviewJob.value?.questions[selectedReviewQuestionIndex.value] || null;
});
const selectedReviewMaterial = computed(() => {
  return reviewJob.value?.materials[selectedReviewMaterialIndex.value] || null;
});
const selectedReviewAnswer = computed(() => {
  return reviewJob.value?.answers?.[selectedReviewAnswerIndex.value] || null;
});
const selectedSourceSegment = computed(() => {
  const question = selectedReviewQuestion.value;
  if (!question || !reviewJob.value) return null;
  return (
    reviewJob.value.segments.find(
      (item) => item.segment_id === question.source_segment_id,
    ) || null
  );
});
const selectedReviewAnswerSourceSegment = computed(() => {
  const answerItem = selectedReviewAnswer.value;
  if (!answerItem || !reviewJob.value) return null;
  return (
    reviewJob.value.segments.find(
      (item) => item.segment_id === answerItem.source_segment_id,
    ) || null
  );
});
const reviewWarningCount = computed(() => {
  if (!reviewJob.value) return 0;
  const questionWarnings = reviewJob.value.questions.reduce(
    (count, item) => count + (item.warnings?.length || 0),
    0,
  );
  const materialWarnings = reviewJob.value.materials.reduce(
    (count, item) => count + (item.warnings?.length || 0),
    0,
  );
  const answerWarnings = (reviewJob.value.answers || []).reduce(
    (count, item) => count + (item.warnings?.length || 0),
    0,
  );
  return (
    questionWarnings +
    materialWarnings +
    answerWarnings +
    (reviewJob.value.warnings?.length || 0)
  );
});
const reviewApprovedCount = computed(() => {
  if (!reviewJob.value) return 0;
  return reviewJob.value.questions.filter((item) => item.status === 'approved')
    .length;
});
const reviewStageStepMap: Record<string, number> = {
  parse: 0,
  parse_done: 0,
  segment: 1,
  segment_done: 1,
  ai_extract: 2,
  ai_extract_done: 2,
};
const currentReviewStep = computed(() => {
  if (reviewJob.value) return 3;
  return reviewStageStepMap[reviewStage.value] ?? -1;
});

const beforeReviewUpload: UploadProps['beforeUpload'] = (file) => {
  reviewFileList.value = [file as any];
  return false;
};

function getCleanUploadFile(fileList: UploadFile[], fallbackName: string) {
  const rawItem = toRaw(fileList[0]) as any;
  const originFile = toRaw(rawItem.originFileObj || rawItem);
  return new File([originFile], originFile.name || fallbackName, {
    type: originFile.type || 'application/octet-stream',
  });
}

async function handleCreateReviewJob(
  extractMode: 'answer' | 'question' = 'question',
) {
  if (reviewFileList.value.length === 0) {
    message.error('请先选择 PDF 或 Markdown 文件');
    return;
  }

  reviewLoading.value = true;
  reviewJob.value = null;
  reviewStage.value = '';
  reviewMessage.value = '';
  reviewProgress.value = 0;
  reviewError.value = '';
  const loadingText =
    extractMode === 'answer'
      ? '正在解析答案和解析...'
      : '正在创建 AI 审核任务...';
  const hide = message.loading(loadingText, 0);
  try {
    const cleanFile = getCleanUploadFile(reviewFileList.value, 'document.pdf');
    await createReviewJobStreamApi(
      cleanFile,
      props.bankId,
      reviewProviderId.value,
      extractMode,
      (event: ReviewJobEvent) => {
        if (event.type === 'stage') {
          reviewStage.value = event.stage;
          reviewMessage.value = event.message || '';
          if (event.stage === 'ai_extract_done') {
            reviewProgress.value = 100;
          }
          return;
        }
        if (event.type === 'progress') {
          reviewProgress.value = Math.round(
            (event.batch_index / event.total_batches) * 100,
          );
          const totalQuestions = event.total_questions_count || 0;
          const totalAnswers = event.total_answers_count || 0;
          reviewMessage.value = `AI 提取中 ${event.batch_index}/${event.total_batches} 批，题目 ${totalQuestions} 道，答案解析 ${totalAnswers} 条`;
          return;
        }
        if (event.type === 'done') {
          reviewJob.value = event.job;
          reviewProgress.value = 100;
          reviewMessage.value = event.message;
          return;
        }
        if (event.type === 'error') {
          reviewError.value = event.message;
          message.error(event.message || '创建审核任务失败');
        }
      },
    );
    const currentJob = reviewJob.value as null | ReviewJobResult;
    if (!currentJob && reviewError.value) return;
    if (!currentJob) {
      throw new Error('未获取到审核任务结果');
    }
    selectedReviewQuestionIndex.value = 0;
    selectedReviewMaterialIndex.value = 0;
    selectedReviewAnswerIndex.value = 0;
    if (extractMode === 'answer') {
      message.success(`答案解析已生成，识别 ${currentJob.answers_count} 条`);
      return;
    }
    message.success(
      `审核任务已创建，识别 ${currentJob.questions_count} 题，答案解析 ${currentJob.answers_count} 条`,
    );
  } catch (error: any) {
    message.error(error.message || '创建审核任务失败');
  } finally {
    hide();
    reviewLoading.value = false;
  }
}

async function handleSaveReviewJob(status?: string) {
  if (!reviewJob.value) return;
  reviewSaving.value = true;
  try {
    reviewJob.value = await updateReviewJobApi(reviewJob.value.job_id, {
      materials: reviewJob.value.materials,
      questions: reviewJob.value.questions,
      answers: reviewJob.value.answers || [],
      segments: reviewJob.value.segments,
      status: status || reviewJob.value.status || 'pending_review',
    });
    message.success('审核结果已保存');
  } catch (error: any) {
    message.error(error.message || '保存失败');
  } finally {
    reviewSaving.value = false;
  }
}

async function handleExportReviewExcel() {
  if (!reviewJob.value) return;
  await handleSaveReviewJob();
  try {
    const data = await exportReviewJobExcelApi(reviewJob.value.job_id);
    reviewJob.value.excel_url = data.excel_url;
    const urlPath = `/api/v1/qbank/parse/files/download?filename=${encodeURIComponent(data.excel_url)}`;
    const blob = await downloadParseFileApi(urlPath);
    const filename = data.excel_url.split('/').pop() || 'review.xlsx';
    triggerBlobDownload(blob, filename);
  } catch (error: any) {
    message.error(error.message || '导出 Excel 失败');
  }
}

async function handleCommitReviewJob() {
  if (!reviewJob.value) return;
  Modal.confirm({
    title: '确认入库',
    content: `将提交 ${reviewJob.value.questions.filter((item) => item.status !== 'rejected').length} 道题，状态为“拒绝”的题目不会入库。`,
    async onOk() {
      if (!reviewJob.value) return;
      reviewCommitting.value = true;
      try {
        await handleSaveReviewJob('approved');
        const result = await commitReviewJobApi(reviewJob.value.job_id);
        reviewJob.value.status = 'committed';
        message.success(
          `入库完成：${result.questions_count} 题，${result.materials_count} 条材料`,
        );
      } catch (error: any) {
        message.error(error.message || '入库失败');
      } finally {
        reviewCommitting.value = false;
      }
    },
  });
}

function markReviewQuestion(status: string) {
  if (!selectedReviewQuestion.value) return;
  selectedReviewQuestion.value.status = status;
}

function markReviewMaterial(status: string) {
  if (!selectedReviewMaterial.value) return;
  selectedReviewMaterial.value.status = status;
}

function getReviewOption(code: string) {
  const option = selectedReviewQuestion.value?.options_data?.[code];
  if (!option) return '';
  if (typeof option === 'string') return option;
  return option.content || '';
}

function setReviewOption(code: string, value: string) {
  const question = selectedReviewQuestion.value;
  if (!question) return;
  const option = question.options_data?.[code];
  if (typeof option === 'object' && option) {
    option.content = value;
    return;
  }
  question.options_data[code] = { code, content: value };
}

function getReviewAnswer() {
  const correct = selectedReviewQuestion.value?.answer_data?.correct;
  if (Array.isArray(correct)) return correct.join(',');
  return correct || '';
}

function setReviewAnswer(value: string) {
  const question = selectedReviewQuestion.value;
  if (!question) return;
  if (question.type === 'multiple') {
    question.answer_data.correct = value.split(/[\s,，、]+/).filter(Boolean);
    return;
  }
  question.answer_data.correct = value;
}

function getReviewAnswerItem(answerItem: null | ReviewAnswerItem) {
  const correct = answerItem?.answer_data?.correct;
  if (Array.isArray(correct)) return correct.join(',');
  return correct || '';
}

function setReviewAnswerItemAnswer(
  answerItem: ReviewAnswerItem,
  value: string,
) {
  if (!answerItem.answer_data) {
    answerItem.answer_data = {};
  }
  answerItem.answer_data.correct = value;
}

function normalizeCopyCell(value: unknown) {
  if (Array.isArray(value)) return value.join(',');
  return String(value ?? '')
    .replaceAll('\t', ' ')
    .replaceAll(/\r?\n/g, ' ')
    .trim();
}

async function handleCopyReviewAnswers() {
  const answers = reviewJob.value?.answers || [];
  if (answers.length === 0) {
    message.warning('暂无答案解析可复制');
    return;
  }

  const text = answers
    .map((answerItem) => {
      return [
        normalizeCopyCell(getReviewAnswerItem(answerItem)),
        normalizeCopyCell(answerItem.analysis_content),
      ].join('\t');
    })
    .join('\n');

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  message.success(`已复制 ${answers.length} 行答案和解析`);
}

function setReviewSortOrder(value: string) {
  const question = selectedReviewQuestion.value;
  if (!question) return;
  const parsed = Number(value);
  question.sort_order = Number.isFinite(parsed) ? parsed : null;
}

function setReviewChapterLevel1Name(value: string) {
  const question = selectedReviewQuestion.value;
  if (!question) return;
  question.chapter_level1_name = value || null;
  question.chapter_name = value || null;
}

function setReviewChapterLevel2Name(value: string) {
  const question = selectedReviewQuestion.value;
  if (!question) return;
  question.chapter_level2_name = value || null;
}

function setReviewChapterLevel3Name(value: string) {
  const question = selectedReviewQuestion.value;
  if (!question) return;
  question.chapter_level3_name = value || null;
}

function setReviewMaterialId(value: string) {
  const question = selectedReviewQuestion.value;
  if (!question) return;
  question.material_id = value || null;
}

function setReviewKnowledgePoint(value: string) {
  const question = selectedReviewQuestion.value;
  if (!question) return;
  question.knowledge_point = value || null;
}

const markdownConverting = ref(false);
const recoverMarkdownOpen = ref(false);
const recoverMarkdownJobId = ref('');
const recoverMarkdownLoading = ref(false);
const recoverMarkdownDownloadImages = ref(false);

function openRecoverMarkdownModal() {
  recoverMarkdownDownloadImages.value = false;
  recoverMarkdownOpen.value = true;
}

async function handleConvertPdfToMarkdown() {
  if (reviewFileList.value.length === 0) {
    message.error('请先选择 PDF 文件');
    return;
  }

  const cleanFile = getCleanUploadFile(reviewFileList.value, 'document.pdf');
  if (!cleanFile.name.toLowerCase().endsWith('.pdf')) {
    message.error('仅支持 PDF 转 Markdown');
    return;
  }

  markdownConverting.value = true;
  const hide = message.loading('正在转换 Markdown...', 0);
  try {
    const data = await convertPdfToMarkdownApi(cleanFile, props.bankId);
    await downloadParseResultFiles(data, 'document');
    const textMessage = data.text_length
      ? `，Text ${data.text_length} 字符`
      : '';
    message.success(`Markdown 已生成，共 ${data.md_length} 字符${textMessage}`);
  } catch (error: any) {
    message.error(error.message || 'PDF 转 Markdown 失败');
  } finally {
    hide();
    markdownConverting.value = false;
  }
}

async function handleRecoverMarkdownFromJob() {
  const jobId = recoverMarkdownJobId.value.trim();
  if (!jobId) {
    message.error('请输入 LlamaParse JobID');
    return;
  }

  recoverMarkdownLoading.value = true;
  const hide = message.loading('正在从云端恢复 Markdown...', 0);
  try {
    const data = await recoverLlamaParseMarkdownApi({
      bank_id: props.bankId,
      download_images: recoverMarkdownDownloadImages.value,
      job_id: jobId,
    });
    await downloadParseResultFiles(data, jobId);
    recoverMarkdownOpen.value = false;
    const textMessage = data.text_length
      ? `，Text ${data.text_length} 字符`
      : '';
    message.success(`Markdown 已恢复，共 ${data.md_length} 字符${textMessage}`);
  } catch (error: any) {
    message.error(error.message || '恢复 Markdown 失败');
  } finally {
    hide();
    recoverMarkdownLoading.value = false;
  }
}

async function downloadParseResultFiles(
  data: PdfMarkdownResult,
  fallbackStem: string,
) {
  const mdUrlPath = `/api/v1/qbank/parse/files/download?filename=${encodeURIComponent(data.md_url)}`;
  const mdBlob = await downloadParseFileApi(mdUrlPath);
  triggerBlobDownload(mdBlob, data.file_name || `${fallbackStem}.md`);

  if (!data.text_url) return;

  const textUrlPath = `/api/v1/qbank/parse/files/download?filename=${encodeURIComponent(data.text_url)}`;
  const textBlob = await downloadParseFileApi(textUrlPath);
  triggerBlobDownload(textBlob, data.text_file_name || `${fallbackStem}.txt`);
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  message.success('文件已开始下载');
}

// ============ Tab 1: Excel 导入 ============
const excelFileList = ref<UploadFile[]>([]);
const excelUploading = ref(false);
const excelResult = ref<any>(null);

const beforeExcelUpload: UploadProps['beforeUpload'] = (file) => {
  excelFileList.value = [file as any];
  return false;
};

async function handleExcelImport() {
  if (excelFileList.value.length === 0) {
    message.error('请先选择 Excel 文件');
    return;
  }

  excelUploading.value = true;
  const hide = message.loading('正在导入 Excel...', 0);

  try {
    const rawItem = toRaw(excelFileList.value[0]) as any;
    const originFile = toRaw(rawItem.originFileObj || rawItem);
    const cleanFile = new File([originFile], originFile.name || 'import.xlsx', {
      type:
        originFile.type ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = await importExcelQuestionsApi(cleanFile, props.bankId);
    hide();
    excelResult.value = result;
    message.success(
      `导入完成！成功 ${result.success_count} 题，复用 ${result.dedup_count || 0} 题，冲突提示 ${result.conflict_count || 0} 条`,
    );
    excelFileList.value = [];
  } catch (error: any) {
    hide();
    message.error(`Excel 导入失败: ${error.message}`);
  } finally {
    excelUploading.value = false;
  }
}

async function handleDownloadTemplate() {
  try {
    const blob = await downloadImportTemplateApi();
    triggerBlobDownload(blob, 'question_import_template.xlsx');
  } catch {
    message.error('模板下载失败');
  }
}

// ============ Tab 3: JSON 导入 ============
const jsonFileList = ref<UploadFile[]>([]);
const jsonUploading = ref(false);

const beforeJsonUpload: UploadProps['beforeUpload'] = (file) => {
  jsonFileList.value = [file as any];
  return false;
};

async function handleJsonImport() {
  if (jsonFileList.value.length === 0) return;
  jsonUploading.value = true;
  const hide = message.loading('正在解析 JSON 文件...', 0);
  try {
    const file = jsonFileList.value[0] as any;
    const text = await file.text();
    const data = JSON.parse(text);
    const questions = data.questions || [];

    const formattedQuestions: QuestionImportRow[] = questions.map((q: any) => ({
      题目: q.stem || q.题目,
      题型: q.type || q.题型,
      分数: q.score || q.分数 || 1,
      难度: q.difficulty || q.难度 || '中等',
      选项A: q.options_data?.A?.content || q.选项A,
      选项B: q.options_data?.B?.content || q.选项B,
      选项C: q.options_data?.C?.content || q.选项C,
      选项D: q.options_data?.D?.content || q.选项D,
      答案: q.answer_data?.correct || q.答案,
      解析: q.analysis_content || q.解析 || '',
      一级目录: q.chapter_level1_name || q.一级目录 || q.chapter_name,
      二级目录: q.chapter_level2_name || q.二级目录,
      三级目录: q.chapter_level3_name || q.三级目录,
    }));

    const result = await batchImportQuestionsApi({
      bank_id: props.bankId,
      questions: formattedQuestions,
    });
    hide();
    importResult.value = result;
    showResultDrawer.value = true;
    if (result.fail_count === 0) {
      message.success(`JSON 导入完成，成功 ${result.success_count} 道题目`);
      jsonFileList.value = [];
    }
  } catch (error: any) {
    hide();
    message.error(`JSON 导入失败: ${error.message}`);
  } finally {
    jsonUploading.value = false;
  }
}

// ============ 通用 ============
const resultColumns = [
  { title: '行号', dataIndex: 'row_number', width: 80 },
  {
    title: '状态',
    dataIndex: 'success',
    width: 100,
    customRender: ({ text }: any) => (text ? '✅ 成功' : '❌ 失败'),
  },
  { title: '错误信息', dataIndex: 'error_message', ellipsis: true },
];
</script>

<template>
  <div class="question-import-container">
    <Card title="题目批量导入">
      <Tabs v-model:active-key="activeImportTab" type="card">
        <!-- ============ AI 审核台 ============ -->
        <TabPane key="review" tab="🧾 AI审核台">
          <div
            class="rounded-b-lg border border-t-0 border-gray-100 bg-white p-6"
          >
            <Alert class="mb-5" show-icon type="info">
              <template #message>
                上传 PDF 或 Markdown
                后生成审核任务。材料、题目、答案先人工确认，确认后再入库；Excel
                可随时导出备份。
              </template>
            </Alert>

            <div class="mb-5 flex flex-wrap items-center gap-3">
              <AUpload
                :file-list="reviewFileList"
                :before-upload="beforeReviewUpload"
                accept=".pdf,.md"
                :max-count="1"
              >
                <VbenButton>
                  <MaterialSymbolsDescriptionOutline class="mr-1 size-4" />
                  选择 PDF / MD
                </VbenButton>
              </AUpload>
              <Input
                v-model:value.number="reviewProviderId"
                class="!w-24"
                type="number"
                addon-before="供应商"
              />
              <VbenButton
                type="primary"
                :loading="reviewLoading"
                :disabled="reviewFileList.length === 0"
                @click="handleCreateReviewJob('question')"
              >
                创建审核任务
              </VbenButton>
              <VbenButton
                :loading="reviewLoading"
                :disabled="reviewFileList.length === 0"
                @click="handleCreateReviewJob('answer')"
              >
                解析答案解析
              </VbenButton>
              <VbenButton
                :loading="markdownConverting"
                :disabled="reviewFileList.length === 0 || reviewLoading"
                @click="handleConvertPdfToMarkdown"
              >
                仅转 Markdown
              </VbenButton>
              <VbenButton
                :loading="recoverMarkdownLoading"
                :disabled="reviewLoading || markdownConverting"
                @click="openRecoverMarkdownModal"
              >
                恢复 JobID
              </VbenButton>
              <VbenButton
                :disabled="!reviewJob?.answers?.length"
                @click="handleCopyReviewAnswers"
              >
                复制答案/解析两列
              </VbenButton>
              <VbenButton
                :disabled="!reviewJob"
                :loading="reviewSaving"
                @click="handleSaveReviewJob()"
              >
                保存审核
              </VbenButton>
              <VbenButton
                :disabled="!reviewJob"
                @click="handleExportReviewExcel"
              >
                导出 Excel
              </VbenButton>
              <VbenButton
                type="primary"
                class="!bg-green-600 text-white"
                :disabled="
                  !reviewJob ||
                  reviewJob.status === 'committed' ||
                  reviewJob.extract_mode === 'answer'
                "
                :loading="reviewCommitting"
                @click="handleCommitReviewJob"
              >
                确认入库
              </VbenButton>
            </div>

            <div
              v-if="reviewLoading || reviewStage || reviewError"
              class="mb-5 rounded-lg border bg-gray-50 p-5"
            >
              <Steps :current="currentReviewStep" size="small" class="mb-5">
                <Step title="解析文档" />
                <Step title="正则分段" />
                <Step title="AI 提取" />
                <Step title="进入审核" />
              </Steps>
              <div
                v-if="reviewMessage && !reviewError"
                class="mb-4 flex items-center gap-2 text-sm text-gray-600"
              >
                <span
                  v-if="reviewLoading"
                  class="inline-block size-2 animate-pulse rounded-full bg-blue-500"
                ></span>
                {{ reviewMessage }}
              </div>
              <Progress
                v-if="
                  reviewStage === 'ai_extract' ||
                  reviewStage === 'ai_extract_done'
                "
                :percent="reviewProgress"
                :status="reviewProgress >= 100 ? 'success' : 'active'"
                stroke-color="#1677ff"
              />
              <Alert
                v-if="reviewError"
                class="mt-4"
                :message="reviewError"
                type="error"
                show-icon
              />
            </div>

            <div v-if="reviewJob" class="mb-4 grid grid-cols-5 gap-3">
              <div class="review-stat">
                <div class="review-stat-value">
                  {{ reviewJob.questions.length }}
                </div>
                <div class="review-stat-label">题目</div>
              </div>
              <div class="review-stat">
                <div class="review-stat-value">
                  {{ reviewJob.materials.length }}
                </div>
                <div class="review-stat-label">材料</div>
              </div>
              <div class="review-stat">
                <div class="review-stat-value">
                  {{ reviewJob.answers?.length || 0 }}
                </div>
                <div class="review-stat-label">答案解析</div>
              </div>
              <div class="review-stat">
                <div class="review-stat-value">{{ reviewApprovedCount }}</div>
                <div class="review-stat-label">已通过</div>
              </div>
              <div class="review-stat">
                <div class="review-stat-value text-red-600">
                  {{ reviewWarningCount }}
                </div>
                <div class="review-stat-label">告警</div>
              </div>
            </div>

            <Alert
              v-if="reviewJob?.extract_mode === 'answer'"
              class="mb-4"
              show-icon
              type="success"
              message="当前为答案解析模式，只用于复制粘贴，不会提交入库。"
            />

            <div v-if="reviewJob" class="review-workbench">
              <div class="review-list">
                <div class="review-panel-title">题目列表</div>
                <div
                  v-for="(question, index) in reviewJob.questions"
                  :key="question.question_id"
                  class="review-question-row"
                  :class="{
                    active: selectedReviewQuestionIndex === index,
                    rejected: question.status === 'rejected',
                  }"
                  @click="selectedReviewQuestionIndex = index"
                >
                  <div class="truncate font-medium">
                    {{ question.sort_order || index + 1 }}.
                    {{ question.question_no_raw || question.question_id }}
                  </div>
                  <div
                    class="mt-1 flex items-center gap-1 text-xs text-gray-500"
                  >
                    <Tag size="small">{{ question.type }}</Tag>
                    <span
                      >{{ Math.round((question.confidence || 0) * 100) }}%</span
                    >
                    <Tag
                      v-if="question.warnings?.length"
                      color="orange"
                      size="small"
                    >
                      {{ question.warnings.length }}
                    </Tag>
                  </div>
                </div>
              </div>

              <div class="review-editor">
                <template v-if="selectedReviewQuestion">
                  <div class="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div class="text-lg font-semibold">
                        第
                        {{
                          selectedReviewQuestion.sort_order ||
                          selectedReviewQuestionIndex + 1
                        }}
                        题
                      </div>
                      <div class="text-xs text-gray-500">
                        {{
                          selectedReviewQuestion.source_segment_id ||
                          '未绑定来源分段'
                        }}
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <VbenButton
                        size="sm"
                        @click="markReviewQuestion('approved')"
                      >
                        通过
                      </VbenButton>
                      <VbenButton
                        size="sm"
                        @click="markReviewQuestion('pending_review')"
                      >
                        待审
                      </VbenButton>
                      <VbenButton
                        size="sm"
                        danger
                        @click="markReviewQuestion('rejected')"
                      >
                        拒绝
                      </VbenButton>
                    </div>
                  </div>

                  <div class="grid grid-cols-6 gap-3">
                    <Select v-model:value="selectedReviewQuestion.type">
                      <Select.Option value="single">单选</Select.Option>
                      <Select.Option value="multiple">多选</Select.Option>
                      <Select.Option value="judgement">判断</Select.Option>
                      <Select.Option value="fill">填空</Select.Option>
                      <Select.Option value="shortAnswer">简答</Select.Option>
                    </Select>
                    <Input
                      :value="selectedReviewQuestion.sort_order ?? undefined"
                      type="number"
                      placeholder="排序"
                      @change="
                        (event: any) => setReviewSortOrder(event.target.value)
                      "
                    />
                    <Input
                      :value="
                        selectedReviewQuestion.chapter_level1_name ||
                        selectedReviewQuestion.chapter_name ||
                        ''
                      "
                      placeholder="一级篇章"
                      @change="
                        (event: any) =>
                          setReviewChapterLevel1Name(event.target.value)
                      "
                    />
                    <Input
                      :value="selectedReviewQuestion.chapter_level2_name || ''"
                      placeholder="二级篇章"
                      @change="
                        (event: any) =>
                          setReviewChapterLevel2Name(event.target.value)
                      "
                    />
                    <Input
                      :value="selectedReviewQuestion.chapter_level3_name || ''"
                      placeholder="三级篇章"
                      @change="
                        (event: any) =>
                          setReviewChapterLevel3Name(event.target.value)
                      "
                    />
                    <Input
                      :value="selectedReviewQuestion.material_id || ''"
                      placeholder="材料编号"
                      @change="
                        (event: any) => setReviewMaterialId(event.target.value)
                      "
                    />
                  </div>

                  <div class="mt-4">
                    <div class="mb-1 text-sm text-gray-500">题干</div>
                    <Input.TextArea
                      v-model:value="selectedReviewQuestion.stem"
                      :auto-size="{ minRows: 4, maxRows: 10 }"
                    />
                  </div>

                  <div class="mt-4 grid grid-cols-2 gap-3">
                    <Input
                      v-for="code in ['A', 'B', 'C', 'D']"
                      :key="code"
                      :value="getReviewOption(code)"
                      :addon-before="code"
                      @change="
                        (event: any) =>
                          setReviewOption(code, event.target.value)
                      "
                    />
                  </div>

                  <div class="mt-4 grid grid-cols-2 gap-3">
                    <Input
                      :value="getReviewAnswer()"
                      addon-before="答案"
                      @change="
                        (event: any) => setReviewAnswer(event.target.value)
                      "
                    />
                    <Input
                      :value="
                        Array.isArray(selectedReviewQuestion.knowledge_point)
                          ? selectedReviewQuestion.knowledge_point.join(',')
                          : selectedReviewQuestion.knowledge_point || ''
                      "
                      addon-before="知识点"
                      @change="
                        (event: any) =>
                          setReviewKnowledgePoint(event.target.value)
                      "
                    />
                  </div>

                  <div class="mt-4">
                    <div class="mb-1 text-sm text-gray-500">解析</div>
                    <Input.TextArea
                      v-model:value="selectedReviewQuestion.analysis_content"
                      :auto-size="{ minRows: 3, maxRows: 8 }"
                    />
                  </div>

                  <Alert
                    v-if="selectedReviewQuestion.warnings?.length"
                    class="mt-4"
                    type="warning"
                    show-icon
                    :message="selectedReviewQuestion.warnings.join('；')"
                  />
                </template>

                <template v-else-if="reviewJob.extract_mode === 'answer'">
                  <div class="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div class="text-lg font-semibold">答案解析</div>
                      <div class="text-xs text-gray-500">
                        共
                        {{ reviewJob.answers?.length || 0 }}
                        条，复制时只复制答案和解析两列
                      </div>
                    </div>
                    <VbenButton
                      type="primary"
                      :disabled="!reviewJob.answers?.length"
                      @click="handleCopyReviewAnswers"
                    >
                      复制两列
                    </VbenButton>
                  </div>

                  <VxeTable
                    border
                    show-overflow
                    :data="reviewJob.answers || []"
                    height="600"
                    :edit-config="{ trigger: 'dblclick', mode: 'cell' }"
                    :mouse-config="{ selected: true }"
                    :keyboard-config="{
                      isArrow: true,
                      isDel: true,
                      isEnter: true,
                      isTab: true,
                      isEdit: true,
                    }"
                    size="small"
                  >
                    <VxeColumn
                      field="question_no_raw"
                      title="题号"
                      width="90"
                      :edit-render="{}"
                    >
                      <template #edit="{ row }">
                        <Input
                          v-model:value="row.question_no_raw"
                          size="small"
                        />
                      </template>
                    </VxeColumn>
                    <VxeColumn
                      field="answer_data.correct"
                      title="答案"
                      width="160"
                      :edit-render="{}"
                    >
                      <template #edit="{ row }">
                        <Input
                          :value="getReviewAnswerItem(row)"
                          size="small"
                          @change="
                            (event: any) =>
                              setReviewAnswerItemAnswer(row, event.target.value)
                          "
                        />
                      </template>
                      <template #default="{ row }">
                        {{ getReviewAnswerItem(row) }}
                      </template>
                    </VxeColumn>
                    <VxeColumn
                      field="analysis_content"
                      title="解析"
                      min-width="420"
                      :edit-render="{}"
                    >
                      <template #edit="{ row }">
                        <Input.TextArea
                          v-model:value="row.analysis_content"
                          :auto-size="{ minRows: 3, maxRows: 8 }"
                        />
                      </template>
                    </VxeColumn>
                  </VxeTable>
                </template>
              </div>

              <div class="review-side">
                <div class="review-panel-title">材料</div>
                <div
                  v-for="(material, index) in reviewJob.materials"
                  :key="`${material.material_id}-${index}`"
                  class="review-material"
                  :class="{ active: selectedReviewMaterialIndex === index }"
                  @click="selectedReviewMaterialIndex = index"
                >
                  <div class="mb-2 flex items-center gap-2">
                    <Input
                      v-model:value="material.material_id"
                      class="!w-24"
                      size="small"
                    />
                    <VbenButton
                      size="sm"
                      @click.stop="markReviewMaterial('approved')"
                    >
                      过
                    </VbenButton>
                    <VbenButton
                      size="sm"
                      danger
                      @click.stop="markReviewMaterial('rejected')"
                    >
                      拒
                    </VbenButton>
                  </div>
                  <Input
                    v-model:value="material.title"
                    class="mb-2"
                    size="small"
                  />
                  <Input.TextArea
                    v-model:value="material.content"
                    :auto-size="{ minRows: 3, maxRows: 8 }"
                  />
                </div>

                <div class="review-panel-title mt-4">答案解析</div>
                <div
                  v-for="(answer, index) in reviewJob.answers || []"
                  :key="`${answer.answer_id}-${index}`"
                  class="review-answer"
                  :class="{ active: selectedReviewAnswerIndex === index }"
                  @click="selectedReviewAnswerIndex = index"
                >
                  <div class="mb-2 flex items-center gap-2">
                    <Input
                      :value="answer.question_no_raw || undefined"
                      class="!w-24"
                      size="small"
                      addon-before="题号"
                      @change="
                        (event: any) =>
                          (answer.question_no_raw = event.target.value || null)
                      "
                    />
                    <Input
                      :value="getReviewAnswerItem(answer)"
                      class="min-w-0 flex-1"
                      size="small"
                      addon-before="答案"
                      @change="
                        (event: any) =>
                          setReviewAnswerItemAnswer(answer, event.target.value)
                      "
                    />
                  </div>
                  <Input.TextArea
                    v-model:value="answer.analysis_content"
                    :auto-size="{ minRows: 3, maxRows: 8 }"
                  />
                  <Alert
                    v-if="answer.warnings?.length"
                    class="mt-2"
                    type="warning"
                    show-icon
                    :message="answer.warnings.join('；')"
                  />
                </div>

                <div class="review-panel-title mt-4">来源原文</div>
                <pre class="review-source">{{
                  selectedReviewAnswer?.source_quote ||
                  selectedReviewAnswerSourceSegment?.content ||
                  selectedSourceSegment?.content ||
                  '暂无来源分段'
                }}</pre>
              </div>
            </div>

            <Empty v-else description="暂无审核任务，请选择文件后创建" />
          </div>
        </TabPane>

        <!-- ============ Excel 导入 ============ -->
        <TabPane key="excel" tab="📊 Excel 导入">
          <div
            class="rounded-b-lg border border-t-0 border-gray-100 bg-white p-6"
          >
            <Alert class="mb-6" show-icon type="info">
              <template #message>
                上传符合模板格式的 Excel 文件直接入库。支持题干去重、材料关联。
              </template>
            </Alert>

            <div class="import-step">
              <div class="mb-3 flex items-center justify-between">
                <span class="text-sm font-medium text-gray-600"
                  >选择 Excel 文件（.xlsx）：</span
                >
                <VbenButton type="link" @click="handleDownloadTemplate">
                  📥 下载导入模板
                </VbenButton>
              </div>
              <AUpload
                :file-list="excelFileList"
                :before-upload="beforeExcelUpload"
                accept=".xlsx,.xls"
                :max-count="1"
              >
                <VbenButton>
                  <MaterialSymbolsUploadFileOutline class="mr-1 size-4" />
                  选择 Excel 文件
                </VbenButton>
              </AUpload>
            </div>

            <div class="mt-6 flex justify-end">
              <VbenButton
                type="primary"
                :loading="excelUploading"
                :disabled="excelFileList.length === 0"
                @click="handleExcelImport"
              >
                开始导入
              </VbenButton>
            </div>

            <!-- Excel 导入结果 -->
            <div v-if="excelResult" class="mt-6">
              <Alert
                :type="excelResult.fail_count === 0 ? 'success' : 'warning'"
                show-icon
              >
                <template #message>
                  导入完成：成功 {{ excelResult.success_count }} 题，失败
                  {{ excelResult.fail_count }} 题
                  <span v-if="excelResult.dedup_count">
                    ，复用已有 {{ excelResult.dedup_count }} 题
                  </span>
                  <span v-if="excelResult.existing_count">
                    ，已存在 {{ excelResult.existing_count }} 题
                  </span>
                  <span v-if="excelResult.skipped_count">
                    ，跳过重复 {{ excelResult.skipped_count }} 题
                  </span>
                  <span v-if="excelResult.conflict_count">
                    ，冲突提示 {{ excelResult.conflict_count }} 条
                  </span>
                  <span v-if="excelResult.materials_count">
                    ，材料 {{ excelResult.materials_count }} 条
                  </span>
                </template>
              </Alert>
            </div>
          </div>
        </TabPane>

        <!-- ============ JSON 导入 ============ -->
        <TabPane key="json" tab="📋 JSON 导入">
          <div
            class="rounded-b-lg border border-t-0 border-gray-100 bg-white p-6"
          >
            <Alert class="mb-6" show-icon type="info">
              <template #message>
                支持符合 JSON Schema 格式的系统导出文件直接回灌。
              </template>
            </Alert>
            <div class="import-step">
              <AUpload
                :file-list="jsonFileList"
                :before-upload="beforeJsonUpload"
                accept=".json"
                :max-count="1"
              >
                <VbenButton>
                  <MaterialSymbolsDescriptionOutline class="mr-1 size-4" />
                  选择 JSON 文件
                </VbenButton>
              </AUpload>
            </div>
            <div class="mt-6 flex justify-end">
              <VbenButton
                type="primary"
                :loading="jsonUploading"
                :disabled="jsonFileList.length === 0"
                @click="handleJsonImport"
              >
                执行 JSON 导入
              </VbenButton>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Card>

    <Modal
      v-model:open="recoverMarkdownOpen"
      title="从 LlamaParse JobID 恢复 Markdown"
      :confirm-loading="recoverMarkdownLoading"
      ok-text="恢复并下载"
      @ok="handleRecoverMarkdownFromJob"
    >
      <Input
        v-model:value="recoverMarkdownJobId"
        placeholder="例如 pjb-mnlicqrdyv4eir5pwhs85dkpgo9j"
        allow-clear
      />
      <Checkbox v-model:checked="recoverMarkdownDownloadImages" class="mt-3">
        同时下载图片
      </Checkbox>
    </Modal>

    <!-- 导入统计结果 -->
    <Drawer v-model:open="showResultDrawer" title="导入运行报告" :width="700">
      <div v-if="importResult" class="space-y-4">
        <Alert
          :message="`任务统计：总计 ${importResult.total}，成功 ${importResult.success_count}，失败 ${importResult.fail_count}`"
          :type="importResult.fail_count === 0 ? 'success' : 'warning'"
          show-icon
        />
        <Table
          :columns="resultColumns"
          :data-source="importResult.details"
          :pagination="{ pageSize: 15 }"
          size="small"
          bordered
        />
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.import-step {
  padding: 20px;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
}

.review-stat {
  padding: 12px 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.review-stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  color: #111827;
}

.review-stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.review-workbench {
  display: grid;
  grid-template-columns: 240px minmax(420px, 1fr) 360px;
  gap: 12px;
  min-height: 680px;
}

.review-list,
.review-editor,
.review-side {
  min-height: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.review-list,
.review-side {
  overflow: auto;
}

.review-editor {
  padding: 16px;
}

.review-panel-title {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  background: #fff;
  border-bottom: 1px solid #f3f4f6;
}

.review-question-row {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
}

.review-question-row.active {
  background: #eff6ff;
}

.review-question-row.rejected {
  opacity: 0.55;
}

.review-material {
  padding: 10px;
  margin: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.review-material.active {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgb(22 119 255 / 8%);
}

.review-answer {
  padding: 10px;
  margin: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.review-answer.active {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgb(22 163 74 / 8%);
}

.review-source {
  padding: 12px;
  margin: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  background: #f9fafb;
  border-radius: 8px;
}

@media (max-width: 1200px) {
  .review-workbench {
    grid-template-columns: 1fr;
  }
}
</style>
