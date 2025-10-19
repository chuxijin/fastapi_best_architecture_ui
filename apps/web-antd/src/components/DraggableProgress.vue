<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

// Props
interface Props {
  visible: boolean;
  title: string;
  progress: number;
  currentStep: number;
  totalSteps: number;
  currentStepName: string;
  logs: string[];
  status?: 'error' | 'paused' | 'running' | 'success';
  initialPosition?: { x: number; y: number };
}

const props = withDefaults(defineProps<Props>(), {
  status: 'running',
  initialPosition: () => ({ x: window.innerWidth - 420, y: 20 }),
});

// Emits
const emit = defineEmits<{
  close: [];
  'update:visible': [value: boolean];
}>();

// 状态
const progressContainer = ref<HTMLElement>();
const minimized = ref(false);
const isDragging = ref(false);
const position = ref({
  x: props.initialPosition.x,
  y: props.initialPosition.y,
});
const dragOffset = ref({ x: 0, y: 0 });
const hasDragged = ref(false);

// 计算样式
const containerStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  cursor: isDragging.value ? 'grabbing' : 'grab',
}));

// 切换最小化状态
function toggleMinimized() {
  // 如果刚刚拖拽过，不执行切换
  if (hasDragged.value) {
    hasDragged.value = false;
    return;
  }
  minimized.value = !minimized.value;
}

// 获取状态颜色
function getStatusColor() {
  switch (props.status) {
    case 'error': {
      return 'bg-red-500';
    }
    case 'paused': {
      return 'bg-yellow-500';
    }
    case 'success': {
      return 'bg-green-500';
    }
    default: {
      return 'bg-blue-500 animate-pulse';
    }
  }
}

// 获取进度条颜色
function getProgressBarColor() {
  switch (props.status) {
    case 'error': {
      return 'bg-red-500';
    }
    case 'paused': {
      return 'bg-yellow-500';
    }
    case 'success': {
      return 'bg-green-500';
    }
    default: {
      return 'bg-blue-500';
    }
  }
}

// 获取步骤指示器颜色
function getStepIndicatorColor(step: number) {
  if (step < props.currentStep) {
    return 'bg-green-500 text-white'; // 已完成
  } else if (step === props.currentStep) {
    switch (props.status) {
      case 'error': {
        return 'bg-red-500 text-white';
      }
      case 'paused': {
        return 'bg-yellow-500 text-white';
      }
      default: {
        return 'bg-blue-500 text-white';
      }
    }
  } else {
    return 'bg-gray-200 text-gray-500'; // 未开始
  }
}

// 获取步骤连接线颜色
function getStepConnectorColor(step: number) {
  return step < props.currentStep ? 'bg-green-500' : 'bg-gray-200';
}

// 获取日志颜色
function getLogColor(log: string) {
  if (log.includes('✅')) {
    return 'text-green-600';
  } else if (log.includes('❌') || log.includes('失败')) {
    return 'text-red-600';
  } else if (log.includes('⚠️') || log.includes('警告')) {
    return 'text-yellow-600';
  } else {
    return 'text-gray-600';
  }
}

// 拖拽功能
function startDrag(event: MouseEvent) {
  if (!progressContainer.value) return;

  isDragging.value = true;
  hasDragged.value = false; // 重置拖拽标志
  const rect = progressContainer.value.getBoundingClientRect();
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  event.preventDefault();
}

function onDrag(event: MouseEvent) {
  if (!isDragging.value) return;

  hasDragged.value = true; // 标记已经拖拽

  const newX = event.clientX - dragOffset.value.x;
  const newY = event.clientY - dragOffset.value.y;

  // 限制在视窗内
  const maxX = window.innerWidth - (minimized.value ? 64 : 384);
  const maxY = window.innerHeight - (minimized.value ? 48 : 300);

  position.value = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY)),
  };
}

function stopDrag() {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

// 窗口大小变化时调整位置
function handleResize() {
  const maxX = window.innerWidth - (minimized.value ? 64 : 384);
  const maxY = window.innerHeight - (minimized.value ? 48 : 300);

  position.value = {
    x: Math.max(0, Math.min(position.value.x, maxX)),
    y: Math.max(0, Math.min(position.value.y, maxY)),
  };
}

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});

// 监听visible变化，重置最小化状态
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      minimized.value = false;
    }
  },
);
</script>

<template>
  <div
    v-if="visible"
    ref="progressContainer"
    class="fixed z-[9999] select-none"
    :style="containerStyle"
  >
    <!-- 最小化状态 -->
    <div
      v-if="minimized"
      class="flex h-12 w-16 cursor-move items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all duration-200 hover:bg-blue-600"
      @mousedown="startDrag"
      @click="toggleMinimized"
    >
      <span class="text-sm font-medium">{{ Math.round(progress) }}%</span>
    </div>

    <!-- 展开状态 -->
    <div
      v-else
      class="w-96 rounded-lg border bg-white shadow-xl transition-all duration-200"
    >
      <!-- 头部 -->
      <div
        class="flex cursor-move items-center justify-between border-b bg-gray-50 p-3"
        @mousedown="startDrag"
      >
        <div class="flex items-center space-x-2">
          <!-- 状态指示器 -->
          <div
            class="h-3 w-3 rounded-full transition-colors"
            :class="getStatusColor()"
          ></div>
          <span class="text-sm font-medium text-gray-700">
            {{ title }}
          </span>
        </div>

        <div class="flex items-center space-x-1">
          <!-- 最小化按钮 -->
          <button
            class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            @click="toggleMinimized"
            @mousedown.stop
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 12H4"
              />
            </svg>
          </button>

          <!-- 关闭按钮 -->
          <button
            class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            @click="$emit('close')"
            @mousedown.stop
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- 内容区域 - 不支持拖拽，方便复制内容 -->
      <div class="p-4" @mousedown.stop>
        <!-- 当前步骤和进度 -->
        <div class="mb-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ currentStepName }}</span>
            <span class="text-xs text-gray-500">
              {{ currentStep }}/{{ totalSteps }}
            </span>
          </div>

          <!-- 进度条 -->
          <div class="h-2 w-full rounded-full bg-gray-200">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :class="getProgressBarColor()"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>

          <!-- 百分比显示 -->
          <div class="mt-1 text-right">
            <span class="text-xs font-medium text-gray-600"
              >{{ Math.round(progress) }}%</span
            >
          </div>
        </div>

        <!-- 步骤指示器 -->
        <div
          v-if="totalSteps > 1"
          class="mb-4 flex items-center justify-between"
        >
          <div v-for="step in totalSteps" :key="step" class="flex items-center">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors"
              :class="getStepIndicatorColor(step)"
            >
              <svg
                v-if="step < currentStep"
                class="h-3 w-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <span v-else>{{ step }}</span>
            </div>
            <div
              v-if="step < totalSteps"
              class="mx-2 h-0.5 w-8 transition-colors"
              :class="getStepConnectorColor(step)"
            ></div>
          </div>
        </div>

        <!-- 日志区域 -->
        <div
          v-if="logs.length > 0"
          class="max-h-32 overflow-y-auto rounded bg-gray-50 p-2"
          @mousedown.stop
        >
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="cursor-text select-text text-xs transition-colors"
            :class="getLogColor(log)"
            :style="{ marginTop: index > 0 ? '2px' : '0' }"
          >
            {{ log }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 防止拖拽时选中文本 */
.select-none {
  user-select: none;
}

/* 拖拽时的视觉反馈 */
.cursor-move {
  cursor: move;
}

/* 动画效果 */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
