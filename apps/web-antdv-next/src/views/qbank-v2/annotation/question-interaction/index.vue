<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { QuestionInteractionSelectionMode } from '#/api';
import type {
  CreateQuestionInteractionParam,
  GetQuestionInteractionDetail,
} from '#/api/qbank-v2/interaction';
import type {
  AnchorSource,
  AnchorType,
  CreateMaterialAnchorParam,
  GetMaterialAnchorDetail,
  GetMaterialBlocksResult,
} from '#/api/qbank-v2/material';
import type { GetQuestionDetail } from '#/api/qbank-v2/question';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';

import { useDebounceFn } from '@vueuse/core';
import { message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createQuestionInteractionApi,
  deleteQuestionInteractionApi,
  getQuestionInteractionsApi,
  updateQuestionInteractionApi,
} from '#/api/qbank-v2/interaction';
import {
  deleteMaterialAnchorApi,
  getMaterialAnchorsApi,
  getMaterialApi,
  getMaterialBlocksApi,
  getMaterialQuestionsApi,
  qbankV2CreateMaterialAnchorApi,
  qbankV2GetMaterialListApi,
  qbankV2UpdateMaterialAnchorApi,
} from '#/api/qbank-v2/material';
import { getQuestionApi } from '#/api/qbank-v2/question';

import MaterialSearchSelect from '../../components/MaterialSearchSelect.vue';

type JsonObject = Record<string, unknown>;

interface AnchorFormState {
  anchor_key: string;
  anchor_type: AnchorType;
  asset_id?: null | number;
  bbox_json: string;
  block_id?: null | string;
  content_hash?: null | string;
  end_offset?: null | number;
  extra_data_json: string;
  id?: number;
  material_id?: null | number;
  ocr_confidence?: null | number;
  polygon_json: string;
  source: AnchorSource;
  start_offset?: null | number;
  status: string;
  table_cell_json: string;
  text?: null | string;
}

interface AnnotationFormState {
  annotation_key: string;
  answer_data_json: string;
  candidate_anchor_ids_text: string;
  config_json: string;
  content_hash?: null | string;
  id?: number;
  instruction: string;
  interaction_type: string;
  is_default: boolean;
  material_id?: null | number;
  question_material_id?: null | number;
  question_id?: null | number;
  selection_mode: QuestionInteractionSelectionMode;
  status: number;
  title?: null | string;
  version_no: number;
}

interface AnchorImagePointerState {
  assetUrl: string;
  blockId: string;
  currentX: number;
  currentY: number;
  startX: number;
  startY: number;
}

interface AnchorDraftItem {
  local_key: string;
  payload: CreateMaterialAnchorParam;
}

const activeTab = ref('anchors');
const anchorSubmitting = ref(false);
const annotationSubmitting = ref(false);
const anchorMaterialLoading = ref(false);
const materialOptionsLoading = ref(false);
const annotationMaterialLoading = ref(false);
const candidateLoading = ref(false);
const questionPreviewLoading = ref(false);
const anchorDrawerOpen = ref(false);
const annotationDrawerOpen = ref(false);
const anchorMaterialId = ref<null | number>(null);
const anchorRevisionId = ref<null | number>(null);
const annotationMaterialId = ref<null | number>(null);
const annotationRevisionId = ref<null | number>(null);
const anchorMaterialPreview = ref<GetMaterialBlocksResult | null>(null);
const anchorMaterialAnchors = ref<GetMaterialAnchorDetail[]>([]);
const anchorDrafts = ref<AnchorDraftItem[]>([]);
const anchorDraftSequence = ref(0);
const anchorFocusedAnchorId = ref<null | number>(null);
const anchorImagePointerState = ref<AnchorImagePointerState | null>(null);
const annotationMaterialAnchors = ref<GetMaterialAnchorDetail[]>([]);
const annotationMaterialPreview = ref<GetMaterialBlocksResult | null>(null);
const annotationQuestionPreview = ref<GetQuestionDetail | null>(null);
const annotationMaterialQuestions = ref<any[]>([]);
const annotationFocusedAnchorId = ref<null | number>(null);
const annotationRoleTargetId = ref<null | number>(null);
const materialOptions = ref<Array<{ label: string; value: number }>>([]);

const anchorForm = reactive<AnchorFormState>(createDefaultAnchorForm());
const annotationForm = reactive<AnnotationFormState>(
  createDefaultAnnotationForm(),
);

const anchorTypeOptions = [
  { label: '文本范围 text_range', value: 'text_range' },
  { label: '文本块 text_block', value: 'text_block' },
  { label: '图片区域 image_region', value: 'image_region' },
  { label: '图片点位 image_point', value: 'image_point' },
  { label: '表格单元格 table_cell', value: 'table_cell' },
];

const dataAnalysisAnchorRoleOptions = [
  { label: '现期 current_value', value: 'current_value' },
  { label: '基期 base_value', value: 'base_value' },
  { label: '增长率 growth_rate', value: 'growth_rate' },
  { label: '增长量 growth_amount', value: 'growth_amount' },
  { label: '同比 yoy', value: 'yoy' },
  { label: '环比 mom', value: 'mom' },
  { label: '变化量 change_amount', value: 'change_amount' },
  { label: '变化幅度 change_rate', value: 'change_rate' },
];

const interactionTypeOptions = [
  { label: '找数 numberLocate', value: 'numberLocate' },
  { label: '找证据 evidenceLocate', value: 'evidenceLocate' },
  { label: '区域定位 regionLocate', value: 'regionLocate' },
  { label: '锚点定位 anchorLocate', value: 'anchorLocate' },
];

const selectionModeOptions = [
  { label: '单选 single', value: 'single' },
  { label: '多选 multiple', value: 'multiple' },
  { label: '多角色 multi_role', value: 'multi_role' },
];

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '可用', value: 'active' },
  { label: '废弃', value: 'retired' },
];

const defaultOptions = [
  { label: '默认', value: 'true' },
  { label: '非默认', value: 'false' },
];

const anchorFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  wrapperClass: 'grid-cols-4',
  submitButtonOptions: {
    content: '查询',
  },
  schema: [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: false,
        loading: materialOptionsLoading,
        onSearch: (val: string) => debouncedSearchMaterial(val),
        options: materialOptions,
        placeholder: '输入名称/编码搜索',
        showSearch: true,
        style: { width: '200px' },
      },
      fieldName: 'material_id',
      label: '材料',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: anchorTypeOptions,
        placeholder: '全部',
        style: { width: '160px' },
      },
      fieldName: 'anchor_type',
      label: '锚点类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: statusOptions,
        placeholder: '全部',
        style: { width: '120px' },
      },
      fieldName: 'status',
      label: '状态',
    },
  ],
};

const annotationFormOptions: VbenFormProps = {
  collapsed: true,
  showCollapseButton: true,
  wrapperClass: 'grid-cols-6',
  submitButtonOptions: {
    content: '查询',
  },
  schema: [
    {
      component: 'InputNumber',
      componentProps: {
        min: 1,
        placeholder: '题目 ID',
        style: { width: '140px' },
      },
      fieldName: 'question_id',
      label: '题目 ID',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: false,
        loading: materialOptionsLoading,
        onSearch: (val: string) => debouncedSearchMaterial(val),
        options: materialOptions,
        placeholder: '输入名称/编码搜索',
        showSearch: true,
        style: { width: '200px' },
      },
      fieldName: 'material_id',
      label: '材料',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: interactionTypeOptions,
        placeholder: '全部',
        style: { width: '180px' },
      },
      fieldName: 'interaction_type',
      label: '交互类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: statusOptions,
        placeholder: '全部',
        style: { width: '120px' },
      },
      fieldName: 'status',
      label: '状态',
    },
  ],
};

const anchorGridOptions: VxeTableGridOptions<GetMaterialAnchorDetail> = {
  rowConfig: {
    keyField: 'id',
    isHover: true,
  },
  height: 'auto',
  exportConfig: {},
  printConfig: {},
  toolbarConfig: {
    export: true,
    print: true,
    refresh: true,
    refreshOptions: {
      code: 'query',
    },
    custom: true,
    zoom: true,
  },
  pagerConfig: {
    enabled: false,
  },
  columns: [
    { field: 'id', title: 'ID', width: 90 },
    { field: 'material_id', title: '材料 ID', width: 110 },
    { field: 'anchor_key', title: '锚点键', minWidth: 180 },
    {
      field: 'anchor_type',
      title: '类型',
      slots: { default: 'anchor_type_default' },
      width: 150,
    },
    { field: 'block_id', title: '块 ID', width: 120 },
    { field: 'text', title: '文本', minWidth: 220, showOverflow: true },
    { field: 'asset_url', title: '资源', minWidth: 180, showOverflow: true },
    {
      field: 'status',
      title: '状态',
      slots: { default: 'status_default' },
      width: 100,
    },
    {
      field: 'operation',
      title: '操作',
      align: 'center',
      fixed: 'right',
      slots: { default: 'anchor_operation_default' },
      width: 140,
    },
  ],
  proxyConfig: {
    ajax: {
      query: async (_, formValues) => {
        const formMaterialId = Number(formValues?.material_id) || null;
        let targetMaterialId = formMaterialId || anchorMaterialId.value;
        let targetRevisionId = anchorRevisionId.value;
        if (formMaterialId && formMaterialId !== anchorMaterialId.value) {
          const detail: any = await getMaterialApi(formMaterialId);
          targetRevisionId =
            detail?.current_revision_id ?? detail?.revision?.id ?? null;
        }
        if (!formMaterialId && !anchorRevisionId.value) {
          targetMaterialId = null;
        }
        if (targetMaterialId && targetRevisionId) {
          const rows = await getMaterialAnchorsApi(
            targetMaterialId,
            targetRevisionId,
          );
          return { items: rows, total: rows.length };
        }
        return { items: [], total: 0 };
      },
    },
  },
};

const annotationGridOptions: VxeTableGridOptions<GetQuestionInteractionDetail> =
  {
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    height: 'auto',
    exportConfig: {},
    printConfig: {},
    toolbarConfig: {
      export: true,
      print: true,
      refresh: true,
      refreshOptions: {
        code: 'query',
      },
      custom: true,
      zoom: true,
    },
    pagerConfig: {
      enabled: false,
    },
    columns: [
      { field: 'id', title: 'ID', width: 90 },
      { field: 'question_id', title: '题目 ID', width: 110 },
      { field: 'material_revision_id', title: '材料版本 ID', width: 120 },
      { field: 'interaction_key', title: '交互键', minWidth: 180 },
      {
        field: 'interaction_type',
        title: '交互类型',
        slots: { default: 'interaction_type_default' },
        width: 150,
      },
      { field: 'selection_mode', title: '选择模式', width: 130 },
      {
        field: 'candidates',
        title: '候选锚点',
        slots: { default: 'candidate_anchor_ids_default' },
        width: 110,
      },
      {
        field: 'status',
        title: '状态',
        slots: { default: 'status_default' },
        width: 100,
      },
      {
        field: 'operation',
        title: '操作',
        align: 'center',
        fixed: 'right',
        slots: { default: 'annotation_operation_default' },
        width: 140,
      },
    ],
    proxyConfig: {
      ajax: {
        query: async (_, formValues) => {
          const params = cleanParams({
            interaction_type: formValues?.interaction_type,
            material_id: formValues?.material_id,
            question_id: formValues?.question_id,
            status: formValues?.status,
          });
          return await getQuestionInteractionsApi(params as any);
        },
      },
    },
  };

const [AnchorGrid, anchorGridApi] = useVbenVxeGrid({
  formOptions: anchorFormOptions,
  gridOptions: anchorGridOptions,
});

const [AnnotationGrid, annotationGridApi] = useVbenVxeGrid({
  formOptions: annotationFormOptions,
  gridOptions: annotationGridOptions,
});

const anchorDrawerTitle = computed(() =>
  anchorForm.id ? '编辑材料锚点' : '新增材料锚点',
);

const annotationDrawerTitle = computed(() =>
  annotationForm.id ? '编辑题目交互标注' : '新增题目交互标注',
);

const annotationQuestionOptions = computed(() =>
  annotationMaterialQuestions.value.map((question) => ({
    label: `ID ${question.id}｜${truncateText(stripHtml(question.stem), 56)}`,
    value: question.id,
  })),
);

const annotationRoleValue = computed(() =>
  getAnnotationAnchorRole(annotationRoleTargetId.value),
);

const annotationRoleTargetLabel = computed(() => {
  const anchorId = annotationRoleTargetId.value;
  if (!anchorId) {
    return '';
  }
  const anchor = annotationMaterialAnchors.value.find(
    (item) => item.id === anchorId,
  );
  return anchor ? formatAnchorDisplayText(anchor) : `#${anchorId}`;
});

async function loadMaterialOptions(keyword?: string) {
  materialOptionsLoading.value = true;
  try {
    const response: any = await qbankV2GetMaterialListApi({
      keyword: keyword?.trim() || undefined,
      size: 100,
    });
    const items =
      (Array.isArray(response) ? response : undefined) ||
      response?.items ||
      (Array.isArray(response?.data) ? response.data : []);
    materialOptions.value = items.map((item: any) => ({
      label: `${item.title || `材料 ${item.id}`} · ${item.code || `ID ${item.id}`}`,
      value: item.id,
    }));
  } catch (error) {
    showErrorMessage(error, '载入材料列表失败');
  } finally {
    materialOptionsLoading.value = false;
  }
}

const debouncedSearchMaterial = useDebounceFn((val: string) => {
  void loadMaterialOptions(val);
}, 300);

onMounted(() => {
  void loadMaterialOptions();
});

function createDefaultAnchorForm(): AnchorFormState {
  return {
    anchor_key: '',
    anchor_type: 'text_range',
    asset_id: null,
    bbox_json: '',
    block_id: null,
    content_hash: null,
    end_offset: null,
    extra_data_json: '{}',
    id: undefined,
    material_id: null,
    ocr_confidence: null,
    polygon_json: '',
    source: 'manual',
    start_offset: null,
    status: 'draft',
    table_cell_json: '',
    text: null,
  };
}

function createDefaultAnnotationForm(): AnnotationFormState {
  return {
    annotation_key: '',
    answer_data_json: '{}',
    candidate_anchor_ids_text: '',
    config_json: toPrettyJson({
      anchor_roles: {},
    }),
    id: undefined,
    instruction: '',
    interaction_type: 'numberLocate',
    is_default: true,
    material_id: null,
    question_id: null,
    selection_mode: 'single',
    status: 10,
    title: null,
    version_no: 1,
  };
}

function refreshAnchors() {
  anchorGridApi.query();
}

function refreshAnnotations() {
  annotationGridApi.query();
}

function openCreateAnchor() {
  resetAnchorForm();
  anchorMaterialPreview.value = null;
  anchorMaterialAnchors.value = [];
  anchorDrafts.value = [];
  anchorDraftSequence.value = 0;
  anchorFocusedAnchorId.value = null;
  anchorImagePointerState.value = null;
  anchorDrawerOpen.value = true;
}

function openEditAnchor(row: unknown) {
  resetAnchorForm(row as GetMaterialAnchorDetail);
  anchorMaterialPreview.value = null;
  anchorMaterialAnchors.value = [];
  anchorDrafts.value = [];
  anchorDraftSequence.value = 0;
  anchorFocusedAnchorId.value = null;
  anchorImagePointerState.value = null;
  anchorDrawerOpen.value = true;
  loadAnchorMaterialBlocks();
}

function openCreateAnnotation() {
  resetAnnotationForm();
  annotationMaterialAnchors.value = [];
  annotationMaterialPreview.value = null;
  annotationMaterialQuestions.value = [];
  annotationQuestionPreview.value = null;
  annotationFocusedAnchorId.value = null;
  annotationRoleTargetId.value = null;
  annotationDrawerOpen.value = true;
}

function openEditAnnotation(row: unknown) {
  resetAnnotationForm(row as GetQuestionInteractionDetail);
  annotationMaterialAnchors.value = [];
  annotationMaterialPreview.value = null;
  annotationMaterialQuestions.value = [];
  annotationQuestionPreview.value = null;
  annotationFocusedAnchorId.value = null;
  annotationRoleTargetId.value = null;
  annotationDrawerOpen.value = true;
  void (async () => {
    // 先载入题目预览回填 material_id，再加载材料块（材料块依赖 material_id）
    await loadAnnotationQuestionPreview();
    await loadAnnotationMaterialBlocks();
  })();
}

function resetAnchorForm(row?: GetMaterialAnchorDetail) {
  Object.assign(anchorForm, createDefaultAnchorForm());
  if (!row) {
    return;
  }

  Object.assign(anchorForm, {
    anchor_key: row.anchor_key,
    anchor_type: row.anchor_type,
    asset_id: row.asset_id ?? null,
    bbox_json: toPrettyJson(row.bbox),
    block_id: row.block_id ?? null,
    content_hash: (row as any).content_hash ?? null,
    end_offset: row.end_offset ?? null,
    extra_data_json: toPrettyJson(row.extra_data ?? {}),
    id: row.id,
    material_id: row.material_id,
    ocr_confidence:
      row.confidence === null || row.confidence === undefined
        ? null
        : Number(row.confidence),
    polygon_json: toPrettyJson(row.polygon),
    source: row.source,
    start_offset: row.start_offset ?? null,
    status: row.status,
    table_cell_json: toPrettyJson(row.table_cell),
    text: row.text ?? null,
  });
}

function resetAnnotationForm(row?: GetQuestionInteractionDetail) {
  Object.assign(annotationForm, createDefaultAnnotationForm());
  if (!row) {
    return;
  }

  const rowConfig: Record<string, unknown> = {
    ...((row.config ?? {}) as Record<string, unknown>),
  };
  const rowAnswerData = rowConfig.answer_data ?? {};
  delete rowConfig.answer_data;

  Object.assign(annotationForm, {
    annotation_key: row.interaction_key,
    answer_data_json: toPrettyJson(rowAnswerData),
    candidate_anchor_ids_text: (row.candidates ?? [])
      .map((item) => item.anchor_id)
      .join(', '),
    config_json: toPrettyJson(rowConfig),
    content_hash: null,
    id: row.id,
    instruction: row.instruction,
    interaction_type: row.interaction_type,
    is_default: false,
    material_id: null,
    question_material_id: row.question_material_id ?? null,
    question_id: row.question_id,
    selection_mode: row.selection_mode,
    status: row.status,
    title: row.title ?? null,
    version_no: 1,
  });
}

async function submitAnchor() {
  anchorSubmitting.value = true;
  try {
    if (anchorForm.id) {
      const payload = buildAnchorPayload();
      const { material_id: _, ...updatePayload } = payload;
      await qbankV2UpdateMaterialAnchorApi(
        anchorMaterialId.value,
        anchorRevisionId.value,
        anchorForm.id,
        updatePayload,
      );
      message.success('材料锚点已更新');
      anchorDrawerOpen.value = false;
    } else {
      if (hasCurrentAnchorDraft()) {
        addCurrentAnchorDraftIfReady(false);
      }
      if (anchorDrafts.value.length === 0) {
        message.warning('请先在材料中标出至少一个锚点');
        return;
      }
      await qbankV2CreateMaterialAnchorApi(
        anchorMaterialId.value,
        anchorRevisionId.value,
        anchorDrafts.value.map((item) => item.payload),
      );
      message.success(`已保存 ${anchorDrafts.value.length} 个材料锚点`);
      anchorDrafts.value = [];
      anchorDrawerOpen.value = false;
    }
    refreshAnchors();
  } catch (error) {
    showErrorMessage(error, '保存材料锚点失败');
  } finally {
    anchorSubmitting.value = false;
  }
}

async function submitAnnotation() {
  let payload: CreateQuestionInteractionParam;
  try {
    payload = buildAnnotationPayload();
  } catch (error) {
    showErrorMessage(error, '题目交互标注数据不完整');
    return;
  }

  annotationSubmitting.value = true;
  try {
    const qId = Number(annotationForm.question_id);
    if (!Number.isInteger(qId) || qId < 1) {
      throw new Error('请先选择题目');
    }
    if (annotationForm.id) {
      await updateQuestionInteractionApi(
        qId,
        annotationForm.id,
        payload as any,
      );
      message.success('题目交互标注已更新');
    } else {
      await createQuestionInteractionApi(qId, payload as any);
      message.success('题目交互标注已创建');
    }
    annotationDrawerOpen.value = false;
    refreshAnnotations();
  } catch (error) {
    showErrorMessage(error, '保存题目交互标注失败');
  } finally {
    annotationSubmitting.value = false;
  }
}

function confirmDeleteAnchor(row: unknown) {
  const anchor = row as GetMaterialAnchorDetail;
  Modal.confirm({
    title: '确认删除材料锚点？',
    content: `锚点：${anchor.anchor_key}（ID: ${anchor.id}）`,
    okButtonProps: { danger: true },
    okText: '删除',
    async onOk() {
      await deleteMaterialAnchorApi(
        anchorMaterialId.value,
        anchorRevisionId.value,
        anchor.id,
      );
      message.success('材料锚点已删除');
      refreshAnchors();
    },
  });
}

function confirmDeleteAnnotation(row: unknown) {
  const annotation = row as GetQuestionInteractionDetail;
  Modal.confirm({
    title: '确认删除题目交互标注？',
    content: `标注：${annotation.interaction_key}（ID: ${annotation.id}）`,
    okButtonProps: { danger: true },
    okText: '删除',
    async onOk() {
      await deleteQuestionInteractionApi(annotation.question_id, annotation.id);
      message.success('题目交互标注已删除');
      refreshAnnotations();
    },
  });
}

async function fillCandidateAnchorsByMaterial() {
  if (!annotationForm.material_id || !annotationRevisionId.value) {
    message.warning('请先选择材料');
    return;
  }

  candidateLoading.value = true;
  try {
    const data = await getMaterialAnchorsApi(
      annotationForm.material_id,
      annotationRevisionId.value,
    );
    annotationMaterialAnchors.value = data;
    annotationForm.candidate_anchor_ids_text = data
      .map((item) => item.id)
      .join(', ');
    message.success(`已载入 ${data.length} 个可用锚点`);
  } catch (error) {
    showErrorMessage(error, '载入候选锚点失败');
  } finally {
    candidateLoading.value = false;
  }
}

async function loadAnchorMaterialBlocks() {
  if (!anchorForm.material_id) {
    message.warning('请先选择材料');
    return;
  }

  anchorMaterialLoading.value = true;
  try {
    const mDetail: any = await getMaterialApi(anchorForm.material_id);
    const revId = mDetail.current_revision_id ?? mDetail.revision?.id;
    if (!revId) {
      throw new Error('材料没有可用版本');
    }
    anchorMaterialId.value = anchorForm.material_id;
    anchorRevisionId.value = revId;
    const data = await getMaterialBlocksApi(anchorForm.material_id, revId);
    anchorMaterialPreview.value = data;
    anchorForm.content_hash = data.content_hash;
    await loadAnchorAnchorsByMaterial(false);
    message.success(`已载入 ${data.blocks.length} 个材料块`);
  } catch (error) {
    showErrorMessage(error, '载入材料内容失败');
  } finally {
    anchorMaterialLoading.value = false;
  }
}

async function loadAnchorAnchorsByMaterial(showSuccess = true) {
  if (!anchorForm.material_id || !anchorRevisionId.value) {
    message.warning('请先选择材料');
    return;
  }

  const data = await getMaterialAnchorsApi(
    anchorForm.material_id,
    anchorRevisionId.value,
  );
  anchorMaterialAnchors.value = data;
  if (showSuccess) {
    message.success(`已载入 ${data.length} 个已有锚点`);
  }
}

async function loadAnnotationQuestionPreview() {
  if (!annotationForm.question_id) {
    message.warning('请先选择题目');
    return;
  }

  questionPreviewLoading.value = true;
  try {
    const data: any = await getQuestionApi(annotationForm.question_id);
    annotationQuestionPreview.value = data;
    if (!annotationForm.material_id && data.material_ids?.length) {
      annotationForm.material_id = data.material_ids[0];
    }
    const material =
      data.materials?.find(
        (item: any) => item.material_id === annotationForm.material_id,
      ) || data.materials?.[0];
    if (material) {
      annotationForm.material_id = material.material_id;
      annotationForm.question_material_id = material.id;
    }
    fillAnnotationAutoFields();
    message.success('已载入题目内容');
  } catch (error) {
    showErrorMessage(error, '载入题目内容失败');
  } finally {
    questionPreviewLoading.value = false;
  }
}

async function loadAnnotationMaterialBlocks() {
  if (!annotationForm.material_id) {
    message.warning('请先选择材料');
    return;
  }

  annotationMaterialLoading.value = true;
  try {
    const mDetail: any = await getMaterialApi(annotationForm.material_id);
    const revId = mDetail.current_revision_id ?? mDetail.revision?.id;
    if (!revId) {
      throw new Error('材料没有可用版本');
    }
    annotationMaterialId.value = annotationForm.material_id;
    annotationRevisionId.value = revId;
    const data = await getMaterialBlocksApi(annotationForm.material_id, revId);
    annotationMaterialPreview.value = data;
    annotationForm.content_hash = data.content_hash;
    const qData = await getMaterialQuestionsApi(annotationForm.material_id);
    annotationMaterialQuestions.value = qData;
    await annotationMaterialAnchorsLoad(false);
    message.success(`已载入 ${data.blocks.length} 个材料块`);
  } catch (error) {
    showErrorMessage(error, '载入材料内容失败');
  } finally {
    annotationMaterialLoading.value = false;
  }
}

async function annotationMaterialAnchorsLoad(showSuccess = true) {
  if (!annotationForm.material_id || !annotationRevisionId.value) {
    message.warning('请先选择材料');
    return;
  }

  const data = await getMaterialAnchorsApi(
    annotationForm.material_id,
    annotationRevisionId.value,
  );
  annotationMaterialAnchors.value = data;
  if (showSuccess) {
    message.success(`已载入 ${data.length} 个可用锚点`);
  }
}

function handleAnchorMaterialChange() {
  anchorMaterialPreview.value = null;
  anchorMaterialAnchors.value = [];
  anchorFocusedAnchorId.value = null;
  anchorImagePointerState.value = null;
  anchorForm.content_hash = null;
  clearAnchorDrafts();
  anchorDraftSequence.value = 0;

  if (anchorForm.material_id) {
    void loadAnchorMaterialBlocks();
  }
}

function handleAnnotationMaterialChange() {
  annotationMaterialAnchors.value = [];
  annotationMaterialPreview.value = null;
  annotationMaterialQuestions.value = [];
  annotationQuestionPreview.value = null;
  annotationFocusedAnchorId.value = null;
  annotationRoleTargetId.value = null;
  annotationForm.question_id = null;
  annotationForm.question_material_id = null;
  annotationForm.candidate_anchor_ids_text = '';
  annotationForm.answer_data_json = '{}';
  annotationForm.content_hash = null;

  if (annotationForm.material_id) {
    void loadAnnotationMaterialBlocks();
  }
}

async function handleAnnotationQuestionChange(questionId?: number) {
  if (!questionId) {
    annotationQuestionPreview.value = null;
    return;
  }

  annotationForm.question_id = questionId;
  fillAnnotationAutoFields();
  await loadAnnotationQuestionPreview();
}

function buildAnchorPayload(): any {
  if (!anchorForm.material_id || anchorForm.material_id < 1) {
    throw new Error('请选择材料');
  }
  if (!anchorForm.anchor_key.trim()) {
    throw new Error('请填写锚点键');
  }

  const payload: any = stripUndefined({
    anchor_key: anchorForm.anchor_key.trim(),
    anchor_type: anchorForm.anchor_type,
    bbox: parseOptionalJsonObject(anchorForm.bbox_json, '矩形区域 JSON'),
    block_id: normalizeString(anchorForm.block_id),
    content_hash: normalizeString(anchorForm.content_hash),
    end_offset: normalizeNumber(anchorForm.end_offset),
    extra_data: parseJsonObject(anchorForm.extra_data_json, '扩展数据 JSON'),
    polygon: parseOptionalJsonArray(anchorForm.polygon_json, '多边形 JSON'),
    source: anchorForm.source,
    start_offset: normalizeNumber(anchorForm.start_offset),
    status: anchorForm.status,
    text: normalizeString(anchorForm.text),
  });

  return sanitizeAnchorPayload(payload);
}

function addCurrentAnchorDraftIfReady(showSuccess = true) {
  if (anchorForm.id) {
    return;
  }

  const payload = buildAnchorPayload();
  const localKey = `${payload.anchor_key}_${Date.now()}_${anchorDrafts.value.length}`;
  anchorDrafts.value = [
    ...anchorDrafts.value,
    {
      local_key: localKey,
      payload,
    },
  ];
  resetAnchorDraftAfterAdd(payload);
  if (showSuccess) {
    message.success(`已加入草稿：${payload.text || payload.anchor_key}`);
  }
}

function hasCurrentAnchorDraft() {
  return Boolean(
    anchorForm.material_id &&
    anchorForm.anchor_key.trim() &&
    anchorForm.block_id,
  );
}

function removeAnchorDraft(localKey: string) {
  anchorDrafts.value = anchorDrafts.value.filter(
    (item) => item.local_key !== localKey,
  );
}

function clearAnchorDrafts() {
  anchorDrafts.value = [];
}

function resetAnchorDraftAfterAdd(payload: any) {
  const materialId = payload.material_id;
  const contentHash = payload.content_hash;
  const source = payload.source || anchorForm.source;
  const status = payload.status ?? anchorForm.status;
  Object.assign(anchorForm, createDefaultAnchorForm(), {
    content_hash: contentHash,
    material_id: materialId,
    source,
    status,
  });
}

function selectAnchorMaterialBlock(block: Record<string, any>) {
  const blockId = String(block.id || block.block_id || '').trim();
  if (!blockId) {
    return;
  }
  anchorForm.block_id = blockId;

  if (isImageBlock(block)) {
    anchorForm.anchor_type = 'image_region';
    (anchorForm as any).asset_url = normalizeString(
      block.asset_url || block.image_url || block.url || block.src,
    );
    (anchorForm as any).natural_width = normalizeInteger(block.natural_width);
    (anchorForm as any).natural_height = normalizeInteger(block.natural_height);
    clearTextAnchorFields();
    return;
  }

  if (anchorForm.anchor_type === 'image_region') {
    anchorForm.anchor_type = 'text_range';
  }
  clearImageAnchorFields();
}

function applyTextSelectionAnchor(block: Record<string, any>) {
  const selectedText = String(window.getSelection()?.toString() || '').trim();
  if (!selectedText) {
    message.warning('请先用鼠标选中材料中的文字');
    return;
  }

  const blockContent = getBlockContent(block);
  const startOffset = blockContent.indexOf(selectedText);
  if (startOffset === -1) {
    message.warning('选中文字不在当前材料块中，请重新选择');
    return;
  }

  const blockId = getBlockId(block);
  anchorForm.anchor_type = 'text_range';
  anchorForm.block_id = blockId;
  anchorForm.text = selectedText;
  anchorForm.start_offset = startOffset;
  anchorForm.end_offset = startOffset + selectedText.length;
  clearImageAnchorFields();
  fillAnchorKeyIfEmpty(blockId, `t${startOffset}`);
  if (!anchorForm.id) {
    addCurrentAnchorDraftIfReady();
    return;
  }
  message.success('已根据选中文字生成文本锚点');
}

function beginAnchorImageSelection(
  block: Record<string, any>,
  event: MouseEvent,
) {
  const pointer = getImageNormalizedPoint(event);
  if (!pointer) {
    return;
  }

  anchorImagePointerState.value = {
    assetUrl: getBlockAssetUrl(block),
    blockId: getBlockId(block),
    currentX: pointer.x,
    currentY: pointer.y,
    startX: pointer.x,
    startY: pointer.y,
  } as any;
}

function updateAnchorImageSelection(
  block: Record<string, any>,
  event: MouseEvent,
) {
  const currentState = anchorImagePointerState.value;
  if (!currentState || currentState.blockId !== getBlockId(block)) {
    return;
  }

  const pointer = getImageNormalizedPoint(event);
  if (!pointer) {
    return;
  }

  anchorImagePointerState.value = {
    ...currentState,
    currentX: pointer.x,
    currentY: pointer.y,
  };
}

function cancelAnchorImageSelection() {
  anchorImagePointerState.value = null;
}

function finishAnchorImageSelection(
  block: Record<string, any>,
  event: MouseEvent,
) {
  const pointer = getImageNormalizedPoint(event);
  const start = anchorImagePointerState.value;
  anchorImagePointerState.value = null;
  if (!pointer || !start) {
    return;
  }

  const blockId = getBlockId(block);
  if (start.blockId !== blockId) {
    return;
  }

  const x = Math.min(start.startX, pointer.x);
  const y = Math.min(start.startY, pointer.y);
  const width = Math.abs(pointer.x - start.startX);
  const height = Math.abs(pointer.y - start.startY);
  const isPoint = width < 0.01 && height < 0.01;

  anchorForm.block_id = blockId;
  (anchorForm as any).asset_url = start.assetUrl;
  (anchorForm as any).natural_width = (start as any).naturalWidth;
  (anchorForm as any).natural_height = (start as any).naturalHeight;
  anchorForm.anchor_type = isPoint ? 'image_point' : 'image_region';
  clearTextAnchorFields();
  anchorForm.bbox_json = toPrettyJson(
    isPoint
      ? { x: roundPosition(pointer.x), y: roundPosition(pointer.y) }
      : {
          height: roundPosition(height),
          width: roundPosition(width),
          x: roundPosition(x),
          y: roundPosition(y),
        },
  );
  fillAnchorKeyIfEmpty(blockId, isPoint ? 'point' : 'region');
  if (!anchorForm.id) {
    addCurrentAnchorDraftIfReady();
    return;
  }
  message.success(isPoint ? '已生成图片点位锚点' : '已生成图片区域锚点');
}

function toggleAnnotationCandidateAnchor(anchor: GetMaterialAnchorDetail) {
  const ids = getAnnotationCandidateIds();
  const exists = ids.includes(anchor.id);
  const nextIds = exists
    ? ids.filter((item) => item !== anchor.id)
    : [...ids, anchor.id];
  setAnnotationCandidateIds(nextIds);
}

function setAnnotationAnswerAnchor(anchor: GetMaterialAnchorDetail) {
  annotationForm.answer_data_json = toPrettyJson(
    buildAnnotationAnswerData(anchor),
  );
  message.success(`已设为正确答案锚点：${anchor.id}`);
}

function isAnnotationCandidateAnchor(anchor: GetMaterialAnchorDetail) {
  return getAnnotationCandidateIds().includes(anchor.id);
}

function isAnnotationAnswerAnchor(anchor: GetMaterialAnchorDetail) {
  return getAnnotationAnswerAnchorIds().includes(anchor.id);
}

function getAnchorsByBlock(blockId: string) {
  return annotationMaterialAnchors.value.filter(
    (item) => item.block_id === blockId,
  );
}

function getAnnotationAnchorRoleMap(): Record<string, string> {
  try {
    const config = parseJsonObject(annotationForm.config_json, '配置 JSON');
    const rawRoles = config.anchor_roles;
    if (!rawRoles || typeof rawRoles !== 'object' || Array.isArray(rawRoles)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(rawRoles).filter(
        ([anchorId, role]) =>
          Boolean(Number(anchorId)) && typeof role === 'string' && role,
      ),
    );
  } catch {
    return {};
  }
}

function getAnnotationAnchorRole(anchorId: null | number) {
  if (!anchorId) {
    return null;
  }
  return getAnnotationAnchorRoleMap()[String(anchorId)] || null;
}

function selectAnnotationAnchorRole(anchor: GetMaterialAnchorDetail) {
  annotationRoleTargetId.value = anchor.id;
  annotationFocusedAnchorId.value = anchor.id;
}

function updateAnnotationAnchorRole(value: null | string = null) {
  const anchorId = annotationRoleTargetId.value;
  if (!anchorId) {
    return;
  }

  const config = parseJsonObject(annotationForm.config_json, '配置 JSON');
  const anchorRoles = getAnnotationAnchorRoleMap();
  if (value) {
    anchorRoles[String(anchorId)] = value;
  } else {
    delete anchorRoles[String(anchorId)];
  }
  config.anchor_roles = anchorRoles;
  annotationForm.config_json = toPrettyJson(config);
  annotationRoleTargetId.value = null;
  message.success(value ? '本题锚点 role 已更新' : '本题锚点 role 已清除');
}

function handleAnnotationRolePopoverOpenChange(
  open: boolean,
  anchorId: number,
) {
  if (!open && annotationRoleTargetId.value === anchorId) {
    annotationRoleTargetId.value = null;
  }
}

function getAnnotationCandidateIds() {
  try {
    return parseAnchorIds(annotationForm.candidate_anchor_ids_text);
  } catch {
    return [];
  }
}

function setAnnotationCandidateIds(ids: number[]) {
  annotationForm.candidate_anchor_ids_text = [...new Set(ids)].join(', ');
}

function getAnnotationAnswerAnchorIds() {
  try {
    const answerData = parseJsonObject(
      annotationForm.answer_data_json,
      '答案 JSON',
    );
    const correct = answerData.correct ?? answerData.anchor_ids;
    return extractAnchorIds(correct);
  } catch {
    return [];
  }
}

function buildAnnotationAnswerData(anchor: GetMaterialAnchorDetail) {
  const anchorId = String(anchor.id);
  if (annotationForm.selection_mode === 'multiple') {
    return {
      correct: [...new Set([...getAnnotationAnswerAnchorIds(), anchor.id])].map(
        String,
      ),
    };
  }

  if (annotationForm.selection_mode === 'multi_role') {
    const answerData = parseJsonObject(
      annotationForm.answer_data_json,
      '答案 JSON',
    );
    const correct = answerData.correct;
    const current =
      correct && typeof correct === 'object' && !Array.isArray(correct)
        ? (correct as Record<string, unknown>)
        : {};
    const roleKey = getAnnotationAnchorRole(anchor.id) || `anchor_${anchor.id}`;
    return {
      correct: {
        ...current,
        [roleKey]: anchorId,
      },
    };
  }

  return { correct: anchorId };
}

function buildAnnotationAnswerRemovalData(anchor: GetMaterialAnchorDetail) {
  const anchorId = String(anchor.id);
  const answerData = parseJsonObject(
    annotationForm.answer_data_json,
    '答案 JSON',
  );
  const correct = answerData.correct ?? answerData.anchor_ids;

  if (annotationForm.selection_mode === 'multiple') {
    const ids = extractAnchorIds(correct).filter((item) => item !== anchor.id);
    return { correct: ids.map(String) };
  }

  if (
    annotationForm.selection_mode === 'multi_role' &&
    correct &&
    typeof correct === 'object' &&
    !Array.isArray(correct)
  ) {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      correct as Record<string, unknown>,
    )) {
      if (String(value) !== anchorId) {
        next[key] = value;
      }
    }
    return { correct: next };
  }

  if (String(correct ?? '') === anchorId) {
    return { correct: [] };
  }
  return answerData;
}

function toggleAnnotationAnswerFromPopover() {
  const anchorId = annotationRoleTargetId.value;
  const anchor = annotationMaterialAnchors.value.find(
    (item) => item.id === anchorId,
  );
  if (!anchor) {
    return;
  }
  if (isAnnotationAnswerAnchor(anchor)) {
    annotationForm.answer_data_json = toPrettyJson(
      buildAnnotationAnswerRemovalData(anchor),
    );
    message.success(`已移除答案锚点：${anchor.id}`);
  } else {
    annotationForm.answer_data_json = toPrettyJson(
      buildAnnotationAnswerData(anchor),
    );
    message.success(`已设为正确答案锚点：${anchor.id}`);
  }
}

const annotationRoleTargetIsAnswer = computed(() => {
  const anchorId = annotationRoleTargetId.value;
  if (!anchorId) {
    return false;
  }
  return getAnnotationAnswerAnchorIds().includes(anchorId);
});

function extractAnchorIds(value: unknown): number[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const anchorId = Number(value);
    if (!Number.isInteger(anchorId) || anchorId < 1) {
      return [];
    }
    return [anchorId];
  }

  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => extractAnchorIds(item)))];
  }

  if (typeof value === 'object') {
    return [
      ...new Set(
        Object.values(value as Record<string, unknown>).flatMap((item) =>
          extractAnchorIds(item),
        ),
      ),
    ];
  }

  return [];
}

function fillAnchorKeyIfEmpty(blockId: string, suffix: string) {
  if (anchorForm.anchor_key.trim()) {
    return;
  }

  const materialId = anchorForm.material_id || 'm';
  const safeBlockId = blockId.replaceAll(/[^a-zA-Z0-9_]/g, '_');
  anchorDraftSequence.value += 1;
  const sequence = anchorDraftSequence.value;
  anchorForm.anchor_key = `m${materialId}_${safeBlockId}_${suffix}_${sequence}`;
}

function getImageNormalizedPoint(event: MouseEvent) {
  const image = event.currentTarget;
  if (!(image instanceof HTMLImageElement)) {
    return null;
  }

  const rect = image.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return {
    x: clampPosition((event.clientX - rect.left) / rect.width),
    y: clampPosition((event.clientY - rect.top) / rect.height),
  };
}

function clampPosition(value: number) {
  return Math.min(1, Math.max(0, value));
}

function roundPosition(value: number) {
  return Number(value.toFixed(6));
}

function fillAnnotationAutoFields() {
  if (!annotationForm.question_id) {
    return;
  }

  const questionId = Number(annotationForm.question_id);
  const interactionType = annotationForm.interaction_type || 'numberLocate';
  if (!annotationForm.annotation_key.trim()) {
    annotationForm.annotation_key = `q${questionId}_${toSnakeCase(interactionType)}`;
  }

  if (!normalizeString(annotationForm.title)) {
    annotationForm.title = `题目 ${questionId} 交互标注`;
  }

  if (!annotationForm.instruction.trim()) {
    annotationForm.instruction = '请在材料中点击题目要求对应的数据或位置';
  }
}

function buildAnnotationPayload(): CreateQuestionInteractionParam {
  fillAnnotationAutoFields();
  if (!annotationForm.question_id || annotationForm.question_id < 1) {
    throw new Error('请先选择题目');
  }
  if (!annotationForm.annotation_key.trim()) {
    throw new Error('请填写标注键');
  }
  if (!annotationForm.interaction_type.trim()) {
    throw new Error('请填写交互类型');
  }
  if (!annotationForm.instruction.trim()) {
    throw new Error('请填写交互指令');
  }
  const candidateAnchorIds = parseAnchorIds(
    annotationForm.candidate_anchor_ids_text,
  );

  const answerData = parseJsonObject(
    annotationForm.answer_data_json,
    '答案 JSON',
  );
  if (getAnnotationAnswerAnchorIds().length === 0) {
    throw new Error('请先设置正确答案锚点');
  }

  const config = parseJsonObject(annotationForm.config_json, '配置 JSON');
  config.answer_data = answerData;

  const interactionKey = (
    annotationForm.annotation_key ||
    (annotationForm as any).interaction_key ||
    ''
  ).trim();
  const candidatesPayload = candidateAnchorIds.map((anchorId, idx) => ({
    anchor_id: anchorId,
    candidate_role: getAnnotationAnchorRole(anchorId) || '',
    sort_order: idx,
  }));

  const hasCandidates = candidateAnchorIds.length > 0;
  const statusStr =
    typeof annotationForm.status === 'number'
      ? annotationForm.status === 10
        ? 'active'
        : 'draft'
      : annotationForm.status || 'draft';

  return stripUndefined({
    interaction_key: interactionKey,
    annotation_key: interactionKey,
    instruction: annotationForm.instruction.trim(),
    interaction_type: annotationForm.interaction_type.trim(),
    title: normalizeString(annotationForm.title),
    selection_mode: annotationForm.selection_mode,
    status: statusStr,
    config,
    candidates: candidatesPayload,
    question_material_id: normalizeNumber(annotationForm.question_material_id),
    min_selections:
      hasCandidates && annotationForm.selection_mode === 'single' ? 1 : 0,
    max_selections: hasCandidates
      ? annotationForm.selection_mode === 'single'
        ? 1
        : candidateAnchorIds.length
      : undefined,
  }) as unknown as any;
}

function parseAnchorIds(value: string): number[] {
  const text = value.trim();
  if (!text) {
    return [];
  }

  const ids = text
    .split(/[,\s，]+/)
    .filter(Boolean)
    .map(Number);

  const invalid = ids.some((item) => !Number.isInteger(item) || item < 1);
  if (invalid) {
    throw new Error('候选锚点 ID 必须是正整数，多个 ID 用逗号或换行分隔');
  }

  return [...new Set(ids)];
}

function parseJsonObject(value: string, label: string): JsonObject {
  const text = value.trim() || '{}';
  const data = JSON.parse(text) as unknown;
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new TypeError(`${label} 必须是 JSON 对象`);
  }
  return data as JsonObject;
}

function parseOptionalJsonObject(
  value: string,
  label: string,
): JsonObject | null {
  const text = value.trim();
  if (!text) {
    return null;
  }
  return parseJsonObject(text, label);
}

function parseOptionalJsonArray(
  value: string,
  label: string,
): JsonObject[] | null {
  const text = value.trim();
  if (!text) {
    return null;
  }

  const data = JSON.parse(text) as unknown;
  if (!Array.isArray(data)) {
    throw new TypeError(`${label} 必须是 JSON 数组`);
  }
  return data as JsonObject[];
}

function toPrettyJson(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return JSON.stringify(value, null, 2);
}

function normalizeString(value?: null | string): null | string {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizeNumber(value?: null | number): null | number {
  if (value === null || value === undefined) {
    return null;
  }
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return null;
  }
  return numberValue;
}

function normalizeInteger(value?: null | number): null | number {
  const numberValue = normalizeNumber(value);
  if (numberValue === null) {
    return null;
  }
  return Math.round(numberValue);
}

function stripHtml(value: string) {
  return value
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value || '无题干';
  }
  return `${value.slice(0, maxLength)}…`;
}

function toSnakeCase(value: string) {
  return value
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replaceAll(/[^a-zA-Z0-9]+/g, '_')
    .replaceAll(/^_+|_+$/g, '')
    .toLowerCase();
}

function stripUndefined(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
}

function cleanParams(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => {
      return value !== undefined && value !== null && value !== '';
    }),
  );
}

function getStatusMeta(status?: string) {
  if (status === 'active') return { color: 'success', label: '可用' };
  if (status === 'retired') return { color: 'default', label: '废弃' };
  return { color: 'warning', label: '草稿' };
}

function isImageBlock(block: Record<string, any>) {
  return ['image', 'img', 'picture'].includes(
    String(block.type || '').toLowerCase(),
  );
}

function getBlockId(block: Record<string, any>) {
  return String(block.id || block.block_id || block.key || '');
}

function getBlockTitle(block: Record<string, any>, index: number) {
  return String(block.title || block.type || `材料块 ${index + 1}`);
}

function getBlockContent(block: Record<string, any>) {
  return String(block.content || block.text || '');
}

function getBlockAssetUrl(block: Record<string, any>) {
  return String(
    block.asset_url || block.image_url || block.url || block.src || '',
  );
}

function getTextBlockSegments(block: Record<string, any>) {
  const content = getBlockContent(block);
  const ranges = getAnchorVisualItems(getBlockId(block))
    .filter((item) => !isImageAnchorType(item.anchor_type))
    .map((item) => {
      const startOffset = getAnchorStartOffset(item, content);
      const endOffset = getAnchorEndOffset(item, startOffset);
      return {
        draft: item.draft,
        endOffset,
        key: item.key,
        startOffset,
      };
    })
    .filter(
      (item) => item.startOffset >= 0 && item.endOffset > item.startOffset,
    )
    .toSorted((left, right) => left.startOffset - right.startOffset);

  const segments: Array<{
    draft: boolean;
    highlighted: boolean;
    key: string;
    text: string;
  }> = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.startOffset < cursor) {
      continue;
    }
    if (range.startOffset > cursor) {
      segments.push({
        draft: false,
        highlighted: false,
        key: `plain-${cursor}-${range.startOffset}`,
        text: content.slice(cursor, range.startOffset),
      });
    }

    const safeEnd = Math.min(range.endOffset, content.length);
    segments.push({
      draft: range.draft,
      highlighted: true,
      key: range.key,
      text: content.slice(range.startOffset, safeEnd),
    });
    cursor = safeEnd;
  }

  if (cursor < content.length) {
    segments.push({
      draft: false,
      highlighted: false,
      key: `plain-${cursor}-end`,
      text: content.slice(cursor),
    });
  }

  return segments;
}

function getImageBlockMarkers(block: Record<string, any>) {
  return getAnchorVisualItems(getBlockId(block))
    .filter((item) => isImageAnchorType(item.anchor_type))
    .map((item) => {
      const bbox = item.bbox || {};
      const x = normalizeRatio(bbox.x);
      const y = normalizeRatio(bbox.y);
      const width = normalizeRatio(bbox.width);
      const height = normalizeRatio(bbox.height);
      const isPoint =
        item.anchor_type === 'image_point' || width <= 0 || height <= 0;

      return {
        active:
          typeof item.id === 'number' &&
          (item.id === anchorFocusedAnchorId.value ||
            item.id === anchorForm.id),
        answer: false,
        candidate: false,
        draft: item.draft,
        id: item.id,
        isPoint,
        key: item.key,
        label: item.label,
        style: isPoint
          ? {
              left: `${x * 100}%`,
              top: `${y * 100}%`,
            }
          : {
              height: `${height * 100}%`,
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: `${width * 100}%`,
            },
      };
    });
}

function getAnnotationImageBlockMarkers(block: Record<string, any>) {
  return getAnchorsByBlock(getBlockId(block))
    .filter((item) => isImageAnchorType(item.anchor_type))
    .map((item) => {
      const bbox = item.bbox || {};
      const x = normalizeRatio(bbox.x);
      const y = normalizeRatio(bbox.y);
      const width = normalizeRatio(bbox.width);
      const height = normalizeRatio(bbox.height);
      const isPoint =
        item.anchor_type === 'image_point' || width <= 0 || height <= 0;

      return {
        anchor: item,
        active: item.id === annotationFocusedAnchorId.value,
        answer: isAnnotationAnswerAnchor(item),
        candidate: isAnnotationCandidateAnchor(item),
        draft: false,
        id: item.id,
        isPoint,
        key: `annotation-${item.id}`,
        label: `#${item.id}`,
        role: getAnnotationAnchorRole(item.id),
        selected: item.id === annotationRoleTargetId.value,
        style: isPoint
          ? {
              left: `${x * 100}%`,
              top: `${y * 100}%`,
            }
          : {
              height: `${height * 100}%`,
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: `${width * 100}%`,
            },
      };
    });
}

function getAnnotationTextBlockSegments(block: Record<string, any>) {
  const content = getBlockContent(block);
  const ranges = getAnchorsByBlock(getBlockId(block))
    .filter((item) => !isImageAnchorType(item.anchor_type))
    .map((anchor) => {
      const startOffset = getAnchorStartOffset(anchor, content);
      const endOffset = getAnchorEndOffset(anchor, startOffset);
      return {
        anchor,
        endOffset,
        role: getAnnotationAnchorRole(anchor.id),
        startOffset,
      };
    })
    .filter(
      (item) => item.startOffset >= 0 && item.endOffset > item.startOffset,
    )
    .toSorted((left, right) => left.startOffset - right.startOffset);

  const segments: Array<{
    anchor: GetMaterialAnchorDetail | null;
    endOffset: number;
    role: null | string;
    selected: boolean;
    startOffset: number;
    text: string;
  }> = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.startOffset < cursor) {
      continue;
    }
    if (range.startOffset > cursor) {
      segments.push({
        anchor: null,
        endOffset: range.startOffset,
        role: null,
        selected: false,
        startOffset: cursor,
        text: content.slice(cursor, range.startOffset),
      });
    }

    const safeEnd = Math.min(range.endOffset, content.length);
    segments.push({
      anchor: range.anchor,
      endOffset: safeEnd,
      role: range.role,
      selected: range.anchor.id === annotationRoleTargetId.value,
      startOffset: range.startOffset,
      text: content.slice(range.startOffset, safeEnd),
    });
    cursor = safeEnd;
  }

  if (cursor < content.length) {
    segments.push({
      anchor: null,
      endOffset: content.length,
      role: null,
      selected: false,
      startOffset: cursor,
      text: content.slice(cursor),
    });
  }

  return segments;
}

function getImageSelectionPreview(block: Record<string, any>) {
  const currentState = anchorImagePointerState.value;
  if (!currentState || currentState.blockId !== getBlockId(block)) {
    return null;
  }

  const x = Math.min(currentState.startX, currentState.currentX);
  const y = Math.min(currentState.startY, currentState.currentY);
  const width = Math.abs(currentState.currentX - currentState.startX);
  const height = Math.abs(currentState.currentY - currentState.startY);
  if (width < 0.01 && height < 0.01) {
    return {
      isPoint: true,
      style: {
        left: `${currentState.currentX * 100}%`,
        top: `${currentState.currentY * 100}%`,
      },
    };
  }

  return {
    isPoint: false,
    style: {
      height: `${height * 100}%`,
      left: `${x * 100}%`,
      top: `${y * 100}%`,
      width: `${width * 100}%`,
    },
  };
}

function getAnchorVisualItems(blockId: string) {
  const savedItems = anchorMaterialAnchors.value
    .filter((item) => item.block_id === blockId)
    .map((item) => ({
      anchor_type: item.anchor_type,
      bbox: item.bbox,
      draft: false,
      end_offset: item.end_offset,
      id: item.id,
      key: `saved-${item.id}`,
      label: `#${item.id}`,
      start_offset: item.start_offset,
      text: item.text,
    }));

  const draftItems = anchorDrafts.value
    .filter((item) => item.payload.block_id === blockId)
    .map((item, index) => ({
      anchor_type: item.payload.anchor_type,
      bbox: item.payload.bbox,
      draft: true,
      end_offset: item.payload.end_offset,
      id: null,
      key: `draft-${item.local_key}`,
      label: `草稿 ${index + 1}`,
      start_offset: item.payload.start_offset,
      text: item.payload.text,
    }));

  return [...savedItems, ...draftItems];
}

function getAnchorStartOffset(
  item: { start_offset?: null | number; text?: null | string },
  content: string,
) {
  if (typeof item.start_offset === 'number') {
    return item.start_offset;
  }
  const text = String(item.text || '');
  if (!text) {
    return -1;
  }
  return content.indexOf(text);
}

function getAnchorEndOffset(
  item: { end_offset?: null | number; text?: null | string },
  startOffset: number,
) {
  if (typeof item.end_offset === 'number') {
    return item.end_offset;
  }
  return startOffset + String(item.text || '').length;
}

function isImageAnchorType(anchorType?: string) {
  return ['image_point', 'image_region'].includes(String(anchorType || ''));
}

function formatAnchorDisplayText(anchor: GetMaterialAnchorDetail) {
  if (isImageAnchorType(anchor.anchor_type)) {
    return formatAnchorPosition(anchor);
  }

  return anchor.text || anchor.anchor_key;
}

function getAnchorRoleLabel(role?: null | string) {
  if (!role) {
    return '';
  }

  const option = dataAnalysisAnchorRoleOptions.find(
    (item) => item.value === role,
  );
  return option?.label || role;
}

function sanitizeAnchorPayload(payload: CreateMaterialAnchorParam) {
  if (isImageAnchorType(payload.anchor_type)) {
    return {
      ...payload,
      end_offset: null,
      ocr_confidence: null,
      start_offset: null,
      table_cell: null,
      text: null,
    };
  }

  if (
    payload.anchor_type === 'text_range' ||
    payload.anchor_type === 'text_block'
  ) {
    return {
      ...payload,
      asset_hash: null,
      asset_url: null,
      bbox: null,
      natural_height: null,
      natural_width: null,
      ocr_confidence: null,
      polygon: null,
      table_cell: null,
    };
  }

  return payload;
}

function clearTextAnchorFields() {
  anchorForm.text = null;
  anchorForm.start_offset = null;
  anchorForm.end_offset = null;
  anchorForm.table_cell_json = '';
}

function clearImageAnchorFields() {
  (anchorForm as any).asset_hash = null;
  (anchorForm as any).asset_url = null;
  anchorForm.bbox_json = '';
  (anchorForm as any).natural_height = null;
  (anchorForm as any).natural_width = null;
  (anchorForm as any).ocr_confidence = null;
  anchorForm.polygon_json = '';
}

function formatAnchorPosition(anchor: GetMaterialAnchorDetail) {
  const bbox = anchor.bbox || {};
  const x = Math.round(normalizeRatio(bbox.x) * 1000) / 10;
  const y = Math.round(normalizeRatio(bbox.y) * 1000) / 10;
  const width = Math.round(normalizeRatio(bbox.width) * 1000) / 10;
  const height = Math.round(normalizeRatio(bbox.height) * 1000) / 10;
  if (anchor.anchor_type === 'image_point' || width <= 0 || height <= 0) {
    return `点位 x:${x}% y:${y}%`;
  }
  return `区域 x:${x}% y:${y}% w:${width}% h:${height}%`;
}

function normalizeRatio(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  return clampPosition(numberValue);
}

function showErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    message.error(error.message);
    return;
  }
  message.error(fallback);
}
</script>

<template>
  <Page auto-content-height content-class="flex h-full min-h-0 flex-col">
    <a-alert
      class="mb-3"
      message="交互标注用于资料、图表、表格等材料的可点击定位。材料锚点是可点目标，题目交互标注负责把题目、候选锚点和答案规则关联起来。"
      show-icon
      type="info"
    />

    <AnnotationGrid class="h-full">
      <template #toolbar-actions>
        <VbenButton @click="openCreateAnnotation">
          <MaterialSymbolsAdd class="size-5" />
          新增标注
        </VbenButton>
      </template>

      <template #interaction_type_default="{ row }">
        <a-tag color="purple">{{ row.interaction_type }}</a-tag>
      </template>

      <template #candidate_anchor_ids_default="{ row }">
        {{ (row as any).candidates?.length || 0 }} 个
      </template>

      <template #status_default="{ row }">
        <a-tag :color="getStatusMeta((row as any).status).color">
          {{ getStatusMeta((row as any).status).label }}
        </a-tag>
      </template>

      <template #annotation_operation_default="{ row }">
        <a-space>
          <a-button size="small" type="link" @click="openEditAnnotation(row)">
            编辑
          </a-button>
          <a-button
            danger
            size="small"
            type="link"
            @click="confirmDeleteAnnotation(row)"
          >
            删除
          </a-button>
        </a-space>
      </template>
    </AnnotationGrid>

    <a-drawer
      v-model:open="anchorDrawerOpen"
      :destroy-on-close="true"
      :title="anchorDrawerTitle"
      width="760"
    >
      <a-form layout="vertical" :model="anchorForm">
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <a-form-item label="材料" required>
            <div class="flex gap-2">
              <MaterialSearchSelect
                v-model:value="anchorForm.material_id"
                class="min-w-0 flex-1"
                :disabled="!!anchorForm.id"
                @change="handleAnchorMaterialChange"
              />
              <a-button
                class="shrink-0"
                :loading="anchorMaterialLoading"
                @click="loadAnchorMaterialBlocks"
              >
                载入材料
              </a-button>
            </div>
          </a-form-item>
          <a-form-item label="状态">
            <a-select
              v-model:value="anchorForm.status"
              :options="statusOptions"
            />
          </a-form-item>
        </div>

        <a-card
          v-if="anchorMaterialPreview"
          class="mb-4"
          size="small"
          :title="`材料内容：${anchorMaterialPreview.title}`"
        >
          <div class="mb-3 text-xs text-muted-foreground">
            文本块：用鼠标选中文字后松开即可生成文本锚点；图片块：按住拖拽生成区域，轻点生成点位。
          </div>
          <div class="mb-3 text-xs text-muted-foreground">
            文本块用鼠标选中文字，图片块按住拖拽生成区域，轻点生成点位；role
            请在题目交互标注中按题目设置。
          </div>
          <div class="space-y-3">
            <div
              v-for="(block, index) in anchorMaterialPreview.blocks"
              :key="`${getBlockId(block)}-${index}`"
              class="material-block-preview rounded border p-3 transition hover:border-blue-400 hover:bg-blue-50"
              :class="{
                'border-blue-500 bg-blue-50':
                  anchorForm.block_id === getBlockId(block),
              }"
            >
              <div class="mb-2 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <a-tag :color="isImageBlock(block) ? 'purple' : 'blue'">
                    {{ block.type }}
                  </a-tag>
                  <span class="font-medium">{{ getBlockId(block) }}</span>
                  <span class="text-muted-foreground">
                    {{ getBlockTitle(block, index) }}
                  </span>
                </div>
                <a-button
                  size="small"
                  type="link"
                  @click="selectAnchorMaterialBlock(block)"
                >
                  只选中块
                </a-button>
              </div>
              <div
                v-if="isImageBlock(block)"
                class="relative inline-block max-w-full"
              >
                <img
                  class="material-anchor-image max-w-full cursor-crosshair rounded border"
                  :src="getBlockAssetUrl(block)"
                  @mousedown.prevent="beginAnchorImageSelection(block, $event)"
                  @mouseleave="cancelAnchorImageSelection"
                  @mousemove.prevent="updateAnchorImageSelection(block, $event)"
                  @mouseup.prevent="finishAnchorImageSelection(block, $event)"
                />
                <span
                  v-if="getImageSelectionPreview(block)"
                  class="material-anchor-marker material-anchor-marker--draft material-anchor-marker--preview"
                  :class="{
                    'material-anchor-marker--point':
                      getImageSelectionPreview(block)?.isPoint,
                  }"
                  :style="getImageSelectionPreview(block)?.style"
                >
                  <span class="material-anchor-marker-label">选择中</span>
                </span>
                <span
                  v-for="marker in getImageBlockMarkers(block)"
                  :key="marker.key"
                  class="material-anchor-marker"
                  :class="{
                    'material-anchor-marker--active': marker.active,
                    'material-anchor-marker--draft': marker.draft,
                    'material-anchor-marker--point': marker.isPoint,
                  }"
                  :style="marker.style"
                >
                  <span class="material-anchor-marker-label">{{
                    marker.label
                  }}</span>
                </span>
              </div>
              <div
                v-else
                class="max-h-60 cursor-text overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-sm leading-7 text-gray-700"
                @mouseup.stop="applyTextSelectionAnchor(block)"
              >
                <span
                  v-for="segment in getTextBlockSegments(block)"
                  :key="segment.key"
                  :class="{
                    'material-anchor-highlight': segment.highlighted,
                    'material-anchor-highlight--draft':
                      segment.highlighted && segment.draft,
                  }"
                >
                  {{ segment.text }}
                </span>
              </div>
            </div>
          </div>
        </a-card>

        <a-card
          v-if="!anchorForm.id"
          class="mb-4"
          size="small"
          :title="`待保存锚点草稿：${anchorDrafts.length} 个`"
        >
          <div v-if="anchorDrafts.length > 0" class="space-y-2">
            <div
              v-for="draft in anchorDrafts"
              :key="draft.local_key"
              class="flex flex-wrap items-center justify-between gap-2 rounded border bg-white p-2"
            >
              <div class="min-w-0 flex-1">
                <div class="mb-1 flex flex-wrap items-center gap-2">
                  <a-tag color="blue">{{ draft.payload.anchor_type }}</a-tag>
                  <a-tag>{{ draft.payload.block_id || '无 block' }}</a-tag>
                  <span class="text-xs text-muted-foreground">
                    {{ draft.payload.anchor_key }}
                  </span>
                </div>
                <div class="truncate text-sm">
                  {{
                    draft.payload.text ||
                    (draft.payload as any).asset_url ||
                    draft.payload.anchor_key
                  }}
                </div>
              </div>
              <a-button
                danger
                size="small"
                @click="removeAnchorDraft(draft.local_key)"
              >
                移除
              </a-button>
            </div>
          </div>
          <a-empty
            v-else
            description="还没有草稿：请在材料中划选文字或框选图片区域"
          />
          <template v-if="anchorDrafts.length > 0" #extra>
            <a-button danger size="small" @click="clearAnchorDrafts">
              清空草稿
            </a-button>
          </template>
        </a-card>

        <a-card
          v-if="anchorForm.id"
          class="mb-4"
          size="small"
          title="当前锚点结果"
        >
          <a-descriptions :column="2" size="small">
            <a-descriptions-item label="块 ID">
              {{ anchorForm.block_id || '未选择' }}
            </a-descriptions-item>
            <a-descriptions-item label="类型">
              {{ anchorForm.anchor_type }}
            </a-descriptions-item>
            <a-descriptions-item label="文本">
              {{ anchorForm.text || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="文本偏移">
              {{
                anchorForm.start_offset === null ||
                anchorForm.start_offset === undefined
                  ? '-'
                  : `${anchorForm.start_offset} - ${anchorForm.end_offset}`
              }}
            </a-descriptions-item>
            <a-descriptions-item label="区域/点位" :span="2">
              <code>{{ anchorForm.bbox_json || '-' }}</code>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card
          v-if="anchorMaterialPreview"
          class="mb-4"
          size="small"
          :title="`本材料已有锚点：${anchorMaterialAnchors.length} 个`"
        >
          <div v-if="anchorMaterialAnchors.length > 0" class="space-y-2">
            <div
              v-for="anchor in anchorMaterialAnchors"
              :key="anchor.id"
              class="flex flex-wrap items-center gap-2 rounded border bg-white p-2"
              :class="{
                'border-blue-400 bg-blue-50':
                  anchorFocusedAnchorId === anchor.id,
              }"
              @mouseenter="anchorFocusedAnchorId = anchor.id"
              @mouseleave="anchorFocusedAnchorId = null"
            >
              <a-tag color="blue">#{{ anchor.id }}</a-tag>
              <a-tag>{{ anchor.anchor_type }}</a-tag>
              <a-tag>{{ anchor.block_id || '无 block' }}</a-tag>
              <span class="truncate text-sm">
                {{ formatAnchorDisplayText(anchor) }}
              </span>
            </div>
          </div>
          <a-empty v-else description="这个材料还没有已保存锚点" />
        </a-card>
      </a-form>

      <div class="drawer-footer">
        <a-space>
          <a-button @click="anchorDrawerOpen = false">取消</a-button>
          <a-button
            type="primary"
            :loading="anchorSubmitting"
            @click="submitAnchor"
          >
            {{ anchorForm.id ? '保存' : `确定保存 ${anchorDrafts.length} 个` }}
          </a-button>
        </a-space>
      </div>
    </a-drawer>

    <a-drawer
      v-model:open="annotationDrawerOpen"
      :destroy-on-close="true"
      :title="annotationDrawerTitle"
      width="800"
    >
      <a-form layout="vertical" :model="annotationForm">
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <a-form-item label="材料" required>
            <div class="flex gap-2">
              <MaterialSearchSelect
                v-model:value="annotationForm.material_id"
                class="min-w-0 flex-1"
                :disabled="!!annotationForm.id"
                @change="handleAnnotationMaterialChange"
              />
              <a-button
                class="shrink-0"
                :loading="annotationMaterialLoading"
                @click="loadAnnotationMaterialBlocks"
              >
                载入材料
              </a-button>
            </div>
          </a-form-item>
          <a-form-item label="题目" required>
            <a-select
              v-model:value="annotationForm.question_id"
              :disabled="
                !!annotationForm.id || annotationMaterialQuestions.length === 0
              "
              :loading="questionPreviewLoading"
              :options="annotationQuestionOptions"
              option-filter-prop="label"
              placeholder="载入材料后选择关联题目"
              show-search
              @change="handleAnnotationQuestionChange"
            />
          </a-form-item>
          <a-form-item label="交互类型" required>
            <a-select
              v-model:value="annotationForm.interaction_type"
              :options="interactionTypeOptions"
              show-search
              @change="fillAnnotationAutoFields"
            />
          </a-form-item>
          <a-form-item label="选择模式">
            <a-select
              v-model:value="annotationForm.selection_mode"
              :options="selectionModeOptions"
            />
          </a-form-item>
        </div>

        <a-card
          v-if="annotationQuestionPreview"
          class="mb-4"
          size="small"
          :title="`题目内容：ID ${annotationQuestionPreview.id}`"
        >
          <div class="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span
              >题型：{{
                (annotationQuestionPreview as any).question_type
              }}</span
            >
            <span>难度：{{ annotationQuestionPreview.difficulty }}</span>
            <span>
              材料：
              {{
                (annotationQuestionPreview as any).material_ids?.length
                  ? (annotationQuestionPreview as any).material_ids.join(', ')
                  : '无'
              }}
            </span>
          </div>
          <!-- eslint-disable vue/no-v-html -->
          <div
            class="question-preview-rich rounded bg-gray-50 p-3 text-sm leading-7"
            v-html="annotationQuestionPreview.stem"
          ></div>
          <div
            v-if="annotationQuestionPreview.options?.length"
            class="mt-3 space-y-2"
          >
            <div
              v-for="option in annotationQuestionPreview.options"
              :key="option.option_code"
              class="rounded border bg-white p-2 text-sm"
            >
              <span class="mr-2 font-medium">{{ option.option_code }}.</span>
              <span v-html="option.content"></span>
            </div>
          </div>
          <!-- eslint-enable vue/no-v-html -->
        </a-card>

        <a-card
          v-if="annotationMaterialPreview"
          class="mb-4"
          size="small"
          :title="`材料内容：${annotationMaterialPreview.title}`"
        >
          <div class="mb-3 text-xs text-muted-foreground">
            点击材料中的锚点可设为正确答案或设置
            role；锚点本身请先在“材料锚点”里用鼠标标好。
          </div>
          <div class="space-y-3">
            <div
              v-for="(block, index) in annotationMaterialPreview.blocks"
              :key="`${getBlockId(block)}-${index}`"
              class="material-block-preview rounded border p-3"
            >
              <div class="mb-2 flex items-center gap-2">
                <a-tag :color="isImageBlock(block) ? 'purple' : 'blue'">
                  {{ block.type }}
                </a-tag>
                <span class="font-medium">{{ getBlockId(block) }}</span>
                <span class="text-muted-foreground">
                  {{ getBlockTitle(block, index) }}
                </span>
              </div>
              <div
                v-if="isImageBlock(block)"
                class="relative inline-block max-w-full"
              >
                <img
                  class="material-anchor-image max-w-full rounded border"
                  :src="getBlockAssetUrl(block)"
                />
                <template
                  v-for="marker in getAnnotationImageBlockMarkers(block)"
                  :key="marker.key"
                >
                  <a-popover
                    placement="right"
                    trigger="click"
                    :open="annotationRoleTargetId === marker.id"
                    @open-change="
                      (open) =>
                        handleAnnotationRolePopoverOpenChange(open, marker.id)
                    "
                  >
                    <template #content>
                      <div class="anchor-role-popover">
                        <div class="mb-1 font-medium">锚点设置</div>
                        <div
                          class="mb-2 max-w-60 truncate text-xs text-muted-foreground"
                        >
                          {{ formatAnchorDisplayText(marker.anchor) }}
                        </div>
                        <a-select
                          :value="annotationRoleValue"
                          allow-clear
                          class="w-full"
                          :options="dataAnalysisAnchorRoleOptions"
                          placeholder="选择 role"
                          @change="updateAnnotationAnchorRole"
                        />
                        <a-button
                          block
                          class="mt-2"
                          danger
                          :type="
                            annotationRoleTargetIsAnswer ? 'primary' : 'default'
                          "
                          size="small"
                          @click="toggleAnnotationAnswerFromPopover"
                        >
                          {{
                            annotationRoleTargetIsAnswer
                              ? '移除答案'
                              : '设为答案'
                          }}
                        </a-button>
                      </div>
                    </template>
                    <span
                      class="material-anchor-marker material-anchor-marker--selectable"
                      :class="{
                        'material-anchor-marker--active': marker.active,
                        'material-anchor-marker--answer': marker.answer,
                        'material-anchor-marker--candidate': marker.candidate,
                        'material-anchor-marker--point': marker.isPoint,
                        'material-anchor-marker--selected': marker.selected,
                      }"
                      :style="marker.style"
                      @click.stop="selectAnnotationAnchorRole(marker.anchor)"
                    >
                      <span class="material-anchor-marker-label">{{
                        marker.label
                      }}</span>
                    </span>
                  </a-popover>
                </template>
              </div>
              <div
                v-else
                class="max-h-40 overflow-auto whitespace-pre-wrap text-sm leading-7 text-gray-700"
              >
                <template
                  v-for="segment in getAnnotationTextBlockSegments(block)"
                  :key="`${getBlockId(block)}-${segment.startOffset}`"
                >
                  <a-popover
                    v-if="segment.anchor"
                    placement="right"
                    trigger="click"
                    :open="annotationRoleTargetId === segment.anchor.id"
                    @open-change="
                      (open) =>
                        handleAnnotationRolePopoverOpenChange(
                          open,
                          segment.anchor.id,
                        )
                    "
                  >
                    <template #content>
                      <div class="anchor-role-popover">
                        <div class="mb-1 font-medium">锚点设置</div>
                        <div
                          class="mb-2 max-w-60 truncate text-xs text-muted-foreground"
                        >
                          {{ formatAnchorDisplayText(segment.anchor) }}
                        </div>
                        <a-select
                          :value="annotationRoleValue"
                          allow-clear
                          class="w-full"
                          :options="dataAnalysisAnchorRoleOptions"
                          placeholder="选择 role"
                          @change="updateAnnotationAnchorRole"
                        />
                        <a-button
                          block
                          class="mt-2"
                          danger
                          :type="
                            annotationRoleTargetIsAnswer ? 'primary' : 'default'
                          "
                          size="small"
                          @click="toggleAnnotationAnswerFromPopover"
                        >
                          {{
                            annotationRoleTargetIsAnswer
                              ? '移除答案'
                              : '设为答案'
                          }}
                        </a-button>
                      </div>
                    </template>
                    <span
                      class="material-anchor-highlight cursor-pointer"
                      :class="{
                        'material-anchor-highlight--answer':
                          isAnnotationAnswerAnchor(segment.anchor),
                        'material-anchor-highlight--selected': segment.selected,
                      }"
                      @click.stop="selectAnnotationAnchorRole(segment.anchor)"
                    >
                      {{ segment.text }}
                    </span>
                  </a-popover>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </div>
              <div class="mt-3 rounded bg-gray-50 p-3">
                <div class="mb-2 text-xs text-muted-foreground">本块锚点</div>
                <div
                  v-if="getAnchorsByBlock(getBlockId(block)).length > 0"
                  class="space-y-2"
                >
                  <div
                    v-for="anchor in getAnchorsByBlock(getBlockId(block))"
                    :key="anchor.id"
                    class="flex flex-wrap items-center justify-between gap-2 rounded border bg-white p-2"
                    :class="{
                      'border-blue-400 bg-blue-50':
                        annotationFocusedAnchorId === anchor.id,
                      'border-green-400 bg-green-50':
                        isAnnotationCandidateAnchor(anchor),
                      'border-red-400 bg-red-50':
                        isAnnotationAnswerAnchor(anchor),
                    }"
                    @mouseenter="annotationFocusedAnchorId = anchor.id"
                    @mouseleave="annotationFocusedAnchorId = null"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="mb-1 flex flex-wrap items-center gap-2">
                        <a-tag color="blue">#{{ anchor.id }}</a-tag>
                        <a-tag>{{ anchor.anchor_type }}</a-tag>
                        <a-tag
                          v-if="getAnnotationAnchorRole(anchor.id)"
                          color="purple"
                        >
                          {{
                            getAnchorRoleLabel(
                              getAnnotationAnchorRole(anchor.id),
                            )
                          }}
                        </a-tag>
                        <a-tag
                          v-if="isAnnotationCandidateAnchor(anchor)"
                          color="green"
                        >
                          候选
                        </a-tag>
                        <a-tag
                          v-if="isAnnotationAnswerAnchor(anchor)"
                          color="red"
                        >
                          答案
                        </a-tag>
                      </div>
                      <div class="truncate text-sm">
                        {{ formatAnchorDisplayText(anchor) }}
                      </div>
                    </div>
                    <a-space>
                      <a-button
                        size="small"
                        @click="toggleAnnotationCandidateAnchor(anchor)"
                      >
                        {{
                          isAnnotationCandidateAnchor(anchor)
                            ? '移出候选'
                            : '加入候选'
                        }}
                      </a-button>
                      <a-button
                        size="small"
                        type="primary"
                        @click="setAnnotationAnswerAnchor(anchor)"
                      >
                        设为答案
                      </a-button>
                    </a-space>
                  </div>
                </div>
                <a-empty v-else description="这个材料块还没有锚点" />
              </div>
            </div>
          </div>
        </a-card>

        <a-form-item label="交互指令" required>
          <a-textarea
            v-model:value="annotationForm.instruction"
            :rows="3"
            placeholder="如：请点击题干中增长量对应的数据"
          />
        </a-form-item>
        <a-form-item label="候选锚点（可选，留空 = 材料全部锚点）">
          <div class="rounded border bg-gray-50 p-3">
            <div class="mb-2 text-xs text-muted-foreground">
              留空时训练会把材料全部锚点作为可点击范围（非正确锚点即干扰项）；也可手动圈定范围。
            </div>
            <div
              v-if="getAnnotationCandidateIds().length > 0"
              class="mb-3 flex flex-wrap gap-2"
            >
              <a-tag
                v-for="anchorId in getAnnotationCandidateIds()"
                :key="anchorId"
                closable
                color="green"
                @close.prevent="
                  setAnnotationCandidateIds(
                    getAnnotationCandidateIds().filter(
                      (item) => item !== anchorId,
                    ),
                  )
                "
              >
                #{{ anchorId }}
              </a-tag>
            </div>
            <a-empty
              v-else
              class="mb-3"
              description="未限定候选：使用材料全部锚点"
            />
            <a-button
              :loading="candidateLoading"
              @click="fillCandidateAnchorsByMaterial"
            >
              一键载入本材料全部锚点
            </a-button>
          </div>
        </a-form-item>
        <a-form-item label="正确答案锚点">
          <div class="rounded border bg-gray-50 p-3">
            <div
              v-if="getAnnotationAnswerAnchorIds().length > 0"
              class="flex flex-wrap gap-2"
            >
              <a-tag
                v-for="anchorId in getAnnotationAnswerAnchorIds()"
                :key="anchorId"
                color="red"
              >
                #{{ anchorId }}
              </a-tag>
            </div>
            <a-empty v-else description="还没有设置正确答案锚点" />
          </div>
        </a-form-item>
      </a-form>

      <div class="drawer-footer">
        <a-space>
          <a-button @click="annotationDrawerOpen = false">取消</a-button>
          <a-button
            type="primary"
            :loading="annotationSubmitting"
            @click="submitAnnotation"
          >
            保存
          </a-button>
        </a-space>
      </div>
    </a-drawer>
  </Page>
</template>

<style scoped>
.interaction-tabs {
  flex: 1;
  min-height: 0;
}

:deep(.interaction-tabs > .ant-tabs-content-holder) {
  flex: 1;
  min-height: 0;
}

:deep(.interaction-tabs > .ant-tabs-content-holder > .ant-tabs-content) {
  height: 100%;
}

:deep(.interaction-tabs .ant-tabs-tabpane) {
  height: 100%;
}

.drawer-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding: 12px 24px;
  margin: 24px -24px -24px;
  background: hsl(var(--background));
  border-top: 1px solid hsl(var(--border));
}

.anchor-role-popover {
  width: 220px;
}

.material-anchor-highlight {
  padding: 1px 3px;
  background: rgb(254 240 138 / 80%);
  border-bottom: 2px solid rgb(234 179 8);
  border-radius: 3px;
}

.material-anchor-highlight--draft {
  background: rgb(191 219 254 / 85%);
  border-bottom-color: rgb(59 130 246);
}

.material-anchor-highlight--selected {
  background: rgb(221 214 254 / 90%);
  border-bottom-color: rgb(124 58 237);
  box-shadow: 0 0 0 2px rgb(124 58 237 / 20%);
}

.material-anchor-highlight--answer {
  background: rgb(254 202 202 / 75%);
  border-bottom-color: rgb(220 38 38);
}

.material-anchor-marker {
  position: absolute;
  pointer-events: none;
  background: rgb(254 240 138 / 22%);
  border: 2px solid rgb(234 179 8);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 85%);
  transform: translate(0, 0);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.material-anchor-marker--candidate {
  background: rgb(187 247 208 / 22%);
  border-color: rgb(34 197 94);
}

.material-anchor-marker--answer {
  background: rgb(254 202 202 / 26%);
  border-color: rgb(239 68 68);
}

.material-anchor-marker--draft {
  background: rgb(191 219 254 / 22%);
  border-color: rgb(59 130 246);
}

.material-anchor-marker--active {
  z-index: 2;
  background: rgb(147 197 253 / 26%);
  border-color: rgb(37 99 235);
  box-shadow:
    0 0 0 2px rgb(255 255 255 / 95%),
    0 0 0 5px rgb(37 99 235 / 55%);
}

.material-anchor-marker--selectable {
  pointer-events: auto;
  cursor: pointer;
}

.material-anchor-marker--selected {
  z-index: 3;
  background: rgb(196 181 253 / 35%);
  border-color: rgb(124 58 237);
  box-shadow:
    0 0 0 2px rgb(255 255 255 / 95%),
    0 0 0 5px rgb(124 58 237 / 55%);
}

.material-anchor-marker--preview {
  background: rgb(59 130 246 / 12%);
  border-style: dashed;
}

.material-anchor-marker--point {
  width: 12px;
  height: 12px;
  margin-top: -6px;
  margin-left: -6px;
  background: rgb(234 179 8 / 90%);
  border-radius: 999px;
}

.material-anchor-marker--draft.material-anchor-marker--point {
  background: rgb(59 130 246 / 90%);
}

.material-anchor-marker--candidate.material-anchor-marker--point {
  background: rgb(34 197 94 / 90%);
}

.material-anchor-marker--answer.material-anchor-marker--point {
  background: rgb(239 68 68 / 90%);
}

.material-anchor-marker--active.material-anchor-marker--point {
  background: rgb(37 99 235 / 95%);
}

.material-anchor-marker-label {
  position: absolute;
  top: -22px;
  left: 0;
  padding: 1px 4px;
  font-size: 11px;
  color: #fff;
  white-space: nowrap;
  background: rgb(15 23 42 / 82%);
  border-radius: 3px;
}
</style>
