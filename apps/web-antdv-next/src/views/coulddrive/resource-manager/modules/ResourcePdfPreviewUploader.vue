<script lang="ts" setup>
import type { UploadChangeParam } from 'ant-design-vue';

import { ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { message, UploadDragger } from 'ant-design-vue';

import { uploadResourcePdfPreviewsApi } from '#/api';

const props = withDefaults(defineProps<Props>(), {
  maxSize: 100,
  pageCount: 3,
  maxSide: 960,
  quality: 86,
});

const emit = defineEmits<{
  success: [result: PdfPreviewUploadResult];
}>();

const FileImageIcon = createIconifyIcon('mdi:file-image-outline');

interface Props {
  maxSide?: number;
  maxSize?: number;
  pageCount?: number;
  quality?: number;
}

interface PdfPreviewUploadResult {
  file_type: string;
  filename: string;
  resource_image: string[];
  thumbnail_urls?: string[];
}

const fileList = ref<any[]>([]);

function beforeUpload(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'pdf') {
    message.error('只支持上传 PDF 文件生成缩略图');
    return false;
  }

  const isLtMaxSize = file.size / 1024 / 1024 <= props.maxSize;
  if (!isLtMaxSize) {
    message.error(`PDF 大小不能超过 ${props.maxSize}MB！`);
    return false;
  }

  return true;
}

async function customRequest(options: any) {
  const { file, onSuccess, onError } = options;

  try {
    const response = await uploadResourcePdfPreviewsApi(file, {
      maxSide: props.maxSide,
      pageCount: props.pageCount,
      quality: props.quality,
    });
    emit('success', response);
    onSuccess(response, file);
    message.success('缩略图生成成功');
  } catch (error: any) {
    onError(error);
    message.error('缩略图生成失败');
    console.error(error);
  }
}

function handleChange(info: UploadChangeParam) {
  fileList.value = info.fileList.slice(-1);
}
</script>

<template>
  <UploadDragger
    v-model:file-list="fileList"
    name="file"
    :multiple="false"
    :max-count="1"
    accept=".pdf,application/pdf"
    :before-upload="beforeUpload"
    :custom-request="customRequest"
    @change="handleChange"
  >
    <p class="ant-upload-drag-icon">
      <FileImageIcon class="size-12 text-emerald-500" />
    </p>
    <p class="ant-upload-text">上传 PDF，仅生成资源缩略图</p>
    <p class="ant-upload-hint">
      不保存原 PDF，默认生成前 {{ pageCount }} 页，最大 {{ maxSize }}MB
    </p>
  </UploadDragger>
</template>

<style scoped>
:deep(.ant-upload-dragger) {
  padding: 16px;
}
</style>
