<script setup lang="ts">
import type { UploadFile, UploadProps } from 'ant-design-vue';
import type { BatchImportQuestionResult, QuestionImportRow } from '#/api';
import { ref } from 'vue';

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
  Select as ASelect,
  Form as AForm,
  FormItem as AFormItem,
  Modal as AModal,
  Textarea as ATextarea,
  Input as AInput,
  Popconfirm as APopconfirm,
  InputNumber as AInputNumber,
} from 'ant-design-vue';

import {
  batchImportQuestionsApi,
  smartExtractPdfApi,
  smartCommitApi,
  parsePdfToMdApi,
  saveSegmentsApi,
} from '#/api';
import type { SmartExtractResult } from '#/api';

interface Props {
  bankId: number;
}

const props = defineProps<Props>();

// --- 通用配置 (章节选择/输入) ---
const targetChapter = ref<string | undefined>(undefined);
const isStreamingProgress = ref(false); // 是否处于流式生成状态
// 目前后端暂无独立章节列表接口，可以先由用户手动输入，
// 后续如果有了 /api/v1/question-bank/chapters，可以动态加载 options
const chapterOptions = ref<{ value: string; label: string }[]>([]);

// --- 状态管理 ---
const activeImportTab = ref('pdf');
const importResult = ref<BatchImportQuestionResult | null>(null);
const showResultDrawer = ref(false);

// CSV
const csvFileList = ref<UploadFile[]>([]);
const csvUploading = ref(false);

// JSON
const jsonFileList = ref<UploadFile[]>([]);
const jsonUploading = ref(false);

// PDF/MD
const pdfFileList = ref<UploadFile[]>([]);
const mdFileList = ref<UploadFile[]>([]);
const extracting = ref(false);
const pdfCommitting = ref(false);
const smartExtractData = ref<SmartExtractResult | null>(null);
const parsedMdResult = ref(''); // 存储 PDF 解析出的 Markdown结果

// --- 切片管理 ---
interface MdSegment {
  name: string;
  startLine: number;
  endLine: number;
}
const segments = ref<MdSegment[]>([]);
const addSegment = () => {
  const lastEnd =
    segments.value.length > 0
      ? segments.value[segments.value.length - 1]?.endLine || 0
      : 0;
  segments.value.push({
    name: `未命名分片_${segments.value.length + 1}`,
    startLine: lastEnd + 1,
    endLine: lastEnd + 50, // 默认给50行
  });
};
const removeSegment = (index: number) => segments.value.splice(index, 1);

// 获取分片具体文本
const getSegmentContent = (seg: MdSegment) => {
  const lines = parsedMdResult.value.split('\n');
  return lines.slice(seg.startLine - 1, seg.endLine).join('\n');
};

// 将分片发送到 MD 导入页
function sendSegmentToExtraction(seg: MdSegment) {
  const content = getSegmentContent(seg);
  // 模拟上传一个 .md 文件到 mdFileList
  const blob = new Blob([content], { type: 'text/markdown' });
  const file = new File([blob], `${seg.name}.md`, { type: 'text/markdown' });
  mdFileList.value = [file as any];
  activeImportTab.value = 'md';
  message.success(
    `已将分片 [${seg.name}] 发送至 MD 导入页，点击“解析 MD”即可开始抽取。`,
  );
}

// 下载分片到本地
function downloadSegment(seg: MdSegment) {
  const content = getSegmentContent(seg);
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${seg.name}.md`;
  a.click();
  URL.revokeObjectURL(url);
  message.success(`分片 [${seg.name}] 已开始下载`);
}

// 批量保存分片到服务器
const savingToServer = ref(false);
async function handleSaveSegmentsToServer() {
  if (segments.value.length === 0) {
    message.warning('请先添加并定义分片');
    return;
  }
  savingToServer.value = true;
  const hide = message.loading('正在同步分片到服务器...', 0);
  try {
    const data = segments.value.map((seg) => ({
      name: seg.name,
      content: getSegmentContent(seg),
    }));
    const res = await saveSegmentsApi(props.bankId, data);
    hide();
    message.success(`成功保存 ${res.count} 个分片至服务器目录: ${res.path}`);
  } catch (e: any) {
    hide();
    message.error('保存失败: ' + e.message);
  } finally {
    savingToServer.value = false;
  }
}

// --- 文件选择校验 ---
const beforePdfUpload: UploadProps['beforeUpload'] = (file) => {
  pdfFileList.value = [file as any];
  return false;
};
const beforeMdUpload: UploadProps['beforeUpload'] = (file) => {
  mdFileList.value = [file as any];
  return false;
};
const beforeJsonUpload: UploadProps['beforeUpload'] = (file) => {
  jsonFileList.value = [file as any];
  return false;
};
const beforeCsvUpload: UploadProps['beforeUpload'] = (file) => {
  csvFileList.value = [file as any];
  return false;
};

// --- 重大逻辑实现 ---

/**
 * AI 智能识别 (处理 PDF 或 MD)
 */
async function handleExtract(type: 'pdf' | 'md') {
  const list = type === 'pdf' ? pdfFileList : mdFileList;
  if (list.value.length === 0) {
    message.error('请先选择文件');
    return;
  }

  extracting.value = true;
  smartExtractData.value = null;
  const hideLoading = message.loading('AI 正在智能解析试卷中...', 0);

  try {
    const file = list.value[0] as any as File;

    if (type === 'pdf') {
      // --- 第一阶段：仅 PDF 转 Markdown ---
      const result = await parsePdfToMdApi(file);
      parsedMdResult.value = result.markdown;
      message.success(
        'PDF 解析 Markdown 成功！你可以复制下方内容到 MD 导入标签页进行题目提取。',
      );
      hideLoading();
      extracting.value = false;
    } else {
      // --- 第二阶段：Markdown 提取题目 (支持流式) ---
      isStreamingProgress.value = true;
      smartExtractData.value = {
        materials: [],
        questions: [],
        questions_count: 0,
        materials_count: 0,
      } as any;

      // 为了同时支持普通返回和未来马上要加的 SSE，这里做兼容
      // 理论上我们会改为用原生 fetch 调取后端 SSE，如果还是用旧接口则退化为一次性返回
      hideLoading();
      message.info('AI 开始流式抽取题目，请稍候...');

      // 此处我们将使用原生 Fetch 来实现 SSE 逐题渲染
      const token =
        localStorage.getItem('access_token') ||
        sessionStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('bank_id', props.bankId.toString());
      formData.append('file', file);

      const response = await fetch('/api/v1/qbank/parse/smart-extract-stream', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        // Fallback to normal if stream endpoint doesn't exist yet
        const result = await smartExtractPdfApi(props.bankId, file);
        if (targetChapter.value) {
          result.questions.forEach(
            (q: any) => (q.chapter_name = targetChapter.value),
          );
        }
        smartExtractData.value = result;
        extracting.value = false;
        isStreamingProgress.value = false;
        message.success(`解析完成！共发现题数: ${result.questions_count}`);
        return;
      }

      // --- 核心流式读取逻辑 ---
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // 按行切割 JSON (NDJSON)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最后一行可能不完整，保留到 buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            // 兼容 SSE 格式 'data: {...}'
            const dataStr = line.startsWith('data: ')
              ? line.replace('data: ', '')
              : line;
            if (dataStr === '[DONE]' || dataStr.includes('event: end'))
              continue;

            const parsedChunk = JSON.parse(dataStr);
            const chunkQuestions = parsedChunk.questions || [];
            if (chunkQuestions.length > 0) {
              chunkQuestions.forEach((q: any) => {
                q._isEditing = false;
                if (targetChapter.value) q.chapter_name = targetChapter.value;
                smartExtractData.value!.questions.push(q);
              });
              smartExtractData.value!.questions_count =
                smartExtractData.value!.questions.length;
            }
          } catch (e) {
            console.warn('流式解析 JSON 行失败', e, line);
          }
        }
      }
      extracting.value = false;
      isStreamingProgress.value = false;
      message.success(
        `解析抽取完成！共捕获 ${smartExtractData.value!.questions.length} 道题目`,
      );
    }
  } catch (error: any) {
    extracting.value = false;
    isStreamingProgress.value = false;
    hideLoading();
    message.error(error.message || 'AI 智能解析失败');
  } finally {
    extracting.value = false;
  }
}

/**
 * PDF/MD 识别后的“确认入库”
 */
async function handleSmartCommit() {
  if (!smartExtractData.value) return;
  pdfCommitting.value = true;
  const hide = message.loading('正在提交题库数据...', 0);
  try {
    // 提交前再次强制覆盖章节（万一用户在中途修改了 targetChapter）
    if (targetChapter.value) {
      smartExtractData.value.questions.forEach((q: any) => {
        q.chapter_name = targetChapter.value;
      });
    }
    await smartCommitApi(
      props.bankId,
      smartExtractData.value.materials,
      smartExtractData.value.questions,
    );
    hide();
    message.success('全部题目提交入库成功！');
    smartExtractData.value = null;
    pdfFileList.value = [];
    mdFileList.value = [];
  } catch (error: any) {
    hide();
    message.error(error.message || '提交入库失败');
  } finally {
    pdfCommitting.value = false;
  }
}

/**
 * 离线 JSON 直接导入
 */
async function handleJsonImport() {
  if (jsonFileList.value.length === 0) return;
  jsonUploading.value = true;
  const hide = message.loading('正在解析 JSON 文件...', 0);
  try {
    const file = jsonFileList.value[0] as any;
    const text = await file.text();
    const data = JSON.parse(text);
    const questions = data.questions || [];

    // 格式映射与章节覆盖
    const formattedQuestions = questions.map((q: any) => {
      return {
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
        一级目录: targetChapter.value || q.chapter_name || q.一级目录,
      };
    });

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

/**
 * 标准 CSV 导入
 */
async function handleCsvImport() {
  if (csvFileList.value.length === 0) return;
  csvUploading.value = true;
  const hide = message.loading('正在解析 CSV 文件...', 0);
  try {
    const file = csvFileList.value[0] as any;
    const text = await file.text();

    // 简单的 CSV 解析器（支持章节覆盖）
    const lines = text.split('\n').filter((l: string) => l.trim());
    const parseLine = (line: string) => {
      const parts: string[] = [];
      let cur = '';
      let quote = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') quote = !quote;
        else if (c === ',' && !quote) {
          parts.push(cur.trim());
          cur = '';
        } else cur += c;
      }
      parts.push(cur.trim());
      return parts;
    };

    const headers = parseLine(lines[0]);
    const questions: QuestionImportRow[] = lines
      .slice(1)
      .map((line: string) => {
        const v = parseLine(line);
        const getV = (h: string) => {
          const i = headers.indexOf(h);
          return i !== -1 ? v[i] : '';
        };
        return {
          题目: getV('题目') || getV('题干'),
          题型: getV('题型') || getV('类型'),
          分数: Number.parseInt(getV('分数') || '1'),
          难度: getV('难度') || '中等',
          选项A: getV('选项A'),
          选项B: getV('选项B'),
          选项C: getV('选项C'),
          选项D: getV('选项D'),
          答案: getV('答案') || getV('答'),
          解析: getV('解析') || '',
          一级目录: targetChapter.value || getV('一级目录'),
          二级目录: targetChapter.value ? null : getV('二级目录'),
        };
      });

    const result = await batchImportQuestionsApi({
      bank_id: props.bankId,
      questions,
    });
    hide();
    importResult.value = result;
    showResultDrawer.value = true;
    if (result.fail_count === 0) csvFileList.value = [];
  } catch (e: any) {
    hide();
    message.error('CSV 导入失败: ' + e.message);
  } finally {
    csvUploading.value = false;
  }
}

// 表格列定义
// const smartReviewColumns = [
//   { title: '原题号', dataIndex: 'sort_order', width: 80 },
//   { title: '题型', dataIndex: 'type', width: 80 },
//   { title: '归属章节', dataIndex: 'chapter_name', width: 140 },
//   { title: '题干内容', dataIndex: 'stem', ellipsis: true },
//   { title: '预测难度', dataIndex: 'difficulty', width: 80 },
//   { title: '操作', dataIndex: 'action', width: 130 }
// ];

// 删除原本用于单题深度修改的变量
// const editModalVisible = ref(false);
// const editingQuestion = ref<any>({});
// const editingQuestionStr = ref('');
// const editingIndex = ref<number>(-1);

// function openEditModal(record: any, index: number) {
//   editingQuestion.value = JSON.parse(JSON.stringify(record));
//   editingQuestionStr.value = JSON.stringify(record, null, 2);
//   editingIndex.value = index;
//   editModalVisible.value = true;
// }

// watch(editingQuestion, (newVal) => {
//   editingQuestionStr.value = JSON.stringify(newVal, null, 2);
// }, { deep: true });

// function handleSaveEdit() {
//   try {
//     const parsed = JSON.parse(editingQuestionStr.value);
//     if (smartExtractData.value && editingIndex.value > -1) {
//       smartExtractData.value.questions[editingIndex.value] = parsed;
//     }
//     editModalVisible.value = false;
//     message.success('已应用所作的修改');
//   } catch (e: any) {
//     message.error('数据结构格式有误，无法保存：' + e.message);
//   }
// }

function removeQuestion(index: number) {
  if (smartExtractData.value) {
    smartExtractData.value.questions.splice(index, 1);
    message.success('已从入库队列剔除该题');
  }
}

// --- 批量修改审核题目 ---
const batchEditVisible = ref(false);
const batchEditForm = ref({
  type: undefined,
  difficulty: undefined,
  chapter_name: undefined,
  score: undefined,
});

function handleBatchEdit() {
  if (!smartExtractData.value) return;
  const { type, difficulty, chapter_name, score } = batchEditForm.value;
  const count = smartExtractData.value.questions.length;
  smartExtractData.value.questions.forEach((q: any) => {
    if (type !== undefined) q.type = type;
    if (difficulty !== undefined) q.difficulty = difficulty;
    if (chapter_name !== undefined && chapter_name !== '')
      q.chapter_name = chapter_name;
    if (score !== undefined) q.score = score;
  });
  message.success(`已应用批量配置到 ${count} 道题目`);
  batchEditVisible.value = false;
  batchEditForm.value = {
    type: undefined,
    difficulty: undefined,
    chapter_name: undefined,
    score: undefined,
  };
}

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
    <Card title="题目批量中心">
      <!-- 全局章节配置 -->
      <div class="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-5">
        <h4
          class="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800"
        >
          <span class="h-4 w-1 rounded-full bg-blue-500"></span>
          导入配置
        </h4>
        <AForm layout="vertical">
          <AFormItem
            label="目标章节 (设置后将强制覆盖文件内的章节)"
            style="margin-bottom: 0"
          >
            <ASelect
              v-model:value="targetChapter"
              show-search
              allow-clear
              mode="tags"
              :max-tag-count="1"
              placeholder="可直接输入新章节名称或选择已有章节"
              :options="chapterOptions"
              class="w-full max-w-md"
              :getPopupContainer="(triggerNode) => triggerNode.parentNode"
            />
          </AFormItem>
        </AForm>
      </div>

      <Tabs v-model:active-key="activeImportTab" type="card">
        <!-- PDF 识别 -->
        <TabPane key="pdf" tab="PDF 识别">
          <div
            class="rounded-b-lg border border-t-0 border-gray-100 bg-white p-4"
          >
            <Alert
              message="AI 智能解析 PDF 文档并抽取结构化试题。"
              type="info"
              show-icon
              class="mb-6"
            />
            <div class="import-step">
              <div class="mb-4 text-sm font-medium text-gray-600">
                第一步：上传 PDF 文件
              </div>
              <AUpload
                :file-list="pdfFileList"
                :before-upload="beforePdfUpload"
                accept=".pdf"
                :max-count="1"
              >
                <VbenButton
                  ><MaterialSymbolsDescriptionOutline class="mr-1 size-4" />
                  选择 PDF</VbenButton
                >
              </AUpload>
            </div>
            <div class="mt-8 flex justify-end">
              <VbenButton
                type="primary"
                :loading="extracting"
                :disabled="pdfFileList.length === 0"
                @click="handleExtract('pdf')"
              >
                开始解析预览 Markdown
              </VbenButton>
            </div>
            <!-- 解析结果预览与快速切片区 -->
            <div v-if="parsedMdResult" class="mt-6 border-t pt-6">
              <div class="mb-4 flex items-center justify-between">
                <h4 class="text-base font-bold text-gray-800">
                  Markdown 预览与切片管理
                </h4>
                <div class="flex gap-2">
                  <VbenButton
                    :loading="savingToServer"
                    @click="handleSaveSegmentsToServer"
                    >保存至服务器</VbenButton
                  >
                  <VbenButton type="primary" @click="addSegment"
                    >添加新分片</VbenButton
                  >
                </div>
              </div>

              <div class="grid grid-cols-12 gap-6">
                <!-- 左侧：带行号的预览 -->
                <div class="col-span-8">
                  <div class="mb-2 text-xs font-semibold text-gray-500">
                    内容预览（含行号）：
                  </div>
                  <div
                    class="max-h-[500px] overflow-y-auto rounded border bg-gray-900 p-0 text-[12px] leading-relaxed text-gray-300"
                  >
                    <table class="w-full border-collapse">
                      <tr
                        v-for="(line, idx) in parsedMdResult.split('\n')"
                        :key="idx"
                        class="hover:bg-gray-800"
                      >
                        <td
                          class="w-12 select-none border-r border-gray-700 bg-gray-800 pr-2 text-right text-gray-500"
                        >
                          {{ idx + 1 }}
                        </td>
                        <td class="whitespace-pre-wrap pl-3 font-mono">
                          {{ line }}
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>

                <!-- 右侧：切片命名与范围设置 -->
                <div class="col-span-4">
                  <div class="mb-2 text-xs font-semibold text-gray-500">
                    切片配置：
                  </div>
                  <div
                    v-if="segments.length === 0"
                    class="flex h-32 flex-col items-center justify-center rounded border border-dashed bg-gray-50 text-gray-400"
                  >
                    <p>暂无分片，点击上方按钮添加</p>
                  </div>
                  <div v-else class="space-y-3">
                    <div
                      v-for="(seg, index) in segments"
                      :key="index"
                      class="rounded-lg border bg-white p-3 shadow-sm"
                    >
                      <div class="mb-2 flex items-center justify-between">
                        <input
                          v-model="seg.name"
                          class="w-2/3 border-b border-transparent font-bold text-blue-600 outline-none hover:border-blue-300 focus:border-blue-500"
                          placeholder="分片名称"
                        />
                        <VbenButton
                          type="link"
                          danger
                          @click="removeSegment(index)"
                          >删除</VbenButton
                        >
                      </div>
                      <div class="flex items-center gap-2 text-xs">
                        <span>行号范围:</span>
                        <input
                          v-model.number="seg.startLine"
                          type="number"
                          class="w-16 rounded border px-1"
                        />
                        <span>至</span>
                        <input
                          v-model.number="seg.endLine"
                          type="number"
                          class="w-16 rounded border px-1"
                        />
                      </div>
                      <div class="mt-3 flex justify-end gap-2">
                        <VbenButton ghost @click="downloadSegment(seg)"
                          >下载 MD</VbenButton
                        >
                        <VbenButton
                          type="primary"
                          ghost
                          @click="sendSegmentToExtraction(seg)"
                          >提取题目</VbenButton
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPane>

        <!-- JSON 导入 -->
        <TabPane key="json" tab="JSON 导入">
          <div
            class="rounded-b-lg border border-t-0 border-gray-100 bg-white p-4"
          >
            <Alert
              message="支持符合 JSON Schema 格式的系统导出文件直接回灌。"
              type="info"
              show-icon
              class="mb-6"
            />
            <div class="import-step">
              <AUpload
                :file-list="jsonFileList"
                :before-upload="beforeJsonUpload"
                accept=".json"
                :max-count="1"
              >
                <VbenButton
                  ><MaterialSymbolsDescriptionOutline class="mr-1 size-4" />
                  选择 JSON 文件</VbenButton
                >
              </AUpload>
            </div>
            <div class="mt-8 flex justify-end">
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

        <!-- MD 导入 -->
        <TabPane key="md" tab="MD 导入">
          <div
            class="rounded-b-lg border border-t-0 border-gray-100 bg-white p-4"
          >
            <Alert
              message="适合已具备 Markdown 格式题目的文本直接分析出题。"
              type="info"
              show-icon
              class="mb-6"
            />
            <div class="import-step">
              <AUpload
                :file-list="mdFileList"
                :before-upload="beforeMdUpload"
                accept=".md"
                :max-count="1"
              >
                <VbenButton
                  ><MaterialSymbolsDescriptionOutline class="mr-1 size-4" />
                  选择 MD 文件</VbenButton
                >
              </AUpload>
            </div>
            <div class="mt-8 flex justify-end">
              <VbenButton
                type="primary"
                :loading="extracting"
                :disabled="mdFileList.length === 0"
                @click="handleExtract('md')"
              >
                解析 MD 开始出题
              </VbenButton>
            </div>
          </div>
        </TabPane>

        <!-- CSV 导入 -->
        <TabPane key="csv" tab="CSV 导入">
          <div
            class="rounded-b-lg border border-t-0 border-gray-100 bg-white p-4"
          >
            <Alert
              message="标准模板导入，性能最快，适合大批量存量迁移。"
              type="info"
              show-icon
              class="mb-6"
            />
            <div class="import-step">
              <AUpload
                :file-list="csvFileList"
                :before-upload="beforeCsvUpload"
                accept=".csv"
                :max-count="1"
              >
                <VbenButton
                  ><MaterialSymbolsUploadFileOutline class="mr-1 size-4" /> 选择
                  CSV 文件</VbenButton
                >
              </AUpload>
            </div>
            <div class="mt-8 flex justify-end">
              <VbenButton
                type="primary"
                :loading="csvUploading"
                :disabled="csvFileList.length === 0"
                @click="handleCsvImport"
              >
                开始 CSV 导入
              </VbenButton>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 预览与修改区域 (直接内嵌在标签页下方) -->
    <div v-if="smartExtractData" class="mt-4">
      <Card title="🚀 AI 抽取数据确认 (所见即所得，随时可修改)">
        <template #extra>
          <VbenButton type="dashed" size="sm" @click="batchEditVisible = true"
            >📦 批量修改配置</VbenButton
          >
        </template>

        <div
          v-if="smartExtractData.questions.length === 0 && isStreamingProgress"
          class="py-10 text-center text-gray-500"
        >
          📇 AI 正在阅读和分解材料，即将输出试题流...
        </div>

        <div class="max-h-[700px] space-y-4 overflow-y-auto px-1 pb-4">
          <div
            v-for="(q, index) in smartExtractData.questions"
            :key="index"
            class="rounded-lg border bg-white p-5 transition-all hover:shadow-md"
          >
            <!-- 只读视图（默认）-->
            <div
              v-if="!q._isEditing"
              @dblclick="q._isEditing = true"
              class="group cursor-pointer"
            >
              <!-- 头部：序号与详情栏 -->
              <div class="mb-3 flex items-start justify-between border-b pb-2">
                <div class="mt-1 text-sm font-bold text-gray-700">
                  <span
                    class="mr-2 inline-block rounded bg-blue-100 px-2 text-xs font-bold text-blue-700"
                    ># {{ q.sort_order || index + 1 }}</span
                  >
                  <span class="mr-3">{{ q.chapter_name || '未分类章节' }}</span>
                  <VbenButton
                    type="link"
                    size="sm"
                    class="opacity-0 transition-opacity group-hover:opacity-100"
                    @click.stop="q._isEditing = true"
                    >✏️ 双击修改该题</VbenButton
                  >
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-400"
                    >{{ q.type }}</span
                  >
                  <span
                    class="rounded bg-yellow-50 px-2 py-0.5 text-xs text-yellow-600"
                    >{{ q.difficulty }}</span
                  >
                  <span
                    class="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600"
                    >{{ q.score }}分</span
                  >
                  <span class="mx-2 text-gray-300">|</span>
                  <APopconfirm
                    title="确认剔除此题吗?"
                    @confirm="removeQuestion(index)"
                  >
                    <VbenButton
                      type="link"
                      danger
                      size="sm"
                      class="h-auto p-0"
                      @click.stop
                      >弃用删除</VbenButton
                    >
                  </APopconfirm>
                </div>
              </div>

              <!-- 题干正文 -->
              <div
                class="prose prose-sm mb-4 max-w-none text-gray-800"
                v-html="q.stem"
              ></div>

              <!-- 选项（若存在） -->
              <div
                v-if="
                  ['single', 'multiple', 'judgement'].includes(q.type) &&
                  q.options_data
                "
                class="mb-4 grid grid-cols-1 gap-2 rounded bg-gray-50 p-3"
              >
                <div
                  v-for="(opt, key) in q.options_data"
                  :key="key"
                  class="flex items-start text-sm"
                >
                  <span class="mt-1 w-6 font-bold text-gray-500"
                    >{{ key }}.</span
                  >
                  <span
                    v-html="opt.content"
                    class="prose prose-sm flex-1"
                  ></span>
                </div>
              </div>

              <!-- 答案与解析 -->
              <div class="flex flex-col gap-2">
                <div
                  class="flex items-center gap-2 rounded border border-green-100 bg-green-50 p-3 text-sm font-bold text-green-800"
                >
                  <span>✅ 答案：</span>
                  <span class="text-lg">{{
                    q.answer_data?.correct || q.answer || '未知'
                  }}</span>
                </div>
                <div
                  class="rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600"
                >
                  <strong class="text-gray-800">💡 解析：</strong>
                  <span
                    class="prose prose-sm"
                    v-html="q.analysis_content"
                  ></span>
                </div>
              </div>
            </div>

            <!-- 编辑模式表单 -->
            <div v-else>
              <div
                class="mb-4 flex items-center justify-between rounded bg-blue-50 p-2 px-4"
              >
                <div class="flex items-center gap-2 font-bold text-blue-700">
                  <span
                    class="rounded bg-blue-600 px-2 py-0.5 text-xs text-white"
                    ># {{ q.sort_order || index + 1 }}</span
                  >
                  正在就地编辑...
                </div>
                <VbenButton
                  type="primary"
                  size="sm"
                  @click="q._isEditing = false"
                  >完成修改</VbenButton
                >
              </div>
              <AForm layout="vertical">
                <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <AFormItem label="题号" class="mb-3">
                    <AInputNumber
                      v-model:value="q.sort_order"
                      style="width: 100%"
                    />
                  </AFormItem>
                  <AFormItem label="题型" class="mb-3">
                    <ASelect
                      :getPopupContainer="
                        (triggerNode) => triggerNode.parentNode
                      "
                      v-model:value="q.type"
                      :options="[
                        { label: '单选', value: 'single' },
                        { label: '多选', value: 'multiple' },
                        { label: '判断', value: 'judgement' },
                        { label: '填空', value: 'fill' },
                        { label: '简答', value: 'shortAnswer' },
                      ]"
                    />
                  </AFormItem>
                  <AFormItem label="难度" class="mb-3">
                    <ASelect
                      :getPopupContainer="
                        (triggerNode) => triggerNode.parentNode
                      "
                      v-model:value="q.difficulty"
                      :options="[
                        { label: '简单', value: 'easy' },
                        { label: '中等', value: 'medium' },
                        { label: '困难', value: 'hard' },
                      ]"
                    />
                  </AFormItem>
                  <AFormItem label="归属分类/章节" class="mb-3">
                    <AInput v-model:value="q.chapter_name" />
                  </AFormItem>
                  <AFormItem label="设定分数" class="mb-3">
                    <AInputNumber v-model:value="q.score" style="width: 100%" />
                  </AFormItem>
                </div>

                <AFormItem label="题干源码" class="mb-3">
                  <ATextarea v-model:value="q.stem" :rows="3" />
                </AFormItem>

                <div
                  v-if="
                    ['single', 'multiple', 'judgement'].includes(q.type) &&
                    q.options_data
                  "
                  class="mb-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3"
                >
                  <div class="mb-2 text-sm font-bold text-blue-800">
                    选项列表编排
                  </div>
                  <div
                    v-for="(opt, key) in q.options_data"
                    :key="key"
                    class="mb-2 flex items-start gap-2"
                  >
                    <div
                      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700"
                    >
                      {{ key }}
                    </div>
                    <ATextarea
                      v-model:value="opt.content"
                      :rows="1"
                      class="flex-grow"
                    />
                  </div>
                </div>

                <AFormItem
                  label="正确答案 (如果是多选推荐切换到 JSON 里使用数组 ['A', 'B'])"
                  class="mb-3"
                >
                  <AInput
                    v-if="q.answer_data"
                    v-model:value="q.answer_data.correct"
                    size="large"
                    class="font-bold text-green-700"
                  />
                  <AInput
                    v-else
                    v-model:value="q.answer"
                    size="large"
                    class="font-bold text-green-700"
                  />
                </AFormItem>

                <AFormItem label="题目解析" class="mb-0">
                  <ATextarea v-model:value="q.analysis_content" :rows="3" />
                </AFormItem>
              </AForm>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3 px-2">
          <span
            v-if="isStreamingProgress"
            class="mr-auto flex animate-pulse items-center text-sm font-bold text-blue-500"
          >
            ⏳ AI 引擎正在持续生成题卡中，已收集
            {{ smartExtractData.questions.length }} 道题...
          </span>
          <VbenButton
            v-if="!isStreamingProgress"
            @click="smartExtractData = null"
            >清空并放弃</VbenButton
          >
          <VbenButton
            type="primary"
            :loading="pdfCommitting"
            :disabled="isStreamingProgress"
            @click="handleSmartCommit"
            size="lg"
            class="w-40"
            >确认无误 立即入库</VbenButton
          >
        </div>
      </Card>
    </div>

    <!-- 批量修改模态框 -->
    <AModal
      v-model:open="batchEditVisible"
      title="📦 批量修改入库队列"
      @ok="handleBatchEdit"
      destroy-on-close
      :z-index="2000"
      ok-text="应用批量配置"
      cancel-text="取消"
    >
      <Alert
        message="仅填写需要覆盖的字段，留空的字段将保持各题目原有数据不受影响。"
        type="info"
        class="mb-4"
      />
      <AForm
        layout="vertical"
        class="rounded-lg border border-gray-100 bg-gray-50/50 p-4"
      >
        <AFormItem label="批量修改章节为">
          <AInput
            v-model:value="batchEditForm.chapter_name"
            placeholder="留空则不修改"
            size="large"
          />
        </AFormItem>
        <AFormItem label="批量修改题型为">
          <ASelect
            :getPopupContainer="(triggerNode) => triggerNode.parentNode"
            v-model:value="batchEditForm.type"
            allow-clear
            placeholder="留空则不修改"
            size="large"
            :options="[
              { label: '单选', value: 'single' },
              { label: '多选', value: 'multiple' },
              { label: '判断', value: 'judgement' },
              { label: '填空', value: 'fill' },
              { label: '简答', value: 'shortAnswer' },
            ]"
          />
        </AFormItem>
        <AFormItem label="批量修改难度为">
          <ASelect
            :getPopupContainer="(triggerNode) => triggerNode.parentNode"
            v-model:value="batchEditForm.difficulty"
            allow-clear
            placeholder="留空则不修改"
            size="large"
            :options="[
              { label: '简单', value: 'easy' },
              { label: '中等', value: 'medium' },
              { label: '困难', value: 'hard' },
            ]"
          />
        </AFormItem>
        <AFormItem label="批量修改分数为" class="mb-0">
          <AInputNumber
            v-model:value="batchEditForm.score"
            style="width: 100%"
            placeholder="留空则不修改"
            size="large"
          />
        </AFormItem>
      </AForm>
    </AModal>

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
</style>
