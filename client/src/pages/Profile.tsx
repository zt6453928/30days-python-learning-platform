import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Trophy, Flame, Calendar, Target } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: progress, isLoading } = trpc.progress.getOverall.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">请先登录查看个人档案</p>
          <a href={getLoginUrl()}>
            <Button>登录</Button>
          </a>
        </div>
      </div>
    );
  }

  const completionRate = progress 
    ? (progress.overall.daysCompleted / 30) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回首页
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">我的学习档案</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {user?.avatar && (
                  <img src={user.avatar} alt={user.name || ''} className="h-16 w-16 rounded-full" />
                )}
                <div>
                  <CardTitle>{user?.name || '学习者'}</CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{progress?.overall.totalScore || 0}</div>
                  <div className="text-sm text-gray-600">总分</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{progress?.overall.daysCompleted || 0}</div>
                  <div className="text-sm text-gray-600">完成天数</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Flame className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{progress?.overall.currentStreak || 0}</div>
                  <div className="text-sm text-gray-600">连续学习</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{progress?.overall.longestStreak || 0}</div>
                  <div className="text-sm text-gray-600">最长连续</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle>学习进度</CardTitle>
              <CardDescription>
                已完成 {progress?.overall.daysCompleted || 0} / 30 天
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={completionRate} className="mb-2" />
              <p className="text-sm text-gray-600 text-center">
                {completionRate.toFixed(1)}% 完成
              </p>
            </CardContent>
          </Card>

          {/* Badges */}
          {progress && progress.badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>成就徽章</CardTitle>
                <CardDescription>
                  已获得 {progress.badges.length} 个徽章
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {progress.badges.map((badge) => (
                    <div key={badge.code} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-3xl">{badge.icon}</span>
                      <div>
                        <div className="font-semibold">{badge.name}</div>
                        <div className="text-xs text-gray-600">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Days Progress */}
          <Card>
            <CardHeader>
              <CardTitle>每日进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {progress?.days.slice(0, 10).map((day) => {
                  const totalExercises = day.exercisesLevel1Total + day.exercisesLevel2Total + day.exercisesLevel3Total;
                  const passedExercises = day.exercisesLevel1Passed + day.exercisesLevel2Passed + day.exercisesLevel3Passed;
                  const rate = totalExercises > 0 ? (passedExercises / totalExercises) * 100 : 0;

                  return (
                    <div key={day.dayId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Day {day.dayId}</span>
                          <span className="text-sm text-gray-600">
                            {passedExercises} / {totalExercises} 题
                          </span>
                        </div>
                        <Progress value={rate} className="h-2" />
                      </div>
                      {day.completedAt && (
                        <Badge className="bg-green-100 text-green-800">已完成</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link href="/days" className="flex-1">
              <Button className="w-full">继续学习</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
