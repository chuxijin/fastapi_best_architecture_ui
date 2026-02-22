import { requestClient } from '../request';

export interface ChatAttachment {
    type: 'image' | 'file';
    url: string;
    name?: string;
}

export interface ChatRequest {
    session_id?: number | null;
    query?: string;
    attachments?: ChatAttachment[];
    model?: string;
    context_count?: number;
}

export interface ChatResponse {
    session_id: number;
    text: string;
    meta?: any;
    tool_calls?: any[];
    message_id?: number;
}

export interface CopilotSession {
    id: number;
    title: string;
    model: string;
    created_time: string;
    updated_time?: string;
}

/**
 * 发送对话
 */
export async function sendCopilotChatApi(data: ChatRequest) {
    return requestClient.post<ChatResponse>('/api/v1/jia/copilot/chat', data);
}

/**
 * 获取会话列表
 */
export async function getCopilotSessionsApi() {
    return requestClient.get<CopilotSession[]>('/api/v1/jia/copilot/sessions');
}
