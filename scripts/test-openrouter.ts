/**
 * 调试 OpenRouter API
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('=== 调试 OpenRouter API ===\n');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

console.log(`API Key: ${OPENROUTER_API_KEY ? OPENROUTER_API_KEY.slice(0, 20) + '...' : 'NOT SET'}`);
console.log(`Base URL: ${OPENROUTER_BASE_URL}`);
console.log('');

async function test() {
  if (!OPENROUTER_API_KEY) {
    console.log('❌ OPENROUTER_API_KEY 未设置');
    return;
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'SecondMe Agent Network',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: '你好' }],
        max_tokens: 50,
      }),
    });

    console.log(`响应状态: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.log(`错误: ${error}`);
      return;
    }

    const result = await response.json();
    console.log(`回复: ${result.choices[0]?.message?.content}`);
    console.log('✅ OpenRouter API 正常');
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
}

test();
