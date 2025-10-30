import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllDays,
  getDayContent,
  getChallengesByDay,
  getChallengeById,
  getQuizzesByDay,
  getUserProgress,
  getUserDayProgressData,
  upsertUserDayProgress,
  getUserSubmissions,
  createSubmission,
  getUserStats,
  updateUserStats,
  getUserBadges,
  grantBadge,
  getLeaderboard,
} from "./db";
import { gradeWithAI, checkSyntax } from "./core/aiGrader";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 学习内容相关API
  days: router({
    // 获取所有天的概览
    list: publicProcedure.query(async () => {
      const allDays = await getAllDays();
      return allDays;
    }),

    // 获取某天的完整内容
    getContent: publicProcedure
      .input(z.object({ dayId: z.number().min(1).max(30) }))
      .query(async ({ input }) => {
        const day = await getDayContent(input.dayId);
        if (!day) {
          throw new Error('Day not found');
        }
        
        return {
          id: day.id,
          title: day.title,
          order: day.order,
          estimatedTime: day.estimatedTime,
          content: {
            rawMarkdown: day.contentMarkdown,
            parsedSections: JSON.parse(day.contentParsed),
          },
          learningObjectives: JSON.parse(day.learningObjectives || '[]'),
        };
      }),

    // 获取某天的练习题
    getChallenges: publicProcedure
      .input(z.object({ 
        dayId: z.number().min(1).max(30),
        level: z.number().min(1).max(3).optional(),
      }))
      .query(async ({ input }) => {
        const challengeList = await getChallengesByDay(input.dayId, input.level);
        
        return challengeList.map(c => ({
          id: c.id,
          dayId: c.dayId,
          level: c.level,
          title: c.title,
          description: c.description,
          difficulty: c.difficulty,
          source: c.source,
          starterCode: c.starterCode,
          hints: JSON.parse(c.hints),
          tags: JSON.parse(c.tags),
          estimatedTime: c.estimatedTime,
          publicTests: JSON.parse(c.publicTests),
          points: c.points,
        }));
      }),

    // 获取某天的测验题
    getQuizzes: publicProcedure
      .input(z.object({ dayId: z.number().min(1).max(30) }))
      .query(async ({ input }) => {
        const quizList = await getQuizzesByDay(input.dayId);
        
        return quizList.map(q => ({
          id: q.id,
          type: q.type,
          question: q.question,
          options: q.options ? JSON.parse(q.options) : null,
          explanation: q.explanation,
          difficulty: q.difficulty,
          // 不返回正确答案
        }));
      }),
  }),

  // 练习题相关API
  challenges: router({
    // 获取单个练习题详情
    getById: publicProcedure
      .input(z.object({ challengeId: z.string() }))
      .query(async ({ input }) => {
        const challenge = await getChallengeById(input.challengeId);
        if (!challenge) {
          throw new Error('Challenge not found');
        }
        
        return {
          id: challenge.id,
          dayId: challenge.dayId,
          level: challenge.level,
          title: challenge.title,
          description: challenge.description,
          difficulty: challenge.difficulty,
          starterCode: challenge.starterCode,
          hints: JSON.parse(challenge.hints),
          tags: JSON.parse(challenge.tags),
          estimatedTime: challenge.estimatedTime,
          publicTests: JSON.parse(challenge.publicTests),
          points: challenge.points,
        };
      }),

    // 提交代码
    submit: protectedProcedure
      .input(z.object({
        challengeId: z.string(),
        code: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const challenge = await getChallengeById(input.challengeId);
        if (!challenge) {
          throw new Error('Challenge not found');
        }

        // 先检查语法
        const syntaxCheck = await checkSyntax(input.code);
        if (!syntaxCheck.valid) {
          return {
            passed: false,
            score: 0,
            feedback: `语法错误: ${syntaxCheck.error}`,
            analysis: null,
          };
        }

        // 使用AI智能判题
        const startTime = Date.now();
        const gradingResult = await gradeWithAI({
          challengeDescription: challenge.description,
          referenceAnswer: challenge.referenceAnswer,
          answerExplanation: challenge.answerExplanation,
          gradingCriteria: JSON.parse(challenge.gradingCriteria),
          userCode: input.code,
        });
        const runtimeMs = Date.now() - startTime;

        // 创建提交记录
        const submission = await createSubmission({
          userId: ctx.user.id,
          challengeId: input.challengeId,
          code: input.code,
          passed: gradingResult.passed,
          score: gradingResult.score,
          runtimeMs,
          testResults: JSON.stringify(gradingResult.analysis),
          feedback: gradingResult.feedback,
          aiAnalysis: JSON.stringify(gradingResult.analysis),
        });

        // 更新用户进度
        if (gradingResult.passed) {
          const progress = await getUserDayProgressData(ctx.user.id, challenge.dayId);
          const levelKey = `exercisesLevel${challenge.level}Passed` as keyof typeof progress;
          const currentPassed = progress?.[levelKey] || 0;
          
          await upsertUserDayProgress(ctx.user.id, challenge.dayId, {
            [levelKey]: (currentPassed as number) + 1,
          });
        }

        return {
          passed: gradingResult.passed,
          score: gradingResult.score,
          feedback: gradingResult.feedback,
          analysis: gradingResult.analysis,
          submissionId: submission.id,
        };
      }),

    // 获取参考答案
    getSolution: protectedProcedure
      .input(z.object({ challengeId: z.string() }))
      .query(async ({ input, ctx }) => {
        const challenge = await getChallengeById(input.challengeId);
        if (!challenge) {
          throw new Error('Challenge not found');
        }

        // 检查用户是否已通过该题
        const submissions = await getUserSubmissions(ctx.user.id, input.challengeId);
        const hasPassed = submissions.some(s => s.passed);

        if (!hasPassed) {
          throw new Error('You must pass the challenge first');
        }

        return {
          solutionCode: challenge.solutionCode,
          explanation: '这是一个参考答案，你的实现可能有所不同。',
        };
      }),
  }),

  // 进度追踪API
  progress: router({
    // 获取用户的整体进度
    getOverall: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getUserProgress(ctx.user.id);
      const stats = await getUserStats(ctx.user.id);
      const badgeList = await getUserBadges(ctx.user.id);

      return {
        user: {
          id: ctx.user.id,
          name: ctx.user.name,
          avatar: ctx.user.avatar,
        },
        overall: {
          totalScore: stats?.totalScore || 0,
          daysCompleted: stats?.daysCompleted || 0,
          daysInProgress: stats?.daysInProgress || 0,
          currentStreak: stats?.currentStreak || 0,
          longestStreak: stats?.longestStreak || 0,
        },
        days: progress.map(p => ({
          dayId: p.dayId,
          learned: p.learned,
          quizPassed: p.quizPassed,
          exercisesLevel1Passed: p.exercisesLevel1Passed,
          exercisesLevel1Total: p.exercisesLevel1Total,
          exercisesLevel2Passed: p.exercisesLevel2Passed,
          exercisesLevel2Total: p.exercisesLevel2Total,
          exercisesLevel3Passed: p.exercisesLevel3Passed,
          exercisesLevel3Total: p.exercisesLevel3Total,
          score: p.score,
          completedAt: p.completedAt,
        })),
        badges: badgeList.map(b => ({
          code: b.badge.code,
          name: b.badge.name,
          icon: b.badge.icon,
          description: b.badge.description,
          grantedAt: b.grantedAt,
        })),
      };
    }),

    // 标记某天已学习
    markLearned: protectedProcedure
      .input(z.object({ dayId: z.number().min(1).max(30) }))
      .mutation(async ({ input, ctx }) => {
        await upsertUserDayProgress(ctx.user.id, input.dayId, {
          learned: true,
          startedAt: new Date(),
        });

        return { success: true };
      }),

    // 获取用户的提交历史
    getSubmissions: protectedProcedure
      .input(z.object({ challengeId: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const submissionList = await getUserSubmissions(ctx.user.id, input.challengeId);
        
        return submissionList.map(s => ({
          id: s.id,
          challengeId: s.challengeId,
          code: s.code,
          passed: s.passed,
          score: s.score,
          runtimeMs: s.runtimeMs,
          createdAt: s.createdAt,
        }));
      }),
  }),

  // 排行榜API
  leaderboard: router({
    get: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
      .query(async ({ input }) => {
        const leaders = await getLeaderboard(input.limit);
        
        return leaders.map((l, index) => ({
          rank: index + 1,
          user: {
            id: l.user.id,
            name: l.user.name,
            avatar: l.user.avatar,
          },
          score: l.stats.totalScore,
          daysCompleted: l.stats.daysCompleted,
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;
