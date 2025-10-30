import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, days, challenges, quizzes, submissions, 
  userDayProgress, badges, userBadges, userStats,
  type Day, type Challenge, type UserDayProgress, type Submission
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== 学习内容相关查询 ==========

/**
 * 获取所有学习单元（概览）
 */
export async function getAllDays() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    id: days.id,
    order: days.order,
    title: days.title,
    summary: days.summary,
    estimatedTime: days.estimatedTime,
  }).from(days).orderBy(days.order);
}

/**
 * 获取单个学习单元的完整内容
 */
export async function getDayContent(dayId: number): Promise<Day | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(days).where(eq(days.id, dayId)).limit(1);
  return result[0];
}

/**
 * 获取某天的所有练习题
 */
export async function getChallengesByDay(dayId: number, level?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = level 
    ? and(eq(challenges.dayId, dayId), eq(challenges.level, level))
    : eq(challenges.dayId, dayId);
  
  return await db.select().from(challenges).where(conditions).orderBy(challenges.level, challenges.id);
}

/**
 * 获取单个练习题
 */
export async function getChallengeById(challengeId: string): Promise<Challenge | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  return result[0];
}

/**
 * 获取某天的测验题
 */
export async function getQuizzesByDay(dayId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(quizzes).where(eq(quizzes.dayId, dayId));
}

// ========== 用户进度相关查询 ==========

/**
 * 获取用户的学习进度
 */
export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(userDayProgress).where(eq(userDayProgress.userId, userId));
}

/**
 * 获取用户某天的进度
 */
export async function getUserDayProgressData(userId: number, dayId: number): Promise<UserDayProgress | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userDayProgress)
    .where(and(eq(userDayProgress.userId, userId), eq(userDayProgress.dayId, dayId)))
    .limit(1);
  
  return result[0];
}

/**
 * 更新用户某天的进度
 */
export async function upsertUserDayProgress(userId: number, dayId: number, data: Partial<UserDayProgress>) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(userDayProgress).values({
    userId,
    dayId,
    ...data,
  } as any).onDuplicateKeyUpdate({
    set: data,
  });
}

/**
 * 获取用户的提交记录
 */
export async function getUserSubmissions(userId: number, challengeId?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = challengeId
    ? and(eq(submissions.userId, userId), eq(submissions.challengeId, challengeId))
    : eq(submissions.userId, userId);
  
  return await db.select().from(submissions)
    .where(conditions)
    .orderBy(desc(submissions.createdAt));
}

/**
 * 创建提交记录
 */
export async function createSubmission(data: {
  userId: number;
  challengeId: string;
  code: string;
  passed: boolean;
  score: number;
  runtimeMs: number;
  testResults: string;
  feedback?: string;
  aiAnalysis?: string;
}): Promise<Submission> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db.insert(submissions).values(data);
  
  // 返回最新的提交记录
  const created = await db.select().from(submissions)
    .where(and(eq(submissions.userId, data.userId), eq(submissions.challengeId, data.challengeId)))
    .orderBy(desc(submissions.createdAt))
    .limit(1);
  
  return created[0];
}

/**
 * 获取用户统计信息
 */
export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
  return result[0] || null;
}

/**
 * 更新用户统计信息
 */
export async function updateUserStats(userId: number, data: Partial<typeof userStats.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(userStats).values({
    userId,
    ...data,
  } as any).onDuplicateKeyUpdate({
    set: data,
  });
}

/**
 * 获取用户的徽章
 */
export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    badge: badges,
    grantedAt: userBadges.grantedAt,
  })
  .from(userBadges)
  .innerJoin(badges, eq(userBadges.badgeId, badges.id))
  .where(eq(userBadges.userId, userId));
}

/**
 * 授予用户徽章
 */
export async function grantBadge(userId: number, badgeCode: string) {
  const db = await getDb();
  if (!db) return;
  
  // 查找徽章
  const badge = await db.select().from(badges).where(eq(badges.code, badgeCode)).limit(1);
  if (!badge[0]) return;
  
  // 授予徽章
  await db.insert(userBadges).values({
    userId,
    badgeId: badge[0].id,
  }).onDuplicateKeyUpdate({
    set: { grantedAt: new Date() },
  });
}

/**
 * 获取排行榜
 */
export async function getLeaderboard(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    user: users,
    stats: userStats,
  })
  .from(userStats)
  .innerJoin(users, eq(userStats.userId, users.id))
  .orderBy(desc(userStats.totalScore))
  .limit(limit);
}
