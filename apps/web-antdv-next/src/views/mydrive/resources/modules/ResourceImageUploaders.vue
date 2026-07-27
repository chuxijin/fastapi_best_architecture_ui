<script setup lang="ts">
import type { UploadChangeParam } from 'ant-design-vue';

import { ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import { message, UploadDragger } from 'ant-design-vue';

import {
  uploadMyDriveResourceFileApi,
  uploadMyDriveResourcePdfPreviewsApi,
} from '#/api';

const emit = defineEmits<{
  images: [value: string[]];
}>();

const FileImageIcon = createIconifyIcon('mdi:file-image-outline');
const FileUploadIcon = createIconifyIcon('mdi:inbox-arrow-down');
const fileList = ref<any[]>([]);
const pdfFileList = ref<any[]>([]);

function validateFileSize(file: File, maxSize: number): boolean {
  if (file.size / 1024 / 1024 <= maxSize) return true;
  message.error(`文件大小不能超过 ${maxSize}MB`);
  return false;
}

async function uploadFile(options: any): Promise<void> {
  const { file, onError, onSuccess } = options;
  try {
    const response = await uploadMyDriveResourceFileApi(file);
    emitImages(response.resource_image || response.thumbnail_urls || []);
    onSuccess(response, file);
    message.success('文件上传并生成缩略图成功');
  } catch (error) {
    onError(error);
    message.error('文件上传失败');
  }
}

async function uploadPdfPreviews(options: any): Promise<void> {
  const { file, onError, onSuccess } = options;
  try {
    const response = await uploadMyDriveResourcePdfPreviewsApi(file);
    emitImages(response.resource_image || response.thumbnail_urls || []);
    onSuccess(response, file);
    message.success('PDF 缩略图生成成功');
  } catch (error) {
    onError(error);
    message.error('PDF 缩略图生成失败');
  }
}

function emitImages(images: string[]): void {
  emit('images', images.map((image) => image.trim()).filter(Boolean));
}

function validatePdf(file: File): boolean {
  if (file.name.toLowerCase().endsWith('.pdf'))
    return validateFileSize(file, 100);
  message.error('只支持上传 PDF 文件生成缩略图');
  return false;
}

function updateFileList(info: UploadChangeParam): void {
  fileList.value = info.fileList.slice(-1);
}

function updatePdfFileList(info: UploadChangeParam): void {
  pdfFileList.value = info.fileList.slice(-1);
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <UploadDragger
      v-model:file-list="fileList"
      :before-upload="(file) => validateFileSize(file as File, 5)"
      :custom-request="uploadFile"
      :max-count="1"
      :multiple="false"
      name="file"
      @change="updateFileList"
    >
      <p class="ant-upload-drag-icon">
        <FileUploadIcon class="size-10 text-blue-500" />
      </p>
      <p class="ant-upload-text">上传文件并生成缩略图</p>
      <p class="ant-upload-hint">最大 5MB，图片会自动生成多尺寸缩略图</p>
    </UploadDragger>
    <UploadDragger
      v-model:file-list="pdfFileList"
      accept=".pdf,application/pdf"
      :before-upload="(file) => validatePdf(file as File)"
      :custom-request="uploadPdfPreviews"
      :max-count="1"
      :multiple="false"
      name="file"
      @change="updatePdfFileList"
    >
      <p class="ant-upload-drag-icon">
        <FileImageIcon class="size-10 text-emerald-500" />
      </p>
      <p class="ant-upload-text">仅生成 PDF 缩略图</p>
      <p class="ant-upload-hint">不保存原 PDF，默认生成前 3 页</p>
    </UploadDragger>
  </div>
</template>
