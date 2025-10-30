/**
 * 额外综合题生成器
 * 为每天生成Level 3的综合挑战题
 */

import type { Exercise } from './loader';

interface ChallengeTemplate {
  title: string;
  description: string;
  starterCode: string;
  referenceAnswer?: string;  // 参考答案（可选）
  answerExplanation?: string;  // 答案解释（可选）
  hints: string[];
  tags: string[];
  gradingCriteria?: string[];  // 评分标准（可选）
}

/**
 * 为指定的Day生成额外的综合挑战题
 */
export function generateExtraChallenges(dayId: number, dayTitle: string): Exercise[] {
  const templates = getChallengeTemplates(dayId, dayTitle);
  
  return templates.map((template, index) => ({
    id: `challenge_${dayId}_3_${index + 1}`,
    level: 3,
    order: index + 1,
    description: template.description,
    starterCode: template.starterCode,
    referenceAnswer: template.referenceAnswer,
    answerExplanation: template.answerExplanation,
    hints: template.hints,
    tags: template.tags,
    gradingCriteria: template.gradingCriteria,
  }));
}

/**
 * 根据Day ID获取对应的挑战题模板
 */
function getChallengeTemplates(dayId: number, dayTitle: string): ChallengeTemplate[] {
  // 为每天定制的综合挑战题
  const challengeMap: Record<number, ChallengeTemplate[]> = {
    1: [
      {
        title: '个人信息卡片生成器',
        description: '创建一个程序，要求用户输入姓名、年龄、城市，然后以格式化的方式打印一张个人信息卡片。',
        starterCode: `# 个人信息卡片生成器
# 提示：使用input()获取用户输入，使用f-string格式化输出

`,
        referenceAnswer: `# 参考答案
name = input("请输入你的姓名: ")
age = input("请输入你的年龄: ")
city = input("请输入你的城市: ")

print("=" * 30)
print(f"姓名: {name}")
print(f"年龄: {age}")
print(f"城市: {city}")
print("=" * 30)
`,
        answerExplanation: '使用input()函数获取用户输入，然后使用f-string格式化输出信息卡片',
        hints: [
          '使用 input() 函数获取用户输入',
          '使用 f-string 进行字符串格式化：f"Hello {name}"',
          '可以使用多个print()语句创建卡片效果',
        ],
        gradingCriteria: ['使用input()获取用户输入', '使用f-string格式化输出', '输出格式清晰易读'],
        tags: ['Day 1', 'input', 'output', 'string'],
      },
      {
        title: 'Python版本检查器',
        description: '编写一个脚本，检查并打印当前Python版本，以及Python的安装路径。',
        starterCode: `# Python版本检查器
import sys

# 在这里编写代码

`,
        hints: [
          '使用 sys.version 获取版本信息',
          '使用 sys.executable 获取Python路径',
        ],
        referenceAnswer: `# 参考答案
# 请根据题目要求编写代码
`,
        answerExplanation: '综合运用本章所学知识完成挑战',
        gradingCriteria: ['代码能够正常运行', '实现了题目要求的功能', '代码风格良好', '综合运用了本章所学知识'],
        tags: ['Day 1', 'sys', 'version'],
      },
    ],
    2: [
      {
        title: '变量类型转换器',
        description: '创建一个程序，演示不同数据类型之间的转换（int, float, str），并处理可能的转换错误。',
        starterCode: `# 变量类型转换器
# 提示：使用int(), float(), str()进行类型转换

`,
        hints: [
          '使用 type() 检查变量类型',
          '使用 int(), float(), str() 进行转换',
          '注意某些转换可能失败（如 int("abc")）',
        ],
        referenceAnswer: `# 参考答案
# 请根据题目要求编写代码
`,
        answerExplanation: '综合运用本章所学知识完成挑战',
        gradingCriteria: ['代码能够正常运行', '实现了题目要求的功能', '代码风格良好', '综合运用了本章所学知识'],
        tags: ['Day 2', 'type', 'casting', 'variable'],
      },
      {
        title: '数学计算器',
        description: '编写一个简单的计算器，要求用户输入两个数字和一个运算符（+、-、*、/），然后计算并显示结果。',
        starterCode: `# 数学计算器
# 提示：使用input()获取输入，使用if-elif判断运算符

`,
        hints: [
          '使用 input() 获取用户输入',
          '使用 float() 将输入转换为数字',
          '使用 if-elif-else 判断运算符',
        ],
        referenceAnswer: `# 参考答案
# 请根据题目要求编写代码
`,
        answerExplanation: '综合运用本章所学知识完成挑战',
        gradingCriteria: ['代码能够正常运行', '实现了题目要求的功能', '代码风格良好', '综合运用了本章所学知识'],
        tags: ['Day 2', 'input', 'operators', 'calculation'],
      },
    ],
    3: [
      {
        title: '复杂表达式求值器',
        description: '创建一个程序，计算复杂的数学表达式，包括括号、幂运算、取模等。',
        starterCode: `# 复杂表达式求值器

`,
        hints: [
          '使用运算符优先级',
          '考虑使用括号改变优先级',
        ],
        referenceAnswer: `# 参考答案
# 请根据题目要求编写代码
`,
        answerExplanation: '综合运用本章所学知识完成挑战',
        gradingCriteria: ['代码能够正常运行', '实现了题目要求的功能', '代码风格良好', '综合运用了本章所学知识'],
        tags: ['Day 3', 'operators', 'expression'],
      },
      {
        title: 'BMI计算器',
        description: '编写一个BMI（身体质量指数）计算器，根据身高和体重计算BMI，并给出健康建议。',
        starterCode: `# BMI计算器
# BMI = 体重(kg) / (身高(m) ** 2)

`,
        hints: [
          'BMI公式：体重 / 身高²',
          '使用比较运算符判断BMI范围',
        ],
        referenceAnswer: `# 参考答案
# 请根据题目要求编写代码
`,
        answerExplanation: '综合运用本章所学知识完成挑战',
        gradingCriteria: ['代码能够正常运行', '实现了题目要求的功能', '代码风格良好', '综合运用了本章所学知识'],
        tags: ['Day 3', 'operators', 'calculation'],
      },
    ],
  };
  
  // 如果有特定的挑战题，返回；否则返回通用模板
  if (challengeMap[dayId]) {
    return challengeMap[dayId];
  }
  
  // 通用综合挑战题模板
  return [
    {
      title: `Day ${dayId} 综合练习`,
      description: `结合本天学习的所有知识点，编写一个综合程序。`,
      starterCode: `# Day ${dayId} 综合练习\n# 在这里编写你的代码\n\n`,
      hints: [
        '回顾本天学习的所有概念',
        '尝试将多个知识点结合使用',
      ],
      tags: [`Day ${dayId}`, 'comprehensive'],
    },
    {
      title: `实战项目：${dayTitle}应用`,
      description: `使用本天学到的知识，创建一个实用的小项目。`,
      starterCode: `# ${dayTitle}实战项目\n# 在这里编写你的代码\n\n`,
      hints: [
        '思考实际应用场景',
        '注重代码的可读性',
      ],
      tags: [`Day ${dayId}`, 'project'],
    },
  ];
}

/**
 * 为所有30天生成额外挑战题的映射
 */
export function generateAllExtraChallenges(days: Array<{ id: number; title: string }>): Map<number, Exercise[]> {
  const challengesMap = new Map<number, Exercise[]>();
  
  for (const day of days) {
    const challenges = generateExtraChallenges(day.id, day.title);
    challengesMap.set(day.id, challenges);
  }
  
  return challengesMap;
}
