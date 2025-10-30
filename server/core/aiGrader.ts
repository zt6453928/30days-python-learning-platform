/**
 * AI智能判题引擎
 * 使用LLM对Python代码进行智能评分和反馈
 */

import { invokeLLM } from '../_core/llm';

export interface GradingResult {
  passed: boolean;
  score: number;  // 0-100
  feedback: string;  // 简短反馈
  analysis: {
    correctness: number;  // 正确性 0-100
    codeQuality: number;  // 代码质量 0-100
    efficiency: number;  // 效率 0-100
    suggestions: string[];  // 改进建议
    strengths: string[];  // 优点
    weaknesses: string[];  // 不足
  };
}

export interface GradingContext {
  challengeDescription: string;
  referenceAnswer: string;
  answerExplanation: string;
  gradingCriteria: string[];
  userCode: string;
}

/**
 * 使用AI对代码进行智能判题
 */
export async function gradeWithAI(context: GradingContext): Promise<GradingResult> {
  try {
    const prompt = buildGradingPrompt(context);
    
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert Python programming instructor. Your task is to evaluate student code submissions and provide constructive feedback in Chinese.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'grading_result',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              passed: { type: 'boolean', description: '是否通过' },
              score: { type: 'integer', description: '总分0-100' },
              feedback: { type: 'string', description: '简短反馈（50字以内）' },
              analysis: {
                type: 'object',
                properties: {
                  correctness: { type: 'integer', description: '正确性分数0-100' },
                  codeQuality: { type: 'integer', description: '代码质量分数0-100' },
                  efficiency: { type: 'integer', description: '效率分数0-100' },
                  suggestions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '改进建议列表'
                  },
                  strengths: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '代码优点列表'
                  },
                  weaknesses: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '代码不足列表'
                  }
                },
                required: ['correctness', 'codeQuality', 'efficiency', 'suggestions', 'strengths', 'weaknesses'],
                additionalProperties: false
              }
            },
            required: ['passed', 'score', 'feedback', 'analysis'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error('AI返回空内容');
    }

    const result = JSON.parse(content) as GradingResult;
    
    // 验证结果
    if (typeof result.passed !== 'boolean' || 
        typeof result.score !== 'number' ||
        result.score < 0 || result.score > 100) {
      throw new Error('AI返回的结果格式不正确');
    }

    return result;
    
  } catch (error) {
    console.error('AI判题失败:', error);
    // 降级方案：返回基础评分
    return getFallbackGrading(context);
  }
}

/**
 * 构建AI判题提示词
 */
function buildGradingPrompt(context: GradingContext): string {
  return `请评估以下Python代码提交：

**题目描述：**
${context.challengeDescription}

**参考答案：**
\`\`\`python
${context.referenceAnswer}
\`\`\`

**答案说明：**
${context.answerExplanation}

**评分标准：**
${context.gradingCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**学生提交的代码：**
\`\`\`python
${context.userCode}
\`\`\`

请根据以下维度进行评分（每项0-100分）：
1. **正确性（correctness）**：代码是否实现了题目要求的功能
2. **代码质量（codeQuality）**：代码风格、可读性、命名规范
3. **效率（efficiency）**：算法效率、资源使用

评分规则：
- 总分 = (正确性 × 0.6 + 代码质量 × 0.25 + 效率 × 0.15)
- 总分 >= 60 视为通过（passed = true）
- 提供3-5条具体的改进建议
- 指出代码的2-3个优点
- 指出代码的1-3个不足

请以JSON格式返回评分结果。`;
}

/**
 * 降级方案：基础规则判题
 */
function getFallbackGrading(context: GradingContext): GradingResult {
  const userCode = context.userCode.trim();
  
  // 基础检查
  const hasCode = userCode.length > 20;
  const hasComments = userCode.includes('#');
  const notJustComments = userCode.replace(/#.*/g, '').trim().length > 10;
  
  const passed = hasCode && notJustComments;
  const score = passed ? 70 : 30;
  
  return {
    passed,
    score,
    feedback: passed ? '代码已提交，建议运行测试验证功能' : '代码过于简单，请完善实现',
    analysis: {
      correctness: passed ? 70 : 30,
      codeQuality: hasComments ? 70 : 50,
      efficiency: 60,
      suggestions: [
        '建议添加更多注释说明代码逻辑',
        '可以考虑添加错误处理',
        '尝试优化代码结构'
      ],
      strengths: passed ? ['代码结构清晰'] : [],
      weaknesses: passed ? [] : ['代码实现不完整']
    }
  };
}

/**
 * 快速检查代码语法（不执行）
 */
export async function checkSyntax(code: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // 使用AI快速检查语法
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a Python syntax checker. Only check if the code has syntax errors, do not execute it.'
        },
        {
          role: 'user',
          content: `Check if this Python code has syntax errors:\n\n\`\`\`python\n${code}\n\`\`\``
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'syntax_check',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
              error: { type: 'string' }
            },
            required: ['valid'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      return { valid: true };
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('语法检查失败:', error);
    return { valid: true };  // 降级：假设语法正确
  }
}
