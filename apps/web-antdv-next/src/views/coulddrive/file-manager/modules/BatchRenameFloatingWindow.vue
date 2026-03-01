<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';

interface Props {
  visible?: boolean;
  taskId?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'update:visible', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  taskId: '',
});

const emit = defineEmits<Emits>();

// DOM引用
const floatingWindowRef = ref<HTMLElement>();
const currentFolderRef = ref<HTMLElement>();
const currentFileRef = ref<HTMLElement>();
const progressStatsRef = ref<HTMLElement>();

// 状态数据
const statusMessage = ref('正在处理重命名请求...');
const currentFolder = ref('-');
const currentFile = ref('-');
const progressStats = ref('0/0');

// 拖拽相关
const position = reactive({ x: 100, y: 100 });
const isDragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });

// SSE连接
let eventSource: EventSource | null = null;

// 开始拖拽
const startDrag = (e: MouseEvent) => {
  if (!floatingWindowRef.value) return;

  isDragging.value = true;
  const rect = floatingWindowRef.value.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;

  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', endDrag);
  e.preventDefault();
};

// 处理拖拽
const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;

  position.x = e.clientX - dragOffset.x;
  position.y = e.clientY - dragOffset.y;
};

// 结束拖拽
const endDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', endDrag);
};

// 重置状态
const resetState = () => {
  statusMessage.value = '正在处理重命名请求...';
  currentFolder.value = '-';
  currentFile.value = '-';
  progressStats.value = '0/0';
};

// 更新进度显示
const updateProgressDisplay = (data: any) => {
  if (data.message) {
    statusMessage.value = data.message;
  }

  if (data.current_folder !== undefined) {
    currentFolder.value = data.current_folder || '-';
  }

  if (data.current_file !== undefined) {
    currentFile.value = data.current_file || '-';
  }

  if (data.completed !== undefined && data.total !== undefined) {
    progressStats.value = `${data.completed}/${data.total}`;
  }
};

// 建立SSE连接
const connectSSE = () => {
  if (!props.taskId) return;

  // 导入API函数
  import('#/api').then(({ getBatchRenameProgressApi }) => {
    eventSource = getBatchRenameProgressApi(props.taskId);

    if (!eventSource) return;

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'heartbeat') {
          // 心跳消息，保持连接
          return;
        }

        updateProgressDisplay(data);

        // 任务完成或出错时关闭悬浮窗
        if (data.type === 'complete' || data.type === 'error') {
          setTimeout(() => {
            close();
          }, 2000); // 延迟2秒关闭，让用户看到完成状态
        }
      } catch (error) {
        console.error('解析SSE数据失败:', error);
      }
    });

    eventSource.addEventListener('error', (error) => {
      console.error('SSE连接错误:', error);
      // 连接错误时也关闭悬浮窗
      setTimeout(() => {
        close();
      }, 1000);
    });
  });
};

// 关闭悬浮窗
const close = () => {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  emit('close');
  emit('update:visible', false);
};

// 组件挂载时建立SSE连接
onMounted(() => {
  if (props.visible && props.taskId) {
    // 重置状态，确保初始状态是干净的
    resetState();
    connectSSE();
  }
});

// 监听visible变化
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible && props.taskId) {
      // 重置状态，确保每次显示都是干净的状态
      resetState();
      connectSSE();
    } else if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  },
);

// 组件卸载时清理
onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', endDrag);
});

// 暴露方法给父组件
defineExpose({
  updateProgressDisplay,
  resetState,
  close,
});
</script>

<template>
  <div
    v-if="visible"
    ref="floatingWindowRef"
    class="batch-rename-floating-window"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
  >
    <!-- 标题栏 -->
    <div class="floating-header" @mousedown="startDrag">
      <span class="drag-hint">拖拽移动</span>
      <button class="close-btn" @click="close">×</button>
    </div>

    <!-- 内容区域 -->
    <div class="floating-content">
      <!-- 加载动画 -->
      <div class="loading-spinner"></div>

      <!-- 状态信息 -->
      <div class="status-info">
        <div class="status-message">{{ statusMessage }}</div>

        <!-- 进度详情 -->
        <div class="progress-details">
          <div class="progress-item">
            <span class="label">当前文件夹:</span>
            <span class="value" ref="currentFolderRef">{{
              currentFolder
            }}</span>
          </div>
          <div class="progress-item">
            <span class="label">当前文件:</span>
            <span class="value" ref="currentFileRef">{{ currentFile }}</span>
          </div>
          <div class="progress-item">
            <span class="label">进度:</span>
            <span class="value" ref="progressStatsRef">{{
              progressStats
            }}</span>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="hint-text">请稍候，完成后会自动关闭</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.batch-rename-floating-window {
  position: fixed;
  z-index: 9999;
  width: 400px;
  user-select: none;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
}

.floating-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: move;
  background: #f5f5f5;
  border-bottom: 1px solid #d9d9d9;
  border-radius: 8px 8px 0 0;
}

.drag-hint {
  font-size: 12px;
  color: #666;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  background: none;
  border: none;
}

.close-btn:hover {
  color: #ff4d4f;
}

.floating-content {
  padding: 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.status-info {
  margin-bottom: 16px;
}

.status-message {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.progress-details {
  padding: 12px;
  margin-bottom: 16px;
  text-align: left;
  background: #fafafa;
  border-radius: 6px;
}

.progress-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.progress-item:last-child {
  margin-bottom: 0;
}

.label {
  flex-shrink: 0;
  width: 80px;
  color: #666;
}

.value {
  flex: 1;
  color: #333;
  word-break: break-all;
}

.hint-text {
  font-size: 12px;
  color: #999;
}
</style>
