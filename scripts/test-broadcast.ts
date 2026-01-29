/**
 * 测试广播功能
 * 直接调用核心函数，测试完整流程
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { broadcastRequest, getNetworkUsers, generateSummary } from '../src/lib/agents/networkChat';

const prisma = new PrismaClient();

async function testBroadcast() {
  console.log('=== 测试广播功能 ===\n');

  // 1. 获取所有用户
  console.log('1. 获取网络中的用户...');
  const users = await prisma.user.findMany();
  console.log(`   共有 ${users.length} 个用户\n`);

  for (const user of users) {
    console.log(`   - ${user.name || user.secondmeId}`);
  }

  if (users.length < 2) {
    console.log('\n❌ 至少需要 2 个用户才能测试广播功能');
    await prisma.$disconnect();
    return;
  }

  // 2. 选择第一个用户作为发布者
  const requester = users[0];
  console.log(`\n2. 发布者: ${requester.name || requester.secondmeId}`);

  // 3. 创建一个测试需求
  const testContent = '我想办一场户外电影之夜，预算200块，需要投影仪和场地';
  console.log(`   需求内容: ${testContent}`);

  const request = await prisma.request.create({
    data: {
      userId: requester.id,
      content: testContent,
      budget: 200,
      status: 'pending',
    },
  });
  console.log(`   需求 ID: ${request.id}\n`);

  // 4. 测试获取网络用户（排除发布者）
  console.log('3. 获取网络中可对话的用户...');
  const networkUsers = await getNetworkUsers(requester.id);
  console.log(`   找到 ${networkUsers.length} 个用户\n`);

  for (const user of networkUsers) {
    console.log(`   - ${user.name || user.secondmeId}`);
  }

  // 5. 广播任务
  console.log('\n4. 开始广播任务...');
  console.log('   (这可能需要一些时间，因为要和每个用户的 AI 对话)\n');

  try {
    const results = await broadcastRequest(request.id, testContent, requester.id);

    console.log('\n5. 广播结果:');
    for (const result of results) {
      if (result.status === 'success') {
        console.log(`\n   ✅ ${result.targetUserName}`);
        console.log(`      对话 ID: ${result.conversationId}`);
        console.log(`      首条回复: ${result.firstReply?.slice(0, 100)}...`);
      } else {
        console.log(`\n   ❌ ${result.targetUserName}`);
        console.log(`      错误: ${result.error}`);
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    console.log(`\n   成功: ${successCount}/${results.length}`);

    // 6. 如果有成功的对话，生成总结
    if (successCount > 0) {
      console.log('\n6. 生成对话总结...');
      const summary = await generateSummary(request.id);
      console.log('\n   总结内容:');
      console.log('   ' + summary.split('\n').join('\n   '));
    }
  } catch (error) {
    console.error('\n❌ 广播失败:', error);
  }

  await prisma.$disconnect();
}

testBroadcast().catch(console.error);
