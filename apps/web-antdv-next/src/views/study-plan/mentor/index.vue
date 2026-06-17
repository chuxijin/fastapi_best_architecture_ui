<script lang="ts" setup>
import type {
  ListMentorStudentParams,
  MentorStudentDetail,
  StudyMentorStatus,
} from '#/api/study-plan';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  assignStudyMentorStudentApi,
  getStudyMentorStudentsApi,
  updateStudyMentorStudentStatusApi,
} from '#/api/study-plan';

import { findOption, mentorStatusOptions } from '../common';

interface AssignForm {
  mentor_id?: null | number;
  note?: null | string;
  student_id?: null | number;
}

interface StatusForm {
  relation_id?: null | number;
  status: StudyMentorStatus;
}

interface FilterForm {
  mentor_id?: null | number;
  status?: StudyMentorStatus;
  student_id?: null | number;
}

const assignSubmitting = ref(false);
const statusSubmitting = ref(false);
const listLoading = ref(false);
const relations = ref<MentorStudentDetail[]>([]);

const assignForm = reactive<AssignForm>({
  mentor_id: null,
  note: '',
  student_id: null,
});

const statusForm = reactive<StatusForm>({
  relation_id: null,
  status: 'active',
});

const filterForm = reactive<FilterForm>({
  mentor_id: null,
  status: undefined,
  student_id: null,
});

const columns = [
  { dataIndex: 'id', title: '关系 ID', width: 100 },
  { dataIndex: 'mentor_id', title: '导师 ID', width: 120 },
  { dataIndex: 'student_id', title: '学员 ID', width: 120 },
  { dataIndex: 'status', title: '状态', width: 100 },
  { dataIndex: 'note', title: '备注', minWidth: 220 },
  { dataIndex: 'assigned_by', title: '分配人', width: 100 },
  { dataIndex: 'assigned_at', title: '分配时间', width: 180 },
];

function buildQueryParams(): ListMentorStudentParams {
  const params: ListMentorStudentParams = {};

  if (filterForm.mentor_id) {
    params.mentor_id = filterForm.mentor_id;
  }
  if (filterForm.student_id) {
    params.student_id = filterForm.student_id;
  }
  if (filterForm.status) {
    params.status = filterForm.status;
  }

  return params;
}

async function loadRelations() {
  listLoading.value = true;
  try {
    relations.value = await getStudyMentorStudentsApi(buildQueryParams());
  } finally {
    listLoading.value = false;
  }
}

function resetFilters() {
  filterForm.mentor_id = null;
  filterForm.status = undefined;
  filterForm.student_id = null;
  void loadRelations();
}

async function submitAssign() {
  if (!assignForm.mentor_id || !assignForm.student_id) {
    message.warning('请填写导师 ID 和学员 ID');
    return;
  }
  if (assignForm.mentor_id === assignForm.student_id) {
    message.warning('导师与学员不能是同一人');
    return;
  }

  assignSubmitting.value = true;
  try {
    const relation = await assignStudyMentorStudentApi({
      mentor_id: assignForm.mentor_id,
      note: assignForm.note || null,
      student_id: assignForm.student_id,
    });
    statusForm.relation_id = relation.id;
    message.success('导师学员关系已分配');
    await loadRelations();
  } finally {
    assignSubmitting.value = false;
  }
}

async function submitStatus() {
  if (!statusForm.relation_id) {
    message.warning('请填写关系 ID');
    return;
  }

  statusSubmitting.value = true;
  try {
    const relation = await updateStudyMentorStudentStatusApi(
      statusForm.relation_id,
      statusForm.status,
    );
    statusForm.relation_id = relation.id;
    message.success('关系状态已更新');
    await loadRelations();
  } finally {
    statusSubmitting.value = false;
  }
}

function formatDateTime(value?: string) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

onMounted(() => {
  void loadRelations();
});
</script>

<template>
  <Page auto-content-height>
    <div class="mentor-page">
      <div class="panel-grid">
        <a-card title="分配导师与学员" size="small">
          <a-form layout="vertical">
            <a-form-item label="导师用户 ID" required>
              <a-input-number
                v-model:value="assignForm.mentor_id"
                :min="1"
                placeholder="mentor_id"
                style="width: 100%"
              />
            </a-form-item>
            <a-form-item label="学员用户 ID" required>
              <a-input-number
                v-model:value="assignForm.student_id"
                :min="1"
                placeholder="student_id"
                style="width: 100%"
              />
            </a-form-item>
            <a-form-item label="备注">
              <a-textarea
                v-model:value="assignForm.note"
                :maxlength="255"
                :rows="3"
                show-count
              />
            </a-form-item>
            <a-button
              :loading="assignSubmitting"
              block
              type="primary"
              @click="submitAssign"
            >
              创建关系
            </a-button>
          </a-form>
        </a-card>

        <a-card title="更新关系状态" size="small">
          <a-form layout="vertical">
            <a-form-item label="关系 ID" required>
              <a-input-number
                v-model:value="statusForm.relation_id"
                :min="1"
                placeholder="relation_id"
                style="width: 100%"
              />
            </a-form-item>
            <a-form-item label="状态" required>
              <a-segmented
                v-model:value="statusForm.status"
                :options="[
                  { label: '生效', value: 'active' },
                  { label: '暂停', value: 'paused' },
                ]"
              />
            </a-form-item>
            <a-button
              :loading="statusSubmitting"
              block
              type="primary"
              @click="submitStatus"
            >
              更新状态
            </a-button>
          </a-form>
        </a-card>
      </div>

      <a-card title="导师学员关系列表" size="small">
        <div class="toolbar">
          <a-input-number
            v-model:value="filterForm.mentor_id"
            :min="1"
            placeholder="导师 ID"
            style="width: 160px"
            @press-enter="loadRelations"
          />
          <a-input-number
            v-model:value="filterForm.student_id"
            :min="1"
            placeholder="学员 ID"
            style="width: 160px"
            @press-enter="loadRelations"
          />
          <a-select
            v-model:value="filterForm.status"
            :options="mentorStatusOptions"
            allow-clear
            placeholder="状态"
            style="width: 140px"
          />
          <a-button
            :loading="listLoading"
            type="primary"
            @click="loadRelations"
          >
            查询
          </a-button>
          <a-button @click="resetFilters">重置</a-button>
        </div>
        <a-table
          :columns="columns"
          :data-source="relations"
          :loading="listLoading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 920 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'status'">
              <a-tag
                :color="findOption(mentorStatusOptions, record.status)?.color"
              >
                {{
                  findOption(mentorStatusOptions, record.status)?.label ??
                  record.status
                }}
              </a-tag>
            </template>
            <template v-else-if="column.dataIndex === 'assigned_at'">
              {{ formatDateTime(record.assigned_at) }}
            </template>
            <template v-else-if="column.dataIndex === 'note'">
              {{ record.note || '-' }}
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </Page>
</template>

<style scoped>
.mentor-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}
</style>
