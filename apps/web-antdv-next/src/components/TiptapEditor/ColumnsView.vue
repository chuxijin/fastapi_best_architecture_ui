<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * 鍒嗘爮 NodeView 鈥斺€?鏀寔閫氳繃鐧惧垎姣旇緭鍏ヨ皟鏁村垪瀹?
 *
 * 缁撴瀯锛?
 *   NodeViewWrapper.columns-resizable
 *     .columns-width-bar  (鐧惧垎姣旇緭鍏ヨ)
 *     NodeViewContent.columns-content  (display: flex, 瀛愰」 = column 鑺傜偣)
 */
import { NodeViewContent, NodeViewWrapper } from '@tiptap/vue-3';

const props = defineProps<{
  decorations: any;
  deleteNode: () => void;
  editor: any;
  extension: any;
  getPos: () => number;
  node: any;
  selected: boolean;
  updateAttributes: (attrs: Record<string, any>) => void;
}>();

const showBar = ref(false);

/** 浠?column 鐨?style 灞炴€т腑瑙ｆ瀽 flex 鍊?*/
function parseFlexFromStyle(style: string): number {
  // 鍖归厤 flex: 1 1 鎴?flex: 2.50 绛?
  const matched = style.match(/flex:\s*([\d.]+)/);
  if (!matched) {
    return 1;
  }

  const parsedValue = Number.parseFloat(matched[1]);
  if (Number.isNaN(parsedValue)) {
    return 1;
  }

  return parsedValue;
}

/** 鑾峰彇姣忓垪鐨勭櫨鍒嗘瘮 */
const columnPercents = computed(() => {
  const flexes: number[] = [];
  props.node.forEach((colNode: any) => {
    flexes.push(parseFlexFromStyle(colNode.attrs.style || ''));
  });
  let total = 0;
  for (const flex of flexes) {
    total += flex;
  }
  if (total === 0) {
    total = 1;
  }
  return flexes.map((f) => Math.round((f / total) * 100));
});

/** 鏇存柊鏌愪竴鍒楃殑鐧惧垎姣旓紝鍏朵粬鍒楃瓑姣旇皟鏁?*/
function updatePercent(index: number, newPercent: number) {
  const count = props.node.childCount;
  if (count < 2) return;

  // 闄愬埗鑼冨洿
  newPercent = Math.max(10, Math.min(90, newPercent));

  // 鍓╀綑鐧惧垎姣旀寜鍏朵粬鍒楃殑鍘熸瘮渚嬪垎閰?
  const oldPercents = columnPercents.value;
  const remaining = 100 - newPercent;
  let othersTotal = 0;
  oldPercents.forEach((percent, percentIndex) => {
    if (percentIndex === index) {
      return;
    }
    othersTotal += percent;
  });
  if (othersTotal === 0) {
    othersTotal = 1;
  }

  const newPercents = oldPercents.map((p, i) => {
    if (i === index) return newPercent;
    return Math.round((p / othersTotal) * remaining);
  });

  // 淇鑸嶅叆璇樊
  let sum = 0;
  for (const percent of newPercents) {
    sum += percent;
  }
  if (sum !== 100) {
    const diff = 100 - sum;
    // 鎶婂樊鍊煎姞鍒版渶澶х殑闈炲綋鍓嶅垪涓?
    let maxIdx = -1;
    let maxVal = 0;
    newPercents.forEach((p, i) => {
      if (i !== index && p > maxVal) {
        maxVal = p;
        maxIdx = i;
      }
    });
    if (maxIdx >= 0) {
      const currentValue = newPercents[maxIdx];
      if (currentValue !== undefined) {
        newPercents[maxIdx] = currentValue + diff;
      }
    }
  }

  // 鍐欏叆 ProseMirror
  const pos = props.getPos();
  if (typeof pos !== 'number') return;

  const { tr } = props.editor.state;
  props.node.forEach((colNode: any, colOffset: number, i: number) => {
    const colPos = pos + 1 + colOffset;
    const percentValue = newPercents[i] ?? 10;
    const flex = (percentValue / 10).toFixed(1); // 鐢?flex-grow 姣斿€硷紙濡?6.0 / 4.0锛?
    const style = `min-width: 0;flex: ${flex};box-sizing: border-box;`;
    tr.setNodeMarkup(colPos, undefined, { ...colNode.attrs, style });
  });
  props.editor.view.dispatch(tr);
}

function onInput(index: number, e: Event) {
  const val = Number.parseInt((e.target as HTMLInputElement).value, 10);
  if (!Number.isNaN(val)) {
    updatePercent(index, val);
  }
}
</script>

<template>
  <NodeViewWrapper
    class="columns columns-resizable"
    @mouseenter="showBar = true"
    @mouseleave="showBar = false"
  >
    <!-- 鎮诞宸ュ叿鏉?-->
    <div v-show="showBar" class="columns-toolbar" contenteditable="false">
      <div class="columns-width-bar">
        <div
          v-for="(pct, i) in columnPercents"
          :key="i"
          class="columns-width-item"
        >
          <input
            type="number"
            class="columns-width-input"
            :value="pct"
            min="10"
            max="90"
            step="5"
            @change="onInput(i, $event)"
            @click.stop
            @mousedown.stop
          />
          <span class="columns-width-unit">%</span>
        </div>
      </div>
      <button
        class="columns-delete-btn"
        title="鍒犻櫎鍒嗘爮"
        @click.stop="deleteNode"
        @mousedown.prevent.stop
      >
        鉁?
      </button>
    </div>

    <NodeViewContent class="columns-content" />
  </NodeViewWrapper>
</template>

<style scoped>
.columns-resizable {
  position: relative;
  padding: 0.5rem;
  margin: 0.75em 0;
  border-radius: 4px;
}

.columns-content {
  display: flex;
  gap: 1rem;
  width: 100%;
}

/* ---- 鎮诞宸ュ叿鏉?---- */
.columns-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
  user-select: none;
}

.columns-width-bar {
  display: flex;
  flex: 1;
  gap: 1rem;
}

.columns-width-item {
  display: flex;
  flex: 1;
  gap: 2px;
  align-items: center;
  justify-content: center;
}

.columns-width-input {
  width: 42px;
  height: 22px;
  font-size: 12px;
  color: #374151;
  text-align: center;
  appearance: textfield;
  appearance: textfield;
  outline: none;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.columns-width-input::-webkit-inner-spin-button,
.columns-width-input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

.columns-width-input:focus {
  background: #fff;
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgb(79 70 229 / 10%);
}

.columns-width-unit {
  font-size: 12px;
  color: #9ca3af;
}

/* ---- 鍒犻櫎鎸夐挳 ---- */
.columns-delete-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.15s;
}

.columns-delete-btn:hover {
  color: #dc2626;
  background: #fee2e2;
  border-color: #fca5a5;
}
</style>
