import fs from 'fs';
import path from 'path';

/**
 * Markdown解析器 - 核心功能
 * 负责解析30天Python学习内容，提取完整的学习材料和练习题
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
 * 解析Markdown文件的完整内容
 */
export function parseMarkdownFile(filePath: string, dayId: number): DayContent {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 提取标题
  const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/<h1[^>]*>(.+?)<\/h1>/);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `Day ${dayId}`;
  
  // 提取摘要（第一段文字）
  const paragraphs = content.split('\n\n').filter(p => 
    p.trim() && 
    !p.startsWith('#') && 
    !p.startsWith('```') && 
    !p.startsWith('![') &&
    !p.startsWith('<') &&
    !p.startsWith('-') &&
    !p.startsWith('*')
  );
  const summary = paragraphs[0]?.substring(0, 200) || `Python Day ${dayId} 学习内容`;
  
  // 解析章节结构
  const sections = parseMarkdownSections(content);
  
  // 提取练习题
  const exercises = extractExercises(content, dayId);
  
  // 提取学习目标
  const learningObjectives = extractLearningObjectives(content);
  
  return {
    id: dayId,
    order: dayId,
    title,
    summary,
    estimatedTime: estimateReadingTime(content),
    rawMarkdown: content,
    sections,
    exercises,
    learningObjectives,
  };
}

/**
 * 解析Markdown内容为结构化章节
 */
function parseMarkdownSections(markdown: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = markdown.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // 标题
    if (line.match(/^#{1,6}\s+/)) {
      const level = line.match(/^(#{1,6})/)?.[1].length || 1;
      const content = line.replace(/^#{1,6}\s+/, '').replace(/<[^>]+>/g, '').trim();
      sections.push({ type: 'heading', level, content });
      i++;
    }
    // 代码块
    else if (line.startsWith('```')) {
      const language = line.substring(3).trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      const code = codeLines.join('\n');
      sections.push({
        type: 'code',
        language,
        content: code,
        runnable: language === 'python' || language === 'py',
      });
      i++;
    }
    // 图片
    else if (line.match(/^!\[([^\]]*)\]\(([^)]+)\)/)) {
      const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        sections.push({
          type: 'image',
          alt: match[1],
          src: match[2],
          content: match[1],
        });
      }
      i++;
    }
    // 列表
    else if (line.match(/^[\s]*[-*+]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].match(/^[\s]*[-*+]\s+/) || lines[i].match(/^[\s]*\d+\.\s+/))) {
        const item = lines[i].replace(/^[\s]*[-*+]\s+/, '').replace(/^[\s]*\d+\.\s+/, '').trim();
        if (item) items.push(item);
        i++;
      }
      sections.push({ type: 'list', content: items.join('\n'), items });
    }
    // 引用
    else if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s*/, ''));
        i++;
      }
      sections.push({ type: 'blockquote', content: quoteLines.join('\n') });
    }
    // 段落
    else if (line.trim() && !line.startsWith('<') && !line.startsWith('[')) {
      const paragraphLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !lines[i].match(/^[#`!\-*+>]/) && !lines[i].match(/^\d+\./)) {
        paragraphLines.push(lines[i]);
        i++;
      }
      const content = paragraphLines.join(' ').trim();
      if (content) {
        sections.push({ type: 'paragraph', content });
      }
    }
    else {
      i++;
    }
  }
  
  return sections;
}

/**
 * 提取练习题
 */
function extractExercises(markdown: string, dayId: number): {
  level1: Exercise[];
  level2: Exercise[];
  level3: Exercise[];
} {
  const exercises = {
    level1: [] as Exercise[],
    level2: [] as Exercise[],
    level3: [] as Exercise[],
  };
  
  // 查找练习题部分
  const exerciseMatch = markdown.match(/##\s*💻\s*Exercises[\s\S]*$/i) || 
                       markdown.match(/##\s*Exercises[\s\S]*$/i);
  
  if (!exerciseMatch) {
    return exercises;
  }
  
  const exerciseSection = exerciseMatch[0];
  
  // 提取Level 1练习题
  const level1Match = exerciseSection.match(/###\s*Exercises:\s*Level\s*1([\s\S]*?)(?=###|$)/i);
  if (level1Match) {
    exercises.level1 = parseExerciseList(level1Match[1], dayId, 1);
  }
  
  // 提取Level 2练习题
  const level2Match = exerciseSection.match(/###\s*Exercises:\s*Level\s*2([\s\S]*?)(?=###|$)/i);
  if (level2Match) {
    exercises.level2 = parseExerciseList(level2Match[1], dayId, 2);
  }
  
  // 提取Level 3练习题（如果有）
  const level3Match = exerciseSection.match(/###\s*Exercises:\s*Level\s*3([\s\S]*?)(?=###|$)/i);
  if (level3Match) {
    exercises.level3 = parseExerciseList(level3Match[1], dayId, 3);
  }
  
  return exercises;
}

/**
 * 解析练习题列表
 */
function parseExerciseList(text: string, dayId: number, level: number): Exercise[] {
  const exercises: Exercise[] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let currentExercise: Partial<Exercise> | null = null;
  let order = 1;
  
  for (const line of lines) {
    // 匹配编号的练习题
    const match = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (match) {
      // 保存上一个练习题
      if (currentExercise && currentExercise.description) {
        exercises.push({
          id: `challenge_${dayId}_${level}_${currentExercise.order}`,
          level,
          order: currentExercise.order!,
          description: currentExercise.description,
          starterCode: generateStarterCode(currentExercise.description),
          hints: generateHints(currentExercise.description),
          tags: extractTags(currentExercise.description, dayId),
        });
      }
      
      // 开始新的练习题
      currentExercise = {
        order,
        description: match[2].trim(),
      };
      order++;
    } else if (currentExercise && line.trim()) {
      // 继续当前练习题的描述
      currentExercise.description += ' ' + line.trim();
    }
  }
  
  // 保存最后一个练习题
  if (currentExercise && currentExercise.description) {
    exercises.push({
      id: `challenge_${dayId}_${level}_${currentExercise.order}`,
      level,
      order: currentExercise.order!,
      description: currentExercise.description,
      starterCode: generateStarterCode(currentExercise.description),
      hints: generateHints(currentExercise.description),
      tags: extractTags(currentExercise.description, dayId),
    });
  }
  
  return exercises;
}

/**
 * 生成起始代码模板
 */
function generateStarterCode(description: string): string {
  return `# ${description.substring(0, 50)}...\n# 在这里编写你的代码\n\n`;
}

/**
 * 生成提示
 */
function generateHints(description: string): string[] {
  const hints: string[] = [];
  
  if (description.toLowerCase().includes('print')) {
    hints.push('使用 print() 函数输出结果');
  }
  if (description.toLowerCase().includes('variable')) {
    hints.push('记得先声明变量');
  }
  if (description.toLowerCase().includes('function')) {
    hints.push('定义函数使用 def 关键字');
  }
  if (description.toLowerCase().includes('list')) {
    hints.push('列表使用方括号 [] 创建');
  }
  
  if (hints.length === 0) {
    hints.push('仔细阅读题目要求');
    hints.push('参考本天的学习内容');
  }
  
  return hints;
}

/**
 * 提取标签
 */
function extractTags(description: string, dayId: number): string[] {
  const tags: string[] = [`Day ${dayId}`];
  
  const keywords = ['variable', 'function', 'list', 'dict', 'string', 'loop', 'if', 'class'];
  for (const keyword of keywords) {
    if (description.toLowerCase().includes(keyword)) {
      tags.push(keyword);
    }
  }
  
  return tags;
}

/**
 * 提取学习目标
 */
function extractLearningObjectives(markdown: string): string[] {
  const objectives: string[] = [];
  
  // 尝试从内容中提取关键概念
  const headings = markdown.match(/^##\s+(.+)$/gm);
  if (headings) {
    headings.slice(0, 5).forEach(heading => {
      const cleaned = heading.replace(/^##\s+/, '').replace(/[#*`]/g, '').trim();
      if (cleaned && !cleaned.toLowerCase().includes('exercise')) {
        objectives.push(`理解${cleaned}`);
      }
    });
  }
  
  return objectives;
}

/**
 * 估算阅读时间
 */
function estimateReadingTime(markdown: string): string {
  const words = markdown.split(/\s+/).length;
  const minutes = Math.ceil(words / 200); // 假设每分钟200字
  
  if (minutes < 30) {
    return `${minutes}分钟`;
  } else if (minutes < 90) {
    return `${Math.floor(minutes / 30) * 30}分钟 - ${Math.ceil(minutes / 30) * 30}分钟`;
  } else {
    const hours = Math.floor(minutes / 60);
    return `${hours}-${hours + 1}小时`;
  }
}

/**
 * 加载所有30天的内容
 */
export function loadAllDays(): DayContent[] {
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
  
  // Day 1 特殊处理（创建简单的介绍内容）
  days.unshift(createDay1Content());
  
  return days.sort((a, b) => a.order - b.order);
}

/**
 * 为Day 1创建内容（因为原仓库没有Day 1的Markdown）
 */
function createDay1Content(): DayContent {
  return {
    id: 1,
    order: 1,
    title: 'Day 1: Python 简介',
    summary: '欢迎来到30天Python学习之旅！在第一天，我们将了解Python的基础知识。',
    estimatedTime: '1-2小时',
    rawMarkdown: `# Day 1: Python 简介

欢迎来到30天Python学习之旅！

## 什么是Python

Python是一种高级、解释型、通用的编程语言。它的设计哲学强调代码的可读性和简洁性。

## 为什么学习Python

- 简单易学
- 功能强大
- 应用广泛
- 社区活跃

## 开始你的Python之旅

让我们从第一个程序开始：

\`\`\`python
print("Hello, World!")
\`\`\`

## 💻 Exercises - Day 1

### Exercises: Level 1

1. Check the Python version you are using
2. Open the Python interactive shell and do the following operations
3. Write a Python script and print "Hello, World!"
4. Check the data types of the following data: 10, 9.8, 3.14, 'Hello'

### Exercises: Level 2

1. Create a folder named day_1 inside 30DaysOfPython folder
2. Write a Python comment explaining what Python is
3. Write different Python data types
`,
    sections: [
      { type: 'heading', level: 1, content: 'Day 1: Python 简介' },
      { type: 'paragraph', content: '欢迎来到30天Python学习之旅！' },
      { type: 'heading', level: 2, content: '什么是Python' },
      { type: 'paragraph', content: 'Python是一种高级、解释型、通用的编程语言。' },
    ],
    exercises: {
      level1: [
        {
          id: 'challenge_1_1_1',
          level: 1,
          order: 1,
          description: 'Check the Python version you are using',
          starterCode: '# 检查Python版本\n# 在这里编写你的代码\n\n',
          hints: ['使用 python --version 命令', '或在代码中使用 sys.version'],
          tags: ['Day 1', 'basics'],
        },
        {
          id: 'challenge_1_1_2',
          level: 1,
          order: 2,
          description: 'Write a Python script and print "Hello, World!"',
          starterCode: '# 打印 Hello, World!\n# 在这里编写你的代码\n\n',
          hints: ['使用 print() 函数', '字符串需要用引号包围'],
          tags: ['Day 1', 'print'],
        },
      ],
      level2: [
        {
          id: 'challenge_1_2_1',
          level: 2,
          order: 1,
          description: 'Write a Python comment explaining what Python is',
          starterCode: '# 在这里编写注释解释什么是Python\n\n',
          hints: ['注释以 # 开头', '可以写多行注释'],
          tags: ['Day 1', 'comment'],
        },
      ],
      level3: [],
    },
    learningObjectives: [
      '了解Python的基本概念',
      '学会编写第一个Python程序',
      '理解Python的应用场景',
    ],
  };
}
