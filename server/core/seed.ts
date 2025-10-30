/**
 * 数据初始化脚本
 * 解析30天Python内容并导入数据库
 */

import { getDb } from '../db';
import { days, challenges, quizzes, badges } from '../../drizzle/schema';
import { loadAllDays } from './loader';
import { generateExtraChallenges } from './challengeGenerator';

/**
 * 初始化数据库数据
 */
export async function seedDatabase() {
  console.log('🌱 开始初始化数据库...');
  
  const db = await getDb();
  if (!db) {
    throw new Error('数据库连接失败');
  }
  
  try {
    // 1. 加载所有30天的内容
    console.log('📚 正在解析30天Python学习内容...');
    const allDays = loadAllDays();
    console.log(`✅ 成功解析 ${allDays.length} 天的内容`);
    
    // 2. 导入学习单元数据
    console.log('📝 正在导入学习单元...');
    for (const day of allDays) {
      await db.insert(days).values({
        id: day.id,
        order: day.order,
        title: day.title,
        summary: day.summary,
        estimatedTime: day.estimatedTime,
        contentMarkdown: day.rawMarkdown,
        contentParsed: JSON.stringify(day.sections),
        learningObjectives: JSON.stringify(day.learningObjectives),
      }).onDuplicateKeyUpdate({
        set: {
          title: day.title,
          summary: day.summary,
          contentMarkdown: day.rawMarkdown,
          contentParsed: JSON.stringify(day.sections),
        }
      });
    }
    console.log(`✅ 成功导入 ${allDays.length} 个学习单元`);
    
    // 3. 导入练习题
    console.log('🏋️ 正在导入练习题...');
    let totalChallenges = 0;
    
    for (const day of allDays) {
      // Level 1 练习题（原文档）
      for (const exercise of day.exercises.level1) {
        await db.insert(challenges).values({
          id: exercise.id,
          dayId: day.id,
          level: 1,
          title: `练习 ${exercise.order}`,
          description: exercise.description,
          difficulty: 'easy',
          source: 'original',
          starterCode: exercise.starterCode,
          solutionCode: '# 参考答案\n' + exercise.starterCode,
          hints: JSON.stringify(exercise.hints),
          tags: JSON.stringify(exercise.tags),
          estimatedTime: '5-10分钟',
          publicTests: JSON.stringify([]),
          hiddenTests: JSON.stringify([]),
          points: 10,
        }).onDuplicateKeyUpdate({
          set: { description: exercise.description }
        });
        totalChallenges++;
      }
      
      // Level 2 练习题（原文档）
      for (const exercise of day.exercises.level2) {
        await db.insert(challenges).values({
          id: exercise.id,
          dayId: day.id,
          level: 2,
          title: `进阶练习 ${exercise.order}`,
          description: exercise.description,
          difficulty: 'medium',
          source: 'original',
          starterCode: exercise.starterCode,
          solutionCode: '# 参考答案\n' + exercise.starterCode,
          hints: JSON.stringify(exercise.hints),
          tags: JSON.stringify(exercise.tags),
          estimatedTime: '10-15分钟',
          publicTests: JSON.stringify([]),
          hiddenTests: JSON.stringify([]),
          points: 15,
        }).onDuplicateKeyUpdate({
          set: { description: exercise.description }
        });
        totalChallenges++;
      }
      
      // Level 3 综合挑战题（额外生成）
      const extraChallenges = generateExtraChallenges(day.id, day.title);
      for (const exercise of extraChallenges) {
        await db.insert(challenges).values({
          id: exercise.id,
          dayId: day.id,
          level: 3,
          title: `综合挑战 ${exercise.order}`,
          description: exercise.description,
          difficulty: 'hard',
          source: 'generated',
          starterCode: exercise.starterCode,
          solutionCode: '# 参考答案\n' + exercise.starterCode,
          hints: JSON.stringify(exercise.hints),
          tags: JSON.stringify(exercise.tags),
          estimatedTime: '15-30分钟',
          publicTests: JSON.stringify([]),
          hiddenTests: JSON.stringify([]),
          points: 20,
        }).onDuplicateKeyUpdate({
          set: { description: exercise.description }
        });
        totalChallenges++;
      }
    }
    console.log(`✅ 成功导入 ${totalChallenges} 道练习题`);
    
    // 4. 初始化徽章系统
    console.log('🏆 正在初始化徽章系统...');
    const badgeList = [
      {
        code: 'first_day',
        name: '初学者',
        icon: '🎓',
        description: '完成第一天的学习',
        rule: JSON.stringify({ type: 'complete_day', dayId: 1 }),
        points: 10,
      },
      {
        code: 'week_warrior',
        name: '一周战士',
        icon: '🔥',
        description: '连续学习7天',
        rule: JSON.stringify({ type: 'streak', days: 7 }),
        points: 50,
      },
      {
        code: 'perfect_score',
        name: '完美主义者',
        icon: '💯',
        description: '某一天的所有练习题全部通过',
        rule: JSON.stringify({ type: 'perfect_day' }),
        points: 30,
      },
      {
        code: 'speed_demon',
        name: '速度之王',
        icon: '⚡',
        description: '在5分钟内完成一道练习题',
        rule: JSON.stringify({ type: 'fast_solve', minutes: 5 }),
        points: 20,
      },
      {
        code: 'halfway',
        name: '半程马拉松',
        icon: '🏃',
        description: '完成15天的学习',
        rule: JSON.stringify({ type: 'complete_days', count: 15 }),
        points: 100,
      },
      {
        code: 'graduate',
        name: '毕业生',
        icon: '🎉',
        description: '完成全部30天的学习',
        rule: JSON.stringify({ type: 'complete_days', count: 30 }),
        points: 500,
      },
    ];
    
    for (const badge of badgeList) {
      await db.insert(badges).values(badge).onDuplicateKeyUpdate({
        set: { name: badge.name }
      });
    }
    console.log(`✅ 成功初始化 ${badgeList.length} 个徽章`);
    
    // 5. 统计信息
    console.log('\n📊 数据统计：');
    console.log(`   - 学习单元：${allDays.length} 天`);
    console.log(`   - 练习题总数：${totalChallenges} 道`);
    console.log(`   - 徽章数量：${badgeList.length} 个`);
    
    // 统计每个级别的练习题数量
    let level1Count = 0, level2Count = 0, level3Count = 0;
    for (const day of allDays) {
      level1Count += day.exercises.level1.length;
      level2Count += day.exercises.level2.length;
      level3Count += generateExtraChallenges(day.id, day.title).length;
    }
    console.log(`   - Level 1（基础）：${level1Count} 道`);
    console.log(`   - Level 2（进阶）：${level2Count} 道`);
    console.log(`   - Level 3（挑战）：${level3Count} 道`);
    
    console.log('\n✨ 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败：', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✅ 初始化成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 初始化失败：', error);
      process.exit(1);
    });
}
