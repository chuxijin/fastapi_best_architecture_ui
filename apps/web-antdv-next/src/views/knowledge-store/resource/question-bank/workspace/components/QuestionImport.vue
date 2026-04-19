<script setup lang="ts">
import type { UploadFile, UploadProps } from 'ant-design-vue';
import type {
  BatchImportQuestionResult,
  ExcelImportResult,
  PipelineEvent,
  PipelineResult,
  QuestionImportRow,
} from '#/api';
import { ref, computed, toRaw } from 'vue';

import { VbenButton } from '@vben/common-ui';
import {
  MaterialSymbolsUploadFileOutline,
  MaterialSymbolsDescriptionOutline,
} from '@vben/icons';

import {
  Alert,
  Tabs,
  TabPane,
  Upload as AUpload,
  Card,
  message,
  Table,
  Progress,
  Steps,
  Step,
  Drawer,
  Modal,
  Input,
  Select,
  Tag,
} from 'ant-design-vue';

import {
  batchImportQuestionsApi,
  downloadImportTemplateApi,
  downloadPipelineFileApi,
  importExcelQuestionsApi,
  pipelineParseApi,
} from '#/api';

import { VxeTable, VxeColumn } from 'vxe-table';
import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css';

interface Props {
  bankId: number;
}

const props = defineProps<Props>();

// ============ 通用状态 ============
const activeImportTab = ref('pipeline');
const importResult = ref<BatchImportQuestionResult | null>(null);
const showResultDrawer = ref(false);

// ============ Tab 1: 智能导入流水线 ============
const pipelineFileList = ref<UploadFile[]>([]);
const pipelineRunning = ref(false);
const pipelineStage = ref(''); // 当前阶段
const pipelineMessage = ref(''); // 当前阶段消息
const pipelineProgress = ref(0); // AI 批次进度百分比
const pipelineLogs = ref<{ message: string; type: string }[]>([]);
const pipelineResult = ref<PipelineResult | null>(null);
const pipelineError = ref('');

// 阶段映射为 Steps 步骤
const stageStepMap: Record<string, number> = {
  parse: 0,
  parse_done: 0,
  segment: 1,
  segment_done: 1,
  ai_extract: 2,
  ai_extract_done: 2,
  excel: 3,
};
const currentStep = computed(() => {
  if (pipelineResult.value) return 4; // 全部完成
  return stageStepMap[pipelineStage.value] ?? -1;
});

const beforePipelineUpload: UploadProps['beforeUpload'] = (file) => {
  pipelineFileList.value = [file as any];
  return false;
};

function resetPipeline() {
  pipelineRunning.value = false;
  pipelineStage.value = '';
  pipelineMessage.value = '';
  pipelineProgress.value = 0;
  pipelineLogs.value = [];
  pipelineResult.value = null;
  pipelineError.value = '';
}

async function handleRunPipeline() {
  if (pipelineFileList.value.length === 0) {
    message.error('请先选择文件');
    return;
  }

  resetPipeline();
  pipelineRunning.value = true;

  // 脱去 Ant Design Vue 包装和 Vue Proxy，重建纯净 File 对象
  const rawItem = toRaw(pipelineFileList.value[0]) as any;
  const originFile = toRaw(rawItem.originFileObj || rawItem);
  const cleanFile = new File([originFile], originFile.name || 'document.pdf', {
    type: originFile.type || 'application/pdf',
  });

  try {
    await pipelineParseApi(cleanFile, props.bankId, (event: PipelineEvent) => {
      if (event.type === 'stage') {
        pipelineStage.value = event.stage;
        pipelineMessage.value = event.message || '';
        pipelineLogs.value.push({ message: event.message, type: 'stage' });
      } else if (event.type === 'progress') {
        const pct = Math.round(
          (event.batch_index / event.total_batches) * 100,
        );
        pipelineProgress.value = pct;
        pipelineMessage.value = `AI 提取中 ${event.batch_index}/${event.total_batches} 批，已识别 ${event.total_questions_count} 题`;
      } else if (event.type === 'done') {
        pipelineResult.value = {
          excel_url: event.excel_url,
          md_url: event.md_url,
          questions_count: event.questions_count,
          warnings_count: event.warnings_count,
          md_length: event.md_length,
          segments_count: event.segments_count,
          questions: event.questions,
        };
        pipelineLogs.value.push({
          message: `✅ 完成！共 ${event.questions_count} 题，${event.warnings_count} 条告警`,
          type: 'done',
        });
      } else if (event.type === 'error') {
        pipelineError.value = event.message;
        pipelineLogs.value.push({
          message: `❌ ${event.message}`,
          type: 'error',
        });
      }
    });
  } catch (e: any) {
    pipelineError.value = e.message || '流水线执行失败';
  } finally {
    pipelineRunning.value = false;
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
  message.success('文件已开始下载');
}

async function handleDownloadExcel() {
  if (!pipelineResult.value) return;
  try {
    const urlPath = `/api/v1/qbank/parse/pipeline/download?filename=${encodeURIComponent(pipelineResult.value.excel_url)}`;
    const blob = await downloadPipelineFileApi(urlPath);
    const filename = pipelineResult.value.excel_url.split('/').pop() || 'export.xlsx';
    triggerBlobDownload(blob, filename);
  } catch {
    message.error('下载失败');
  }
}

const isPipelineImporting = ref(false);
const isPreviewVisible = ref(false);

function showPipelinePreview() {
  isPreviewVisible.value = true;
}

async function importPipelineQuestions() {
  if (!pipelineResult.value?.questions?.length) return;
  isPipelineImporting.value = true;
  const hide = message.loading('正在直接导入...', 0);
  try {
    const formattedQuestions: QuestionImportRow[] = pipelineResult.value.questions.map((q: any) => ({
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
      一级目录: q.chapter_name || q.一级目录,
      材料编号: q.material_id || q.材料编号 || '',
    }));

    const result = await batchImportQuestionsApi({
      bank_id: props.bankId,
      questions: formattedQuestions,
    });
    hide();
    importResult.value = result;
    showResultDrawer.value = true;
    if (result.fail_count === 0) {
      message.success(`智能导入完成，成功 ${result.success_count} 道题目`);
      isPreviewVisible.value = false;
    }
  } catch (e: any) {
    hide();
    message.error('直接导入失败: ' + e.message);
  } finally {
    isPipelineImporting.value = false;
  }
}

async function handleDownloadMd() {
  if (!pipelineResult.value?.md_url) return;
  try {
    const blob = await downloadPipelineFileApi(pipelineResult.value.md_url);
    triggerBlobDownload(blob, 'export.md');
  } catch {
    message.error('下载失败');
  }
}

// ============ Tab 2: Excel 导入 ============
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
      type: originFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = await importExcelQuestionsApi(cleanFile, props.bankId);
    hide();
    excelResult.value = result;
    message.success(
      `导入完成！成功 ${result.success_count} 题，去重 ${result.dedup_count || 0} 题`,
    );
    excelFileList.value = [];
  } catch (e: any) {
    hide();
    message.error('Excel 导入失败: ' + e.message);
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
      一级目录: q.chapter_name || q.一级目录,
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
  } catch (e: any) {
    hide();
    message.error('JSON 导入失败: ' + e.message);
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
        <!-- ============ 智能导入流水线 ============ -->
        <TabPane key="pipeline" tab="🤖 智能导入">
          <div
            class="rounded-b-lg border border-t-0 border-gray-100 bg-white p-6"
          >
            <Alert class="mb-6" show-icon type="info">
              <template #message>
                上传 PDF 或 MD 文件 → 自动分段 + AI 提取 → 生成带校验的
                Excel，人工审核后再导入
              </template>
            </Alert>

            <!-- 文件选择 -->
            <div class="import-step">
              <div class="mb-3 text-sm font-medium text-gray-600">
                选择 PDF 或 Markdown 文件：
              </div>
              <div class="flex items-center gap-4">
                <AUpload
                  :file-list="pipelineFileList"
                  :before-upload="beforePipelineUpload"
                  accept=".pdf,.md"
                  :max-count="1"
                >
                  <VbenButton>
                    <MaterialSymbolsDescriptionOutline class="mr-1 size-4" />
                    选择文件
                  </VbenButton>
                </AUpload>
                <VbenButton
                  type="primary"
                  :loading="pipelineRunning"
                  :disabled="pipelineFileList.length === 0"
                  @click="handleRunPipeline"
                >
                  🚀 开始智能导入
                </VbenButton>
              </div>
            </div>

            <!-- 流水线进度 -->
            <div
              v-if="pipelineRunning || pipelineResult || pipelineError"
              class="mt-6 rounded-lg border bg-gray-50 p-5"
            >
              <!-- Steps 进度条 -->
              <Steps :current="currentStep" size="small" class="mb-6">
                <Step title="解析文档" />
                <Step title="正则分段" />
                <Step title="AI 提取" />
                <Step title="生成 Excel" />
                <Step title="完成" />
              </Steps>

              <!-- 当前状态消息 -->
              <div
                v-if="pipelineMessage && !pipelineResult"
                class="mb-4 flex items-center gap-2 text-sm text-gray-600"
              >
                <span
                  class="inline-block size-2 animate-pulse rounded-full bg-blue-500"
                />
                {{ pipelineMessage }}
              </div>

              <!-- AI 提取进度条 -->
              <div
                v-if="
                  pipelineStage === 'ai_extract' ||
                  pipelineStage === 'ai_extract_done'
                "
                class="mb-4"
              >
                <Progress
                  :percent="pipelineProgress"
                  :status="pipelineProgress >= 100 ? 'success' : 'active'"
                  stroke-color="#1677ff"
                />
              </div>

              <!-- 错误 -->
              <Alert
                v-if="pipelineError"
                :message="pipelineError"
                type="error"
                show-icon
                class="mb-4"
              />

              <!-- 完成结果 -->
              <div v-if="pipelineResult" class="space-y-4">
                <Alert type="success" show-icon>
                  <template #message>
                    流水线执行完成！共识别
                    <strong>{{ pipelineResult.questions_count }}</strong>
                    道题目
                    <span v-if="pipelineResult.warnings_count > 0">
                      ，其中
                      <Tag color="orange">
                        {{ pipelineResult.warnings_count }} 条告警
                      </Tag>
                      已在 Excel 中标红
                    </span>
                  </template>
                </Alert>

                <div
                  class="flex items-center justify-between rounded-lg border bg-white p-4"
                >
                  <div class="space-y-1 text-sm text-gray-600">
                    <div>📄 Markdown 长度：{{ pipelineResult.md_length }} 字符</div>
                    <div>🔢 正则分段数：{{ pipelineResult.segments_count }} 段</div>
                    <div>
                      📊 识别题数：{{ pipelineResult.questions_count }} 题
                    </div>
                    <div>
                      ⚠️ 校验告警：{{ pipelineResult.warnings_count }} 条
                    </div>
                  </div>
                  <div class="flex flex-col gap-2">
                    <VbenButton
                      type="primary"
                      @click="showPipelinePreview"
                      class="!bg-green-600 !hover:bg-green-500 text-white"
                    >
                      👀 在线审核与直接导入
                    </VbenButton>
                    <VbenButton @click="handleDownloadExcel">
                      ⬇️ 下载 Excel 备份或修改
                    </VbenButton>
                    <VbenButton v-if="pipelineResult.md_url" @click="handleDownloadMd">
                      📄 下载过程 Markdown
                    </VbenButton>
                    <VbenButton @click="resetPipeline">重新导入</VbenButton>
                  </div>
                </div>

                <Alert type="info" show-icon>
                  <template #message>
                    您可以直接点击【在线审核与直接导入】直接入库，若需复杂修改可下载 Excel 编辑后再上传。
                  </template>
                </Alert>
              </div>
            </div>
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
                    ，去重复用 {{ excelResult.dedup_count }} 题
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

    <!-- 智能导入预览 -->
    <Modal
      v-model:open="isPreviewVisible"
      title="在线审核题目"
      :width="1400"
      :style="{ top: '20px' }"
      :footer="null"
      :destroyOnClose="true"
    >
      <div v-if="pipelineResult?.questions" class="flex flex-col space-y-4" style="height: 85vh;">
        <Alert
          message="支持直接在下方表格中修改题干、题型、答案及解析！修改无误后点击下方按钮直接入库。对于复杂的选项调整，建议仍使用 Excel 下载修改。"
          type="info"
          show-icon
        />
        <VxeTable
          border
          show-overflow
          :data="pipelineResult.questions"
          height="100%"
          :edit-config="{ trigger: 'dblclick', mode: 'cell' }"
          :mouse-config="{ selected: true }"
          :keyboard-config="{ isArrow: true, isDel: true, isEnter: true, isTab: true, isEdit: true }"
          size="small"
        >
          <VxeColumn type="seq" width="60" title="序号"></VxeColumn>
          
          <VxeColumn field="type" title="题型" width="100" :edit-render="{}">
            <template #edit="{ row }">
              <Select v-model:value="row.type" style="width: 100%" size="small">
                <Select.Option value="single">单选</Select.Option>
                <Select.Option value="multiple">多选</Select.Option>
                <Select.Option value="judgement">判断</Select.Option>
                <Select.Option value="fill">填空</Select.Option>
                <Select.Option value="shortAnswer">简答</Select.Option>
              </Select>
            </template>
            <template #default="{ row }">
              {{ row.type === 'single' ? '单选' : row.type === 'multiple' ? '多选' : row.type === 'judgement' ? '判断' : row.type === 'fill' ? '填空' : row.type === 'shortAnswer' ? '简答' : row.type }}
            </template>
          </VxeColumn>

          <VxeColumn field="stem" title="题干" width="300" :edit-render="{}">
            <template #edit="{ row }">
              <Input.TextArea
                v-model:value="row.stem"
                :autoSize="{ minRows: 2, maxRows: 6 }"
              />
            </template>
          </VxeColumn>

          <VxeColumn field="answer_data.correct" title="答案" width="120" :edit-render="{}">
            <template #edit="{ row }">
                <Input v-if="row.answer_data" v-model:value="row.answer_data.correct" size="small" />
                <Input v-else :value="''" @change="(e: any) => (row.answer_data = { correct: e.target.value })" size="small" />
            </template>
            <template #default="{ row }">
                {{ row.answer_data?.correct || '' }}
            </template>
          </VxeColumn>

          <VxeColumn field="analysis_content" title="解析" min-width="200" :edit-render="{}">
            <template #edit="{ row }">
              <Input.TextArea
                v-model:value="row.analysis_content"
                :autoSize="{ minRows: 2, maxRows: 6 }"
              />
            </template>
          </VxeColumn>

          <VxeColumn field="material_id" title="材料编号" width="100" :edit-render="{}">
            <template #edit="{ row }">
              <Input v-model:value="row.material_id" size="small" placeholder="填编号" />
            </template>
            <template #default="{ row }">
              {{ row.material_id || '' }}
            </template>
          </VxeColumn>

        </VxeTable>
        <div class="flex justify-end gap-2 mt-2 border-t pt-4">
          <VbenButton @click="isPreviewVisible = false">取消修改</VbenButton>
          <VbenButton
            type="primary"
            class="!bg-green-600 !hover:bg-green-500 text-white"
            :loading="isPipelineImporting"
            @click="importPipelineQuestions"
          >
            无误，直接导入生效
          </VbenButton>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.import-step {
  padding: 20px;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
}
</style>
