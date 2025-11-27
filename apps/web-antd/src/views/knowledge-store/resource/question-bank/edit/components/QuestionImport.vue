<script setup lang="ts">
import type { UploadFile, UploadProps } from 'ant-design-vue';

import type { BankResult } from '#/api';

import { onMounted, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';
import { MaterialSymbolsUploadFileOutline } from '@vben/icons';

import {
  Alert,
  Upload as AUpload,
  Card,
  message,
  Select,
} from 'ant-design-vue';

import { getChapterTreeApi } from '#/api';

interface Props {
  bankId: number;
  bankInfo: BankResult | null;
}

const props = defineProps<Props>();

const chapterOptions = ref<Array<{ label: string; value: number }>>([]);
const selectedChapter = ref<number | undefined>(undefined);
const fileList = ref<UploadFile[]>([]);
const uploading = ref(false);

onMounted(async () => {
  try {
    const chapters = await getChapterTreeApi({ bank_id: props.bankId });
    const flattenChapters = (
      items: typeof chapters,
      level = 0,
    ): Array<{ label: string; value: number }> => {
      return items.flatMap((item) => {
        const prefix = '　'.repeat(level);
        const result = [{ label: `${prefix}${item.name}`, value: item.id }];
        if (item.children && item.children.length > 0) {
          result.push(...flattenChapters(item.children, level + 1));
        }
        return result;
      });
    };
    chapterOptions.value = flattenChapters(chapters);
  } catch (error) {
    console.error('加载章节列表失败:', error);
  }
});

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isDocx =
    file.type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isXlsx =
    file.type ===
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (!isDocx && !isXlsx) {
    message.error('只能上传 .docx 或 .xlsx 格式的文件！');
    return false;
  }

  const isLt3M = file.size / 1024 / 1024 < 3;
  if (!isLt3M) {
    message.error('文件大小不能超过 3MB！');
    return false;
  }

  // 暂时只添加到文件列表，不自动上传
  fileList.value = [file as any];
  return false;
};

const handleRemove: UploadProps['onRemove'] = () => {
  fileList.value = [];
  return true;
};

async function handleImport() {
  if (fileList.value.length === 0) {
    message.error('请先选择要导入的文件');
    return;
  }

  uploading.value = true;
  try {
    // TODO: 实现导入逻辑
    // const formData = new FormData();
    // formData.append('file', fileList.value[0] as any);
    // if (selectedChapter.value) {
    //   formData.append('chapter_id', selectedChapter.value.toString());
    // }
    // formData.append('bank_id', props.bankId.toString());

    // await importQuestionsApi(formData);

    message.success('题目导入成功（功能待实现）');
    fileList.value = [];
    selectedChapter.value = undefined;
  } catch (error) {
    message.error('题目导入失败');
    console.error(error);
  } finally {
    uploading.value = false;
  }
}

function handleDownloadWordTemplate() {
  // TODO: 实现 Word 模板下载
  message.info('Word 模板下载功能待实现');
}

function handleDownloadExcelTemplate() {
  // TODO: 实现 Excel 模板下载
  message.info('Excel 模板下载功能待实现');
}
</script>

<template>
  <div class="question-import-container">
    <Card title="题目批量导入">
      <!-- 提示信息 -->
      <Alert
        message="请按照导题模板文件规定的题目格式逐题导题文件，以便快速将题目导入题库并生成试卷。"
        type="info"
        show-icon
        class="mb-6"
      />

      <!-- 导题章节 -->
      <div class="form-item mb-6">
        <label class="form-label">导题章节：</label>
        <div class="form-control">
          <Select
            v-model:value="selectedChapter"
            :options="chapterOptions"
            placeholder="请选择题库章节"
            allow-clear
            class="w-full"
          />
          <div class="form-hint">
            未选的话默认题目导入题库，不在任何章节中，客户端可能查询不到该题目。
          </div>
        </div>
      </div>

      <!-- 导题文件 -->
      <div class="form-item mb-6">
        <label class="form-label">导题文件：</label>
        <div class="form-control">
          <AUpload
            :file-list="fileList"
            :before-upload="beforeUpload"
            :on-remove="handleRemove"
            accept=".docx,.xlsx"
            :max-count="1"
          >
            <VbenButton>
              <MaterialSymbolsUploadFileOutline class="mr-1 size-4" />
              选择文件
            </VbenButton>
          </AUpload>
          <div class="form-hint mt-2">
            * 仅支持 office2007 及以上版本保存的 docx 文件或 xlsx
            文件，大小不超过 3M。
            <a
              @click="handleDownloadWordTemplate"
              class="ml-2 cursor-pointer text-blue-500 hover:text-blue-600"
            >
              （Word 模板⊕）
            </a>
            <a
              @click="handleDownloadExcelTemplate"
              class="ml-1 cursor-pointer text-blue-500 hover:text-blue-600"
            >
              （Excel 模板⊕）
            </a>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-3">
        <VbenButton
          type="primary"
          :loading="uploading"
          :disabled="fileList.length === 0"
          @click="handleImport"
        >
          {{ uploading ? '导入中...' : '开始导入' }}
        </VbenButton>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.form-item {
  display: flex;
  align-items: flex-start;
}

.form-label {
  flex-shrink: 0;
  width: 120px;
  padding-top: 4px;
  font-weight: 500;
  color: #333;
}

.form-control {
  flex: 1;
  max-width: 600px;
}

.form-hint {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #666;
}

:deep(.ant-alert) {
  border-radius: 4px;
}

:deep(.ant-upload-list-item) {
  margin-top: 8px;
}
</style>
