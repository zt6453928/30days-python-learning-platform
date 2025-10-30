import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, CheckCircle } from "lucide-react";
import { Link, useParams } from "wouter";
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useAuth } from "@/_core/hooks/useAuth";

export default function DayLearn() {
  const { dayId } = useParams<{ dayId: string }>();
  const dayIdNum = parseInt(dayId || '1');
  const { isAuthenticated } = useAuth();
  
  const { data: dayContent, isLoading } = trpc.days.getContent.useQuery({ dayId: dayIdNum });
  const markLearnedMutation = trpc.progress.markLearned.useMutation();

  const handleMarkLearned = async () => {
    if (!isAuthenticated) return;
    await markLearnedMutation.mutateAsync({ dayId: dayIdNum });
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

  if (!dayContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">内容未找到</p>
          <Link href="/days">
            <Button className="mt-4">返回学习路径</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/days">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{dayContent.title}</h1>
                <p className="text-sm text-gray-600">预计时间: {dayContent.estimatedTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <Button onClick={handleMarkLearned} variant="outline" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  标记已学习
                </Button>
              )}
              <Link href={`/day/${dayIdNum}/practice`}>
                <Button size="sm">开始练习 →</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Learning Objectives */}
          {dayContent.learningObjectives && dayContent.learningObjectives.length > 0 && (
            <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                学习目标
              </h2>
              <ul className="space-y-2">
                {dayContent.learningObjectives.map((obj: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Main Content */}
          <Card className="p-8">
            <MarkdownRenderer content={dayContent.content.rawMarkdown} />
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            {dayIdNum > 1 && (
              <Link href={`/day/${dayIdNum - 1}/learn`}>
                <Button variant="outline">
                  ← Day {dayIdNum - 1}
                </Button>
              </Link>
            )}
            <div className="flex-1"></div>
            {dayIdNum < 30 && (
              <Link href={`/day/${dayIdNum + 1}/learn`}>
                <Button variant="outline">
                  Day {dayIdNum + 1} →
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
