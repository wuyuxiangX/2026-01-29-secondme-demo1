/**
 * OpenRouter AI 客户端封装
 * 支持多种模型，用于 Agent 协商系统
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// 可用模型配置
// 注意：使用中国大陆可用的模型
export const MODELS = {
  // 需求分析和对话 - 理解力强
  ANALYST: 'deepseek/deepseek-chat',
  // 快速评估 - 成本低，速度快
  EVALUATOR: 'deepseek/deepseek-chat',
  // 结构化输出 - 稳定可靠
  STRUCTURED: 'deepseek/deepseek-chat',
} as const;

export type ModelType = typeof MODELS[keyof typeof MODELS];

// 消息类型
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 聊天选项
export interface ChatOptions {
  model?: ModelType;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// 聊天响应
export interface ChatResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 流式响应块
export interface StreamChunk {
  id: string;
  choices: {
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

/**
 * 发送聊天请求（非流式）
 */
export async function chat(options: ChatOptions): Promise<ChatResponse> {
  const { model = MODELS.ANALYST, messages, temperature = 0.7, max_tokens = 2000 } = options;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'SecondMe Agent Network',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * 发送流式聊天请求
 */
export async function chatStream(options: ChatOptions): Promise<ReadableStream<string>> {
  const { model = MODELS.ANALYST, messages, temperature = 0.7, max_tokens = 2000 } = options;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'SecondMe Agent Network',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          controller.close();
          return;
        }

        try {
          const parsed: StreamChunk = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(content);
          }
        } catch {
          // 忽略解析错误
        }
      }
    },
  });
}

/**
 * 快速聊天 - 返回纯文本响应
 */
export async function quickChat(
  prompt: string,
  systemPrompt?: string,
  model: ModelType = MODELS.ANALYST
): Promise<string> {
  const messages: Message[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await chat({ model, messages });
  return response.choices[0]?.message?.content || '';
}

/**
 * JSON 模式聊天 - 返回结构化数据
 */
export async function jsonChat<T>(
  prompt: string,
  systemPrompt: string,
  model: ModelType = MODELS.STRUCTURED
): Promise<T> {
  const messages: Message[] = [
    { role: 'system', content: systemPrompt + '\n\n请务必只返回有效的 JSON，不要包含任何其他文字。' },
    { role: 'user', content: prompt },
  ];

  const response = await chat({ model, messages, temperature: 0.3 });
  const content = response.choices[0]?.message?.content || '{}';

  // 尝试提取 JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return JSON.parse(content);
}
