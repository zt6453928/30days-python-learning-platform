import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Circle, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function DayList() {
  const { isAuthenticated } = useAuth();
  const { data: days, isLoading } = trpc.days.list.useQuery();
  const { data: progress } = trpc.progress.getOverall.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const getDayProgress = (dayId: number) => {
    return progress?.days.find(d => d.dayId === dayId);
  };

  const getDayStatus = (dayId: number) => {
    const dayProgress = getDayProgress(dayId);
    if (!dayProgress) return 'locked';
    if (dayProgress.completedAt) return 'completed';
    if (dayProgress.learned) return 'in-progress';
    return 'available';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回首页
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">30天学习路径</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Python学习地图</h2>
          <p className="text-gray-600">
            按顺序完成每一天的学习内容和练习题，循序渐进掌握Python
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {days?.map((day) => {
            const status = getDayStatus(day.id);
            const dayProgress = getDayProgress(day.id);

            return (
              <Card key={day.id} className={status === 'locked' ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {status === 'in-progress' && <Circle className="h-5 w-5 text-blue-600" />}
                        {status === 'locked' && <Lock className="h-5 w-5 text-gray-400" />}
                        {day.title}
                      </CardTitle>
                      <CardDescription className="mt-2">{day.summary}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">预计时间</span>
                      <Badge variant="secondary">{day.estimatedTime}</Badge>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link href={`/day/${day.id}/learn`}>
                        <Button variant="default" size="sm" className="flex-1">学习内容</Button>
                      </Link>
                      <Link href={`/day/${day.id}/practice`}>
                        <Button variant="outline" size="sm" className="flex-1">练习题</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
