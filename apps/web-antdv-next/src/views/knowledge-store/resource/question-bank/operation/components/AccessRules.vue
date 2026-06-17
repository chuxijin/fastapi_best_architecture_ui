<script lang="ts" setup>
import { Alert } from 'ant-design-vue';

import RuleEditor from '#/views/access/rule/components/RuleEditor.vue';

const props = defineProps<{
  bankId: number;
  bankName?: string;
}>();
</script>

<template>
  <div class="flex h-full flex-col">
    <Alert
      :message="`以下规则仅对当前内容「${props.bankName ?? props.bankId}」生效。新增/修改/删除规则会立即影响该内容的访问控制。`"
      type="info"
      show-icon
      class="mb-3"
    />
    <div class="flex-1 overflow-hidden">
      <RuleEditor
        locked-resource-type="qbank"
        :locked-resource-id="props.bankId"
      />
    </div>
  </div>
</template>
