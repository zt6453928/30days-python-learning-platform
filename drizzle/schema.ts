import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * 用户表 - 核心认证表
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * 学习单元表 - 存储30天的学习内容
 */
export const days = mysqlTable("days", {
  id: int("id").primaryKey(), // 1-30
  order: int("order").notNull(), // 显示顺序
  title: varchar("title", { length: 200 }).notNull(), // "Day 1: 简介"
  summary: text("summary").notNull(), // 简短描述
  estimatedTime: varchar("estimatedTime", { length: 50 }), // "2-3小时"
  contentMarkdown: text("contentMarkdown").notNull(), // 完整的原始Markdown
  contentParsed: text("contentParsed").notNull(), // JSON字符串，结构化内容
  learningObjectives: text("learningObjectives"), // JSON数组
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 知识测验表 - 每天的小测验题
 */
export const quizzes = mysqlTable("quizzes", {
  id: varchar("id", { length: 100 }).primaryKey(), // "day_1_quiz_1"
  dayId: int("dayId").notNull(), // 关联到days表
  type: mysqlEnum("type", ["multiple_choice", "true_false", "fill_blank"]).notNull(),
  question: text("question").notNull(),
  options: text("options"), // JSON数组，选择题选项
  correctAnswer: varchar("correctAnswer", { length: 500 }).notNull(),
  explanation: text("explanation").notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("easy").notNull(),
  points: int("points").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * 练习题表 - 编程练习题（分级）
 */
export const challenges = mysqlTable("challenges", {
  id: varchar("id", { length: 100 }).primaryKey(), // "challenge_1_1"
  dayId: int("dayId").notNull(),
  level: int("level").notNull(), // 1: 基础, 2: 进阶, 3: 挑战
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("easy").notNull(),
  source: mysqlEnum("source", ["original", "generated"]).default("original").notNull(),
  starterCode: text("starterCode").notNull(),
  solutionCode: text("solutionCode").notNull(),
  hints: text("hints").notNull(), // JSON数组
  tags: text("tags").notNull(), // JSON数组
  estimatedTime: varchar("estimatedTime", { length: 50 }),
  publicTests: text("publicTests").notNull(), // JSON数组
  hiddenTests: text("hiddenTests").notNull(), // JSON数组（不通过API暴露）
  points: int("points").default(10).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * 代码提交记录表
 */
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  challengeId: varchar("challengeId", { length: 100 }).notNull(),
  code: text("code").notNull(),
  passed: boolean("passed").notNull(),
  score: int("score").default(0).notNull(),
  runtimeMs: int("runtimeMs").default(0).notNull(),
  testResults: text("testResults").notNull(), // JSON字符串
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * 用户每日学习进度表
 */
export const userDayProgress = mysqlTable("userDayProgress", {
  userId: int("userId").notNull(),
  dayId: int("dayId").notNull(),
  learned: boolean("learned").default(false).notNull(), // 是否已学习内容
  quizPassed: boolean("quizPassed").default(false).notNull(), // 是否通过测验
  exercisesLevel1Passed: int("exercisesLevel1Passed").default(0).notNull(),
  exercisesLevel1Total: int("exercisesLevel1Total").default(0).notNull(),
  exercisesLevel2Passed: int("exercisesLevel2Passed").default(0).notNull(),
  exercisesLevel2Total: int("exercisesLevel2Total").default(0).notNull(),
  exercisesLevel3Passed: int("exercisesLevel3Passed").default(0).notNull(),
  exercisesLevel3Total: int("exercisesLevel3Total").default(0).notNull(),
  score: int("score").default(0).notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  pk: { columns: [table.userId, table.dayId] }
}));

/**
 * 成就徽章表
 */
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(), // "first_day", "week_warrior"
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // emoji或图标
  description: text("description").notNull(),
  rule: text("rule").notNull(), // JSON字符串，描述获得条件
  points: int("points").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * 用户徽章关联表
 */
export const userBadges = mysqlTable("userBadges", {
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
}, (table) => ({
  pk: { columns: [table.userId, table.badgeId] }
}));

/**
 * 用户学习统计表 - 汇总统计信息
 */
export const userStats = mysqlTable("userStats", {
  userId: int("userId").primaryKey(),
  totalScore: int("totalScore").default(0).notNull(),
  daysCompleted: int("daysCompleted").default(0).notNull(),
  daysInProgress: int("daysInProgress").default(0).notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  totalStudyTimeMinutes: int("totalStudyTimeMinutes").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// 类型导出
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Day = typeof days.$inferSelect;
export type InsertDay = typeof days.$inferInsert;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

export type UserDayProgress = typeof userDayProgress.$inferSelect;
export type InsertUserDayProgress = typeof userDayProgress.$inferInsert;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;
