/**
 * 调试 SecondMe Chat API
 */

import { PrismaClient } from '@prisma/client';
import proxyFetch from '../src/lib/proxyFetch';

const prisma = new PrismaClient();

const SECONDME_BASE_URL = 'https://app.mindos.com/gate/lab';

async function testChat() {
  console.log('=== 调试 SecondMe Chat API ===\n');

  // 获取一个有效用户
  const user = await prisma.user.findFirst({
    where: {
      tokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    console.log('❌ 没有有效 token 的用户');
    await prisma.$disconnect();
    return;
  }

  console.log(`用户: ${user.name || user.secondmeId}`);
  console.log(`Token 过期时间: ${user.tokenExpiry}`);
  console.log(`AccessToken: ${user.accessToken.slice(0, 20)}...`);
  console.log('');

  // 测试聊天
  const testMessage = '你好！请做一下自我介绍。';
  console.log(`发送消息: ${testMessage}`);
  console.log('');

  try {
    const response = await proxyFetch(`${SECONDME_BASE_URL}/api/secondme/chat/stream`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ message: testMessage }),
    });

    console.log(`响应状态: ${response.status}`);
    console.log(`响应头: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`错误响应: ${errorText}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      console.log('❌ 没有响应体');
      return;
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let chunkCount = 0;

    console.log('=== SSE 数据流 ===');
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('[END OF STREAM]');
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      chunkCount++;
      console.log(`\n--- Chunk ${chunkCount} ---`);
      console.log(chunk);

      // 解析 SSE
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            console.log(`  Parsed: ${JSON.stringify(parsed)}`);
            if (parsed.content) fullContent += parsed.content;
            if (parsed.delta) fullContent += parsed.delta;
          } catch {
            console.log(`  Raw data: ${data}`);
          }
        }
      }
    }

    console.log('\n=== 最终结果 ===');
    console.log(`完整内容: ${fullContent}`);
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }

  await prisma.$disconnect();
}

testChat().catch(console.error);
