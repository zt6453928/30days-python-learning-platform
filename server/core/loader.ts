import fs from 'fs';
import path from 'path';

/**
 * Markdown解析器 - 核心功能
 * 负责解析30天Python学习内容（中文版），提取完整的学习材料和练习题
 */

export interface ParsedSection {
  type: 'heading' | 'paragraph' | 'code' | 'list' | 'table' | 'image' | 'blockquote';
  level?: number;
  content: string;
  language?: string;
  runnable?: boolean;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  alt?: string;
  src?: string;
}

export interface Exercise {
  id: string;
  level: number;
  order: number;
  description: string;
  starterCode: string;
  hints: string[];
  tags: string[];
}

export interface DayContent {
  id: number;
  order: number;
  title: string;
  summary: string;
  estimatedTime: string;
  rawMarkdown: string;
  sections: ParsedSection[];
  exercises: {
    level1: Exercise[];
    level2: Exercise[];
    level3: Exercise[];
  };
  learningObjectives: string[];
}

/**
 * 从HTML标签中提取纯文本
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, '') // 移除所有HTML标签
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * 从Markdown内容中提取纯文本摘要
 */
function extractSummary(markdown: string): string {
  const lines = markdown.split('\n');
  let summary = '';
  let foundContent = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 跳过HTML标签、空行、标题、图片、链接
    if (trimmed.startsWith('<') || 
        trimmed.startsWith('#') || 
        trimmed.startsWith('!') || 
        trimmed.startsWith('[') ||
        trimmed.length === 0) {
      continue;
    }
    
    // 跳过代码块
    if (trimmed.startsWith('```')) {
      continue;
    }
    
    // 找到第一段有意义的文本
    if (trimmed.length > 20) {
      summary = stripHtmlTags(trimmed);
      foundContent = true;
      break;
    }
  }
  
  if (!foundContent || summary.length < 20) {
    summary = '学习Python编程的重要概念和实践技能';
  }
  
  // 限制摘要长度
  if (summary.length > 150) {
    summary = summary.substring(0, 147) + '...';
  }
  
  return summary;
}

/**
 * 提取预计学习时间
 */
function extractEstimatedTime(markdown: string): string {
  const match = markdown.match(/阅读大约需要[：:]\s*(\d+[mh分小时]+)/i);
  if (match) {
    return match[1].replace('m', '分钟').replace('h', '小时');
  }
  return '1-2小时';
}

/**
 * 提取学习目标
 */
function extractLearningObjectives(markdown: string): string[] {
  const objectives: string[] = [];
  const lines = markdown.split('\n');
  
  // 查找目录部分或重点内容
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 从目录中提取
    if (line.match(/^-\s+\[.+\]\(.+\)$/)) {
      const match = line.match(/\[(.+)\]/);
      if (match && match[1] && !match[1].includes('第') && !match[1].includes('Day')) {
        const objective = stripHtmlTags(match[1]);
        if (objective.length > 2 && objective.length < 50) {
          objectives.push(objective);
        }
      }
    }
  }
  
  // 如果没有找到，使用默认目标
  if (objectives.length === 0) {
    objectives.push('理解本章节的核心概念');
    objectives.push('掌握相关的Python语法');
    objectives.push('通过练习巩固所学知识');
  }
  
  return objectives.slice(0, 5); // 最多5个目标
}

/**
 * 解析练习题部分
 */
function parseExercises(markdown: string, dayId: number): { level1: Exercise[]; level2: Exercise[]; level3: Exercise[] } {
  const exercises = {
    level1: [] as Exercise[],
    level2: [] as Exercise[],
    level3: [] as Exercise[]
  };
  
  const lines = markdown.split('\n');
  let currentLevel = 0;
  let exerciseOrder = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测练习题级别
    if (line.match(/###\s*练习[：:]\s*1级|###\s*Exercises[：:]\s*Level\s*1/i)) {
      currentLevel = 1;
      exerciseOrder = 0;
      continue;
    }
    if (line.match(/###\s*练习[：:]\s*2级|###\s*Exercises[：:]\s*Level\s*2/i)) {
      currentLevel = 2;
      exerciseOrder = 0;
      continue;
    }
    if (line.match(/###\s*练习[：:]\s*3级|###\s*Exercises[：:]\s*Level\s*3/i)) {
      currentLevel = 3;
      exerciseOrder = 0;
      continue;
    }
    
    // 提取练习题
    if (currentLevel > 0 && line.match(/^\d+\.\s+.+/)) {
      exerciseOrder++;
      const description = line.replace(/^\d+\.\s+/, '').trim();
      
      if (description.length > 5) {
        const exercise: Exercise = {
          id: `day${dayId}_level${currentLevel}_${exerciseOrder}`,
          level: currentLevel,
          order: exerciseOrder,
          description: stripHtmlTags(description),
          starterCode: '# 在这里编写你的代码\n',
          hints: [],
          tags: []
        };
        
        if (currentLevel === 1) {
          exercises.level1.push(exercise);
        } else if (currentLevel === 2) {
          exercises.level2.push(exercise);
        } else if (currentLevel === 3) {
          exercises.level3.push(exercise);
        }
      }
    }
  }
  
  return exercises;
}

/**
 * 解析Markdown文件的完整内容
 */
export function parseMarkdownFile(filePath: string, dayId: number): DayContent {
  const rawMarkdown = fs.readFileSync(filePath, 'utf-8');
  
  // 提取标题
  const titleMatch = rawMarkdown.match(/# 📘 第.+天|#\s*Day\s*\d+[：:]/i);
  let title = titleMatch ? stripHtmlTags(titleMatch[0].replace(/^#\s*/, '')) : `Day ${dayId}`;
  
  // 如果标题太长，简化它
  if (title.length > 50) {
    const simpleMatch = rawMarkdown.match(/第(.+)天\s*[-–—]\s*(.+)|Day\s*\d+\s*[-–—]\s*(.+)/i);
    if (simpleMatch) {
      title = simpleMatch[2] || simpleMatch[3] || title;
      title = stripHtmlTags(title).substring(0, 50);
    }
  }
  
  // 提取摘要
  const summary = extractSummary(rawMarkdown);
  
  // 提取预计时间
  const estimatedTime = extractEstimatedTime(rawMarkdown);
  
  // 提取学习目标
  const learningObjectives = extractLearningObjectives(rawMarkdown);
  
  // 解析练习题
  const exercises = parseExercises(rawMarkdown, dayId);
  
  // 简单的section解析（用于展示）
  const sections: ParsedSection[] = [
    { type: 'paragraph', content: summary }
  ];
  
  return {
    id: dayId,
    order: dayId,
    title,
    summary,
    estimatedTime,
    rawMarkdown,
    sections,
    exercises,
    learningObjectives
  };
}

/**
 * 加载所有30天的学习内容
 */
export function loadAllDays(): DayContent[] {
  const chineseDir = path.join(process.cwd(), 'content', '30DaysPython', 'Chinese');
  const days: DayContent[] = [];
  
  // 检查Chinese目录是否存在
  if (!fs.existsSync(chineseDir)) {
    console.warn('Chinese目录不存在，尝试使用英文目录');
    return loadAllDaysFromEnglish();
  }
  
  // 读取Chinese目录下的所有md文件
  const files = fs.readdirSync(chineseDir).filter(f => f.endsWith('.md') && f !== 'README.md');
  
  for (const file of files) {
    // 从文件名提取day编号
    const match = file.match(/^(\d+)_/);
    if (match) {
      const dayId = parseInt(match[1]);
      const filePath = path.join(chineseDir, file);
      
      try {
        const dayContent = parseMarkdownFile(filePath, dayId);
        days.push(dayContent);
      } catch (error) {
        console.error(`解析${file}失败:`, error);
      }
    }
  }
  
  // Day 1 特殊处理（创建简单的介绍内容）
  days.unshift(createDay1Content());
  
  return days.sort((a, b) => a.order - b.order);
}

/**
 * 降级方案：从英文目录加载
 */
function loadAllDaysFromEnglish(): DayContent[] {
  const contentDir = path.join(process.cwd(), 'content', '30DaysPython');
  const days: DayContent[] = [];
  
  // Day 2-30 有Markdown文件
  for (let i = 2; i <= 30; i++) {
    const dayNum = i.toString().padStart(2, '0');
    const files = fs.readdirSync(contentDir);
    const dayFolder = files.find(f => f.startsWith(dayNum + '_Day_'));
    
    if (dayFolder) {
      const mdFiles = fs.readdirSync(path.join(contentDir, dayFolder))
        .filter(f => f.endsWith('.md'));
      
      if (mdFiles.length > 0) {
        const filePath = path.join(contentDir, dayFolder, mdFiles[0]);
        const dayContent = parseMarkdownFile(filePath, i);
        days.push(dayContent);
      }
    }
  }
  
  days.unshift(createDay1Content());
  
  return days.sort((a, b) => a.order - b.order);
}

/**
 * 为Day 1创建中文内容
 */
function createDay1Content(): DayContent {
  return {
    id: 1,
    order: 1,
    title: 'Day 1: Python 简介',
    summary: '欢迎来到30天Python学习之旅！在第一天，我们将了解Python的基础知识，安装Python环境，并编写第一个程序。',
    estimatedTime: '1-2小时',
    rawMarkdown: `# 📘 Day 1: Python 简介

欢迎来到30天Python学习之旅！

## 什么是Python

Python是一种高级、解释型、通用的编程语言。它的设计哲学强调代码的可读性和简洁性。Python由Guido van Rossum于1991年创建，现在已经成为世界上最流行的编程语言之一。

## 为什么学习Python

- **简单易学**：Python的语法简洁明了，非常适合编程初学者
- **功能强大**：可以用于Web开发、数据分析、人工智能、自动化等多个领域
- **应用广泛**：被Google、Facebook、Instagram等大公司广泛使用
- **社区活跃**：拥有庞大的开发者社区和丰富的第三方库

## Python的应用领域

1. **Web开发**：Django、Flask等框架
2. **数据科学**：NumPy、Pandas、Matplotlib
3. **人工智能**：TensorFlow、PyTorch
4. **自动化脚本**：系统管理、测试自动化
5. **游戏开发**：Pygame

## 开始你的Python之旅

让我们从第一个程序开始：

\`\`\`python
print("Hello, World!")
print("欢迎来到Python世界！")
\`\`\`

## 基本语法

### 注释
\`\`\`python
# 这是单行注释

"""
这是多行注释
可以写很多行
"""
\`\`\`

### 变量
\`\`\`python
name = "Python"
version = 3.11
is_awesome = True
\`\`\`

## 💻 练习 - Day 1

### 练习：1级

1. 检查你使用的Python版本
2. 打开Python交互式shell并进行以下操作：加法、减法、乘法、除法
3. 编写一个Python脚本并打印"Hello, World!"
4. 检查以下数据的数据类型：10, 9.8, 3.14, 'Hello', True

### 练习：2级

1. 在30DaysOfPython文件夹内创建一个名为day_1的文件夹
2. 编写一个Python注释，解释什么是Python
3. 编写不同的Python数据类型示例
4. 找到一个欧几里得距离计算公式并用Python实现
`,
    sections: [
      { type: 'heading', level: 1, content: 'Day 1: Python 简介' },
      { type: 'paragraph', content: '欢迎来到30天Python学习之旅！在第一天，我们将了解Python的基础知识，安装Python环境，并编写第一个程序。' }
    ],
    exercises: {
      level1: [
        {
          id: 'day1_level1_1',
          level: 1,
          order: 1,
          description: '检查你使用的Python版本',
          starterCode: '# 在这里编写你的代码\n',
          hints: ['使用 python --version 命令'],
          tags: ['基础']
        },
        {
          id: 'day1_level1_2',
          level: 1,
          order: 2,
          description: '打开Python交互式shell并进行以下操作：加法、减法、乘法、除法',
          starterCode: '# 在这里编写你的代码\n',
          hints: ['使用 +, -, *, / 运算符'],
          tags: ['基础', '运算符']
        }
      ],
      level2: [
        {
          id: 'day1_level2_1',
          level: 2,
          order: 1,
          description: '编写一个Python注释，解释什么是Python',
          starterCode: '# 在这里编写你的代码\n',
          hints: ['使用 # 或 """ """ 来写注释'],
          tags: ['注释']
        }
      ],
      level3: []
    },
    learningObjectives: [
      '了解Python的基本概念和特点',
      '学习Python的基本语法',
      '编写第一个Python程序',
      '理解Python的数据类型'
    ]
  };
}
