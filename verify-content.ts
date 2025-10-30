/**
 * 内容完整性验收脚本
 * 验证所有学习内容和练习题是否完整导入
 */

import { getDb } from './server/db';
import { days, challenges } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function verifyContent() {
  console.log('🔍 开始内容完整性验收...\n');
  
  const db = await getDb();
  if (!db) {
    throw new Error('数据库连接失败');
  }

  // 1. 验证学习单元数量
  console.log('📚 验证学习单元...');
  const allDays = await db.select().from(days);
  console.log(`   ✅ 学习单元总数: ${allDays.length} (预期: 30)`);
  
  if (allDays.length !== 30) {
    console.error('   ❌ 学习单元数量不正确！');
    return false;
  }

  // 2. 验证每天的内容长度
  console.log('\n📝 验证每天内容完整性...');
  let contentIssues = 0;
  for (const day of allDays) {
    const contentLength = day.contentMarkdown?.length || 0;
    if (contentLength < 100) {
      console.error(`   ❌ Day ${day.id}: 内容过短 (${contentLength} 字符)`);
      contentIssues++;
    } else {
      console.log(`   ✅ Day ${day.id}: ${day.title} (${contentLength} 字符)`);
    }
  }
  
  if (contentIssues > 0) {
    console.error(`\n   ❌ 发现 ${contentIssues} 天内容异常`);
    return false;
  }

  // 3. 验证练习题总数
  console.log('\n🏋️ 验证练习题数量...');
  const allChallenges = await db.select().from(challenges);
  console.log(`   ✅ 练习题总数: ${allChallenges.length} (预期: ≥150)`);
  
  if (allChallenges.length < 150) {
    console.error('   ❌ 练习题数量不足！');
    return false;
  }

  // 4. 验证练习题分级
  const level1 = allChallenges.filter(c => c.level === 1);
  const level2 = allChallenges.filter(c => c.level === 2);
  const level3 = allChallenges.filter(c => c.level === 3);
  
  console.log(`   ✅ Level 1 (基础): ${level1.length} 道`);
  console.log(`   ✅ Level 2 (进阶): ${level2.length} 道`);
  console.log(`   ✅ Level 3 (挑战): ${level3.length} 道`);

  // 5. 验证练习题来源
  const originalChallenges = allChallenges.filter(c => c.source === 'original');
  const generatedChallenges = allChallenges.filter(c => c.source === 'generated');
  
  console.log(`\n📊 练习题来源统计:`);
  console.log(`   ✅ 原文档题目: ${originalChallenges.length} 道`);
  console.log(`   ✅ 额外生成题目: ${generatedChallenges.length} 道`);

  // 6. 逐天验证练习题
  console.log('\n🔍 逐天验证练习题分布...');
  let dayIssues = 0;
  for (let dayId = 1; dayId <= 30; dayId++) {
    const dayChallenges = allChallenges.filter(c => c.dayId === dayId);
    const dayLevel1 = dayChallenges.filter(c => c.level === 1).length;
    const dayLevel2 = dayChallenges.filter(c => c.level === 2).length;
    const dayLevel3 = dayChallenges.filter(c => c.level === 3).length;
    
    if (dayChallenges.length === 0) {
      console.error(`   ❌ Day ${dayId}: 没有练习题`);
      dayIssues++;
    } else {
      console.log(`   ✅ Day ${dayId}: ${dayChallenges.length} 道题 (L1:${dayLevel1} L2:${dayLevel2} L3:${dayLevel3})`);
    }
  }

  if (dayIssues > 0) {
    console.error(`\n   ❌ 发现 ${dayIssues} 天没有练习题`);
    return false;
  }

  // 7. 验证练习题描述完整性
  console.log('\n📋 验证练习题描述...');
  let descIssues = 0;
  for (const challenge of allChallenges) {
    if (!challenge.description || challenge.description.length < 10) {
      console.error(`   ❌ ${challenge.id}: 描述过短或缺失`);
      descIssues++;
    }
  }
  
  if (descIssues > 0) {
    console.error(`   ❌ 发现 ${descIssues} 道题描述异常`);
    return false;
  } else {
    console.log(`   ✅ 所有练习题描述完整`);
  }

  // 8. 最终统计
  console.log('\n' + '='.repeat(50));
  console.log('✨ 内容验收结果汇总:');
  console.log('='.repeat(50));
  console.log(`📚 学习单元: ${allDays.length} / 30`);
  console.log(`🏋️ 练习题总数: ${allChallenges.length} 道`);
  console.log(`   - Level 1: ${level1.length} 道`);
  console.log(`   - Level 2: ${level2.length} 道`);
  console.log(`   - Level 3: ${level3.length} 道`);
  console.log(`📊 题目来源:`);
  console.log(`   - 原文档: ${originalChallenges.length} 道`);
  console.log(`   - 额外生成: ${generatedChallenges.length} 道`);
  console.log('='.repeat(50));
  console.log('✅ 所有验收项通过！');
  
  return true;
}

// 运行验收
verifyContent()
  .then((success) => {
    if (success) {
      console.log('\n🎉 内容完整性验收通过！');
      process.exit(0);
    } else {
      console.error('\n❌ 内容完整性验收失败！');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ 验收过程出错：', error);
    process.exit(1);
  });
