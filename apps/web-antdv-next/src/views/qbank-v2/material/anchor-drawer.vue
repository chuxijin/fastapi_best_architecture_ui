<script setup lang="ts">
import type {
  CreateMaterialAnchorParam,
  GetMaterialAnchorDetail,
} from '#/api/qbank-v2/material';

import { computed, nextTick, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message, Modal } from 'ant-design-vue';

import {
  deleteMaterialAnchorApi,
  getMaterialAnchorsApi,
  getMaterialApi,
  getMaterialBlocksApi,
  publishMaterialRevisionApi,
  qbankV2CreateMaterialAnchorApi,
  qbankV2UpdateMaterialAnchorApi,
} from '#/api';

interface DraftItem extends CreateMaterialAnchorParam {
  _key: string;
}

interface BlockItem {
  id: string;
  type: 'image' | 'text';
  title: string;
  content?: string;
  plainText?: string;
  assetUrl?: string;
}

interface ImagePointer {
  blockId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const material = ref<any>();
const revision = ref<any>();
const blocks = ref<BlockItem[]>([]);
const prev = ref<ImagePointer | null>(null);
const existingAnchors = ref<GetMaterialAnchorDetail[]>([]);
const drafts = ref<DraftItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const publishing = ref(false);
const renderKey = ref(0);
const focusedImage = ref<null | string>(null);

async function publish() {
  if (!material.value || !revision.value) return;
  publishing.value = true;
  try {
    if (drafts.value.length > 0) {
      const items: CreateMaterialAnchorParam[] = drafts.value.map(
        ({ _key: _, ...d }) => d,
      );
      await qbankV2CreateMaterialAnchorApi(
        material.value.id,
        revision.value.id,
        items,
      );
      drafts.value = [];
    }
    await publishMaterialRevisionApi(material.value.id, revision.value.id);
    message.success('版本发布成功');
    revision.value.status = 'published';
    await loadExistingAnchors(revision.value.id);
  } catch (error: any) {
    message.error(
      error?.response?.data?.detail || error?.message || '发布失败',
    );
  } finally {
    publishing.value = false;
  }
}

function stripHtml(html: string): string {
  const d = new DOMParser().parseFromString(html, 'text/html');
  return d.body.textContent?.replaceAll(/\s+/g, ' ')?.trim() || '';
}

async function loadContent(detail: any, revisionId: number) {
  const r = detail.revision || detail.current_revision;
  if (!r) {
    message.error('材料版本不存在');
    return;
  }
  const html = r.content || '';

  let raw: Record<string, any>[] = [];
  try {
    const result = await getMaterialBlocksApi(detail.id, revisionId);
    raw = result.blocks || [];
  } catch {
    /* fallback */
  }

  if (raw.length === 0) {
    raw = [
      {
        id: 'content',
        type: 'text',
        title: r.title || '材料正文',
        content: html,
      },
    ];
  }

  blocks.value = raw.map((b: any) => {
    const isImg = ['image', 'img', 'picture'].includes(
      String(b.type || '').toLowerCase(),
    );
    const content = b.content || '';
    return {
      id: String(b.id || (isImg ? `img-${Math.random()}` : 'text-block')),
      type: isImg ? 'image' : 'text',
      title: b.title || b.type || (isImg ? '图片' : '材料'),
      content,
      plainText: isImg ? undefined : stripHtml(content),
      assetUrl: isImg
        ? b.asset_url || b.image_url || b.url || b.src || ''
        : undefined,
    };
  });
}

function genKey(suffix: string): string {
  return `m${material.value?.id}_${suffix}_${Date.now()}`;
}

function addDraft(p: CreateMaterialAnchorParam) {
  drafts.value.push({
    ...p,
    status: 'active',
    _key: `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  });
}

async function toggleAnchorStatus(a: GetMaterialAnchorDetail) {
  if (!material.value || !revision.value) return;
  const next =
    a.status === 'retired'
      ? 'active'
      : a.status === 'active'
        ? 'draft'
        : 'active';
  try {
    await qbankV2UpdateMaterialAnchorApi(
      material.value.id,
      revision.value.id,
      a.id,
      { status: next },
    );
    message.success(
      `锚点 #${a.id} 已${next === 'active' ? '启用' : next === 'draft' ? '转为草稿' : '退役'}`,
    );
    await loadExistingAnchors(revision.value.id);
  } catch (error: any) {
    message.error(
      error?.response?.data?.detail || error?.message || '更新锚点状态失败',
    );
  }
}

function rmDraft(k: string) {
  drafts.value = drafts.value.filter((d) => d._key !== k);
}

function selectionStartOffsetIn(root: HTMLElement, sel: Selection): number {
  try {
    const range = sel.getRangeAt(0);
    const pre = document.createRange();
    pre.selectNodeContents(root);
    pre.setEnd(range.startContainer, range.startOffset);
    const raw = range.toString();
    const lead = raw.length - raw.trimStart().length;
    return pre.toString().length + lead;
  } catch {
    return -1;
  }
}

function onTextUp(b: BlockItem) {
  const sel = window.getSelection();
  const text = sel?.toString()?.trim();
  if (!text || !sel || !sel.rangeCount || !b.plainText) return;
  const root = document.querySelector<HTMLElement>(`#mc-${b.id}`);
  let start = root ? selectionStartOffsetIn(root, sel) : -1;
  if (
    root &&
    start >= 0 &&
    (root.textContent || '').slice(start, start + text.length) !== text
  ) {
    start = -1;
  }
  if (start < 0) {
    const idx = b.plainText.indexOf(text);
    if (idx === -1) {
      message.warning('选中文字不在块中');
      return;
    }
    start = idx;
  }
  addDraft({
    anchor_key: genKey(`t${start}`),
    anchor_type: 'text_range',
    block_id: b.id,
    text,
    start_offset: start,
    end_offset: start + text.length,
  });
  sel.removeAllRanges();
}

function imgPos(e: MouseEvent): null | { x: number; y: number } {
  const img = e.currentTarget as HTMLImageElement;
  if (!img) return null;
  const rect = img.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
  };
}

function onImgDown(b: BlockItem, e: MouseEvent) {
  const p = imgPos(e);
  if (!p) return;
  prev.value = {
    blockId: b.id,
    startX: p.x,
    startY: p.y,
    currentX: p.x,
    currentY: p.y,
  };
}

function onImgMove(e: MouseEvent) {
  const p = prev.value;
  if (!p) return;
  const pt = imgPos(e);
  if (pt) {
    p.currentX = pt.x;
    p.currentY = pt.y;
  }
}

function onImgUp(b: BlockItem, e: MouseEvent) {
  const p = prev.value;
  prev.value = null;
  if (!p || p.blockId !== b.id) return;
  const pt = imgPos(e);
  if (!pt) return;
  const x = Math.min(p.startX, pt.x);
  const y = Math.min(p.startY, pt.y);
  const w = Math.abs(pt.x - p.startX);
  const h = Math.abs(pt.y - p.startY);
  const isPt = w < 0.01 && h < 0.01;
  addDraft({
    anchor_key: genKey(isPt ? 'point' : 'region'),
    anchor_type: isPt ? 'image_point' : 'image_region',
    block_id: b.id,
    bbox: isPt
      ? { x: +p.startX.toFixed(6), y: +p.startY.toFixed(6) }
      : {
          x: +x.toFixed(6),
          y: +y.toFixed(6),
          width: +w.toFixed(6),
          height: +h.toFixed(6),
        },
  });
}

const previewStyle = computed<any>(() => {
  const p = prev.value;
  if (!p) return null;
  const x = Math.min(p.startX, p.currentX);
  const y = Math.min(p.startY, p.currentY);
  const w = Math.abs(p.currentX - p.startX);
  const h = Math.abs(p.currentY - p.startY);
  if (w < 0.01 && h < 0.01) {
    return {
      border: '3px solid #1890ff',
      borderRadius: '50%',
      width: '12px',
      height: '12px',
      position: 'absolute',
      left: `${p.currentX * 100}%`,
      top: `${p.currentY * 100}%`,
      transform: 'translate(-50%,-50%)',
      pointerEvents: 'none',
      zIndex: 10,
      background: 'rgba(24,144,255,0.6)',
    };
  }
  return {
    border: '2px dashed #1890ff',
    background: 'rgba(24,144,255,0.08)',
    position: 'absolute',
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${w * 100}%`,
    height: `${h * 100}%`,
    pointerEvents: 'none',
    zIndex: 10,
  };
});

interface ImgMarker {
  key: string;
  label: string;
  draft: boolean;
  isPoint: boolean;
  active: boolean;
  style: Record<string, string>;
}
const blockMarkers = computed(() => {
  const map = new Map<string, ImgMarker[]>();
  const push = (blockId: string, m: ImgMarker) => {
    if (!map.has(blockId)) map.set(blockId, []);
    map.get(blockId)?.push(m);
  };
  for (const a of existingAnchors.value) {
    if (a.anchor_type === 'text_range' || a.anchor_type === 'text_block')
      continue;
    const bd = String(a.block_id || '');
    const b = a.bbox || {};
    const w = b.width || 0;
    const h = b.height || 0;
    const isPt = a.anchor_type === 'image_point' || (w <= 0 && h <= 0);
    push(bd, {
      key: `a-${a.id}`,
      label: `#${a.id}`,
      draft: false,
      active: focusedImage.value === bd,
      isPoint: isPt,
      style: isPt
        ? { left: `${(b.x || 0) * 100}%`, top: `${(b.y || 0) * 100}%` }
        : {
            left: `${(b.x || 0) * 100}%`,
            top: `${(b.y || 0) * 100}%`,
            width: `${w * 100}%`,
            height: `${h * 100}%`,
          },
    });
  }
  for (const d of drafts.value) {
    if (d.anchor_type === 'text_range' || d.anchor_type === 'text_block')
      continue;
    const bd = String(d.block_id || '');
    const b = d.bbox || {};
    const w = b.width || 0;
    const h = b.height || 0;
    const isPt = d.anchor_type === 'image_point' || (w <= 0 && h <= 0);
    push(bd, {
      key: `d-${d._key}`,
      label: '草稿',
      draft: true,
      active: false,
      isPoint: isPt,
      style: isPt
        ? { left: `${(b.x || 0) * 100}%`, top: `${(b.y || 0) * 100}%` }
        : {
            left: `${(b.x || 0) * 100}%`,
            top: `${(b.y || 0) * 100}%`,
            width: `${w * 100}%`,
            height: `${h * 100}%`,
          },
    });
  }
  return map;
});

async function save() {
  if (!material.value || !revision.value || drafts.value.length === 0) return;
  saving.value = true;
  try {
    const items: CreateMaterialAnchorParam[] = drafts.value.map(
      ({ _key: _, ...d }) => d,
    );
    await qbankV2CreateMaterialAnchorApi(
      material.value.id,
      revision.value.id,
      items,
    );
    message.success(`已保存 ${items.length} 个锚点`);
    drafts.value = [];
    await loadExistingAnchors(revision.value.id);
  } catch (error: any) {
    message.error(
      error?.response?.data?.detail || error?.message || '保存失败',
    );
  } finally {
    saving.value = false;
  }
}

async function deleteAnchor(a: GetMaterialAnchorDetail) {
  if (!material.value || !revision.value) return;
  try {
    await deleteMaterialAnchorApi(material.value.id, revision.value.id, a.id);
    message.success('已删除');
    await loadExistingAnchors(revision.value.id);
  } catch (error: any) {
    message.error(error?.response?.data?.detail || '删除失败');
  }
}

function confirmDelete(a: GetMaterialAnchorDetail) {
  Modal.confirm({
    title: '确认删除锚点？',
    content: `锚点：#${a.id}（${a.text || a.anchor_key}）`,
    okButtonProps: { danger: true },
    okText: '删除',
    zIndex: 1200,
    onOk: () => deleteAnchor(a),
  });
}

async function loadExistingAnchors(revisionId: number) {
  if (!material.value) return;
  existingAnchors.value = await getMaterialAnchorsApi(
    material.value.id,
    revisionId,
  );
}

function wrapTextRange(
  root: HTMLElement,
  start: number,
  end: number,
  cls: string,
) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let startNode: null | Text = null;
  let startOffset = 0;
  let endNode: null | Text = null;
  let endOffset = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeEnd = offset + node.data.length;
    if (startNode === null && start < nodeEnd) {
      startNode = node;
      startOffset = start - offset;
    }
    if (end <= nodeEnd) {
      endNode = node;
      endOffset = end - offset;
      break;
    }
    offset = nodeEnd;
  }
  if (!startNode || !endNode) return;
  try {
    const r = document.createRange();
    r.setStart(startNode, startOffset);
    r.setEnd(endNode, endOffset);
    const span = document.createElement('span');
    span.className = `ah ${cls}`;
    r.surroundContents(span);
  } catch {
    /* skip across-element matches */
  }
}

function applyHighlights() {
  for (const b of blocks.value) {
    if (b.type !== 'text') continue;
    const root = document.querySelector<HTMLElement>(`#mc-${b.id}`);
    if (!root) continue;
    root.querySelectorAll('.ah').forEach((el) => {
      const p = el.parentNode;
      if (p) {
        p.replaceChild(document.createTextNode(el.textContent || ''), el);
        p.normalize();
      }
    });

    const items: Array<{ cls: string; end: number; start: number }> = [];
    for (const a of existingAnchors.value) {
      if (a.anchor_type !== 'text_range') continue;
      const start = Number(a.start_offset);
      const end = Number(a.end_offset);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
        continue;
      items.push({
        cls: 'bg-yellow-200 border-b-2 border-yellow-500',
        end,
        start,
      });
    }
    for (const d of drafts.value) {
      if (d.anchor_type !== 'text_range') continue;
      const start = Number(d.start_offset);
      const end = Number(d.end_offset);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
        continue;
      items.push({ cls: 'bg-blue-200 border-b-2 border-blue-500', end, start });
    }
    if (items.length === 0) continue;

    items.sort((x, y) => x.start - y.start || y.end - x.end);
    for (const item of items) {
      wrapTextRange(root, item.start, item.end, item.cls);
    }
  }
}

watch(
  [existingAnchors, drafts, renderKey],
  () => {
    nextTick(applyHighlights);
  },
  { deep: true },
);

const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-3/4',
  destroyOnClose: true,
  showCancelButton: false,
  showConfirmButton: false,
  title: '材料锚点标注',
  async onOpenChange(isOpen) {
    if (!isOpen) {
      material.value = undefined;
      revision.value = undefined;
      blocks.value = [];
      existingAnchors.value = [];
      drafts.value = [];
      return;
    }
    const { materialId: pk } = drawerApi.getData<{ materialId: number }>();
    if (!pk) {
      message.error('缺少材料 ID');
      return;
    }
    loading.value = true;
    try {
      const detail: any = await getMaterialApi(pk);
      material.value = detail;
      const r = detail.revision || detail.current_revision;
      if (!r?.id) {
        message.error('材料版本不存在');
        return;
      }
      revision.value = r;
      await loadContent(material.value, r.id);
      await loadExistingAnchors(r.id);
      nextTick(() => {
        renderKey.value++;
      });
    } catch (error: any) {
      message.error(
        error?.response?.data?.detail || error?.message || '加载材料失败',
      );
    } finally {
      loading.value = false;
    }
  },
});

function open(materialId: number) {
  drawerApi.setData({ materialId }).open();
}
defineExpose({ open });
</script>

<template>
  <Drawer>
    <div
      v-if="loading"
      class="flex items-center justify-center py-20 text-muted-foreground"
    >
      加载中...
    </div>
    <template v-else-if="revision">
      <div class="flex h-full flex-col">
        <div class="mb-3 flex items-center gap-3 shrink-0">
          <span class="text-lg font-medium">{{ revision.title }}</span>
          <a-tag :color="revision.status === 'draft' ? 'blue' : 'green'">
            {{ revision.status }}
          </a-tag>
          <span class="text-xs text-muted-foreground"
            >v{{ revision.revision_no }}</span
          >
          <span class="ml-auto text-xs text-muted-foreground"
            >选中文字或拖拽图片区域生成锚点</span
          >
        </div>

        <div class="flex-1 min-h-0 overflow-auto space-y-3">
          <div v-for="b in blocks" :key="b.id" class="rounded border p-3">
            <div class="mb-2 flex items-center gap-2">
              <a-tag :color="b.type === 'image' ? 'purple' : 'blue'">
                {{ b.type }}
              </a-tag>
              <span class="text-sm font-medium">{{ b.title }}</span>
            </div>

            <div
              v-if="b.type === 'text'"
              :id="`mc-${b.id}`"
              class="cursor-text whitespace-pre-wrap bg-white text-sm leading-7"
              @mouseup="onTextUp(b)"
            >
              <!-- eslint-disable vue/no-v-html -->
              <div v-html="b.content"></div>
            </div>

            <div
              v-if="b.type === 'image' && b.assetUrl"
              class="relative inline-block max-w-full"
            >
              <img
                :src="b.assetUrl"
                class="max-w-full cursor-crosshair rounded border"
                draggable="false"
                @mousedown.prevent="onImgDown(b, $event)"
                @mousemove.prevent="onImgMove"
                @mouseup.prevent="onImgUp(b, $event)"
                @mouseenter="focusedImage = b.id"
                @mouseleave="
                  focusedImage = null;
                  prev = null;
                "
              />
              <span
                v-if="previewStyle && prev?.blockId === b.id"
                :style="previewStyle"
              ></span>
              <span
                v-for="m in blockMarkers.get(b.id) || []"
                :key="m.key"
                class="img-marker"
                :class="{
                  'img-marker--draft': m.draft,
                  'img-marker--active': m.active,
                  'img-marker--point': m.isPoint,
                }"
                :style="m.style"
              >
                <span class="img-marker-label">{{ m.label }}</span>
              </span>
            </div>
          </div>
        </div>

        <div v-if="existingAnchors.length > 0" class="mt-3 shrink-0">
          <a-card size="small" :title="`已有锚点 (${existingAnchors.length})`">
            <div class="space-y-2 max-h-44 overflow-auto">
              <div
                v-for="a in existingAnchors"
                :key="a.id"
                class="flex items-center justify-between rounded border bg-white p-2"
              >
                <div class="flex min-w-0 flex-1 items-center gap-2">
                  <a-tag color="blue">#{{ a.id }}</a-tag>
                  <a-tag>{{ a.anchor_type }}</a-tag>
                  <a-tag
                    :color="
                      a.status === 'active'
                        ? 'green'
                        : a.status === 'retired'
                          ? 'red'
                          : 'default'
                    "
                  >
                    {{
                      a.status === 'active'
                        ? '已启用'
                        : a.status === 'retired'
                          ? '已退役'
                          : '草稿'
                    }}
                  </a-tag>
                  <span class="truncate text-sm">{{
                    a.text || a.anchor_key
                  }}</span>
                </div>
                <a-space size="small">
                  <a-button size="small" @click="toggleAnchorStatus(a)">
                    {{ a.status === 'active' ? '转草稿' : '启用' }}
                  </a-button>
                  <a-button
                    danger
                    size="small"
                    type="link"
                    @click="confirmDelete(a)"
                  >
                    删除
                  </a-button>
                </a-space>
              </div>
            </div>
          </a-card>
        </div>

        <div v-if="drafts.length > 0" class="mt-3 shrink-0">
          <a-card size="small" title="待保存锚点">
            <template #extra>
              <span class="mr-2 text-xs text-muted-foreground"
                >保存后默认启用</span
              >
              <a-button size="small" danger @click="drafts = []">清空</a-button>
            </template>
            <div class="space-y-2 max-h-40 overflow-auto">
              <div
                v-for="d in drafts"
                :key="d._key"
                class="flex items-center justify-between rounded border bg-white p-2"
              >
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <a-tag color="blue">{{ d.anchor_type }}</a-tag>
                  <span class="truncate text-sm">{{
                    d.text || d.anchor_key
                  }}</span>
                </div>
                <a-button
                  size="small"
                  danger
                  type="link"
                  @click="rmDraft(d._key)"
                >
                  删除
                </a-button>
              </div>
            </div>
          </a-card>
        </div>

        <div class="mt-3 flex justify-end gap-2 shrink-0">
          <a-button @click="drawerApi.close()">取消</a-button>
          <a-button
            type="primary"
            :loading="saving"
            :disabled="drafts.length === 0"
            @click="save"
          >
            保存锚点{{ drafts.length > 0 ? ` (${drafts.length})` : '' }}
          </a-button>
        </div>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.img-marker {
  position: absolute;
  pointer-events: none;
  background: rgb(82 196 26 / 15%);
  border: 2px solid rgb(82 196 26);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 85%);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.img-marker--draft {
  background: rgb(191 219 254 / 22%);
  border-color: rgb(59 130 246);
}

.img-marker--active {
  z-index: 2;
  background: rgb(147 197 253 / 26%);
  border-color: rgb(37 99 235);
  box-shadow:
    0 0 0 2px rgb(255 255 255 / 95%),
    0 0 0 5px rgb(37 99 235 / 55%);
}

.img-marker--point {
  width: 12px;
  height: 12px;
  margin-top: -6px;
  margin-left: -6px;
  background: rgb(82 196 26 / 90%);
  border-radius: 999px;
}

.img-marker--draft.img-marker--point {
  background: rgb(59 130 246 / 90%);
}

.img-marker-label {
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
