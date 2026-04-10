<script lang="ts" setup>
import type { Attachment, UploadRequestConfig } from "@HaloEditor/utils/upload";
import { Toast, VButton, VDropdown, VDropdownItem } from "#/stubs/halo-components";
import {
  utils,
  type AttachmentLike,
  type AttachmentSimple,
} from "@halo-dev/ui-shared";
import { useFileDialog } from "@vueuse/core";
import { ref } from "vue";
import { useEditorConfig } from "@HaloEditor/config/use-editor-config";
import { i18n } from "@HaloEditor/locales";
import Input from "../base/Input.vue";

const editorConfig = useEditorConfig();

const props = defineProps<{
  originalLink?: string;
  accept?: string;
  upload?: (file: File, options?: UploadRequestConfig) => Promise<Attachment>;
}>();

const emit = defineEmits<{
  (event: "change", attachment?: AttachmentSimple): void;
}>();

// 优先使用 prop 传入的上传函数，其次使用全局 config
const resolvedUpload = () => props.upload || editorConfig.upload;

// Attachment Selector Modal
const attachmentSelectorModalVisible = ref(false);

function onAttachmentSelect(attachments: AttachmentLike[]) {
  if (!attachments.length) {
    return;
  }
  const attachment = attachments[0];
  const attachmentSimple = utils.attachment.convertToSimple(attachment);
  emit("change", attachmentSimple);
  attachmentSelectorModalVisible.value = false;
}

// Upload
const { onChange: onInputChange, open } = useFileDialog({
  accept: props.accept,
  multiple: false,
});

onInputChange((files) => {
  const file = files?.[0];
  if (!file) {
    return;
  }
  const upload = resolvedUpload();
  if (!upload) {
    console.warn("[Editor] No upload function provided.");
    return;
  }
  upload(file)
    .then((attachment) => {
      emit("change", utils.attachment.convertToSimple(attachment));
    })
    .catch((e: Error) => {
      Toast.error(
        `${i18n.global.t("editor.extensions.upload.error")} - ${e.message}`
      );
    });
});

function onExternalLinkChange(value?: string | number) {
  if (value && typeof value === "string") {
    emit("change", utils.attachment.convertToSimple(value));
  }
}
</script>
<template>
  <VDropdown class="inline-flex">
    <VButton size="sm" type="secondary">
      {{ i18n.global.t("editor.extensions.upload.operations.replace.button") }}
    </VButton>
    <template #popper>
      <VDropdownItem
        v-if="resolvedUpload()"
        @click="open()"
      >
        {{ i18n.global.t("editor.common.button.upload") }}
      </VDropdownItem>
      <VDropdownItem
        v-if="editorConfig.attachmentSelector"
        @click="attachmentSelectorModalVisible = true"
      >
        {{ i18n.global.t("editor.extensions.upload.attachment.title") }}
      </VDropdownItem>
      <VDropdown>
        <VDropdownItem>
          {{ i18n.global.t("editor.extensions.upload.permalink.title") }}
        </VDropdownItem>
        <template #popper>
          <div class="w-80">
            <Input
              auto-focus
              :model-value="originalLink"
              :placeholder="
                i18n.global.t('editor.extensions.upload.permalink.placeholder')
              "
              @update:model-value="onExternalLinkChange"
            />
          </div>
        </template>
      </VDropdown>
    </template>
  </VDropdown>

  <component
    :is="editorConfig.attachmentSelector"
    v-if="attachmentSelectorModalVisible && editorConfig.attachmentSelector"
    :accepts="[accept].filter(Boolean)"
    :min="1"
    :max="1"
    @select="onAttachmentSelect"
    @close="attachmentSelectorModalVisible = false"
  />
</template>
