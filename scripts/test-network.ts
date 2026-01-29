/**
 * 测试简化版网络对话
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNetwork() {
  console.log('=== 测试简化版 Agent 网络 ===\n');

  // 1. 列出所有注册用户
  console.log('1. 已注册用户:');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      secondmeId: true,
      tokenExpiry: true,
    },
  });

  for (const user of users) {
    const isExpired = new Date(user.tokenExpiry) < new Date();
    console.log(`   - ${user.name || '未命名'} (${user.secondmeId})`);
    console.log(`     Token: ${isExpired ? '已过期' : '有效'}`);
  }

  console.log(`\n共有 ${users.length} 个用户\n`);

  // 2. API 使用说明
  console.log('2. 新的 API 接口:');
  console.log('');
  console.log('   POST /api/network/broadcast');
  console.log('   发布需求，和网络中的所有用户对话');
  console.log('   Body: { "content": "我想办户外电影之夜，预算200块" }');
  console.log('');
  console.log('   POST /api/network/chat');
  console.log('   继续和某个用户对话');
  console.log('   Body: { "conversationId": "xxx", "message": "你有投影仪吗？" }');
  console.log('');
  console.log('   GET /api/network/conversations?requestId=xxx');
  console.log('   获取某个任务的所有对话记录');
  console.log('');
  console.log('   POST /api/network/summary');
  console.log('   生成对话总结');
  console.log('   Body: { "requestId": "xxx" }');
  console.log('');

  // 3. 简化流程说明
  console.log('3. 简化后的流程:');
  console.log('');
  console.log('   用户发布需求');
  console.log('        ↓');
  console.log('   系统找到网络中的用户（最多10人）');
  console.log('        ↓');
  console.log('   和每个用户的 AI 分身对话');
  console.log('        ↓');
  console.log('   保存对话记录');
  console.log('        ↓');
  console.log('   用户可以继续深入对话');
  console.log('        ↓');
  console.log('   生成总结');

  await prisma.$disconnect();
}

testNetwork().catch(console.error);
