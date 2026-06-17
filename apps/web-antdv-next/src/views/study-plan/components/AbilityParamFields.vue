<script lang="ts" setup>
/* eslint-disable vue/no-deprecated-filter */
import type { StudyPlanAbilityParamSpec } from '#/api/study-plan';

import { computed } from 'vue';

interface NormalizedOption {
  label: string;
  value: number | string;
}

const props = withDefaults(
  defineProps<{
    bindKeys?: string[];
    modelValue: Record<string, unknown>;
    schema?: null | Record<string, StudyPlanAbilityParamSpec>;
  }>(),
  {
    schema: null,
    bindKeys: () => ['question_count'],
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, unknown>): void;
}>();

const editableEntries = computed(() => {
  if (!props.schema) return [];
  return Object.entries(props.schema)
    .filter(
      ([_, spec]) => !spec.bind_to || !props.bindKeys.includes(spec.bind_to),
    )
    .map(([name, spec]) => ({ name, spec }));
});

function normalizeOptions(spec: StudyPlanAbilityParamSpec): NormalizedOption[] {
  if (!spec.options) return [];
  return spec.options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { label: String(opt), value: opt };
    }
    return { label: opt.label, value: opt.value };
  });
}

function getValue(name: string, spec: StudyPlanAbilityParamSpec): unknown {
  const v = props.modelValue?.[name];
  if (v === undefined || v === null || v === '') {
    return spec.default ?? null;
  }
  return v;
}

function setValue(name: string, value: unknown) {
  const next = { ...props.modelValue };
  if (value === null || value === '' || value === undefined) {
    delete next[name];
  } else {
    next[name] = value;
  }
  emit('update:modelValue', next);
}
</script>

<template>
  <div v-if="editableEntries.length > 0" class="ability-params">
    <div class="form-grid">
      <a-form-item
        v-for="{ name, spec } in editableEntries"
        :key="name"
        :label="spec.label || name"
      >
        <a-input-number
          v-if="spec.type === 'int'"
          :value="getValue(name, spec) as null | number"
          :min="spec.min"
          :max="spec.max"
          :precision="0"
          style="width: 100%"
          @update:value="(v) => setValue(name, v)"
        />
        <a-select
          v-else-if="spec.type === 'enum'"
          :value="getValue(name, spec) as null | number | string"
          :options="normalizeOptions(spec)"
          allow-clear
          style="width: 100%"
          @update:value="(v) => setValue(name, v)"
        />
        <a-input
          v-else
          :value="getValue(name, spec) as null | string"
          allow-clear
          @update:value="(v) => setValue(name, v)"
        />
      </a-form-item>
    </div>
  </div>
</template>

<style scoped>
.ability-params {
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px dashed #eeeaf8;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}
</style>
