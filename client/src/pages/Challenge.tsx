import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Play, Send, Lightbulb } from "lucide-react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Challenge() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const { isAuthenticated } = useAuth();
  const [code, setCode] = useState("");
  const [showHints, setShowHints] = useState(false);
  
  const { data: challenge, isLoading } = trpc.challenges.getById.useQuery(
    { challengeId: challengeId || '' },
    { enabled: !!challengeId }
  );
  
  const submitMutation = trpc.challenges.submit.useMutation({
    onSuccess: (data) => {
      if (data.passed) {
        toast.success(`恭喜！获得 ${data.score} 分`);
      } else {
        toast.error('未通过，请继续尝试');
      }
    },
  });

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    if (!code.trim()) {
      toast.error('请输入代码');
      return;
    }
    await submitMutation.mutateAsync({
      challengeId: challengeId || '',
      code,
    });
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

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">题目未找到</p>
          <Link href="/days">
            <Button className="mt-4">返回学习路径</Button>
          </Link>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/day/${challenge.dayId}/practice`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{challenge.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={difficultyColors[challenge.difficulty as keyof typeof difficultyColors]}>
                  {challenge.difficulty === 'easy' ? '简单' : challenge.difficulty === 'medium' ? '中等' : '困难'}
                </Badge>
                <Badge variant="outline">Level {challenge.level}</Badge>
                <Badge variant="outline">{challenge.points} 分</Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Problem Description */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>题目描述</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{challenge.description}</p>
              </CardContent>
            </Card>

            {/* Hints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    提示
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHints(!showHints)}
                  >
                    {showHints ? '隐藏' : '显示'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showHints && (
                <CardContent>
                  <ul className="space-y-2">
                    {challenge.hints.map((hint: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">💡</span>
                        <span className="text-gray-700">{hint}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {challenge.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Right: Code Editor */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>代码编辑器</CardTitle>
                <CardDescription>在下方编写你的Python代码</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={code || challenge.starterCode}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono min-h-[400px] resize-none"
                  placeholder="在这里编写你的代码..."
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending || !isAuthenticated}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitMutation.isPending ? '提交中...' : '提交代码'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Result */}
            {submitMutation.data && (
              <Card className={submitMutation.data.passed ? 'border-green-500' : 'border-red-500'}>
                <CardHeader>
                  <CardTitle className={submitMutation.data.passed ? 'text-green-600' : 'text-red-600'}>
                    {submitMutation.data.passed ? '✅ 通过' : '❌ 未通过'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    {submitMutation.data.passed 
                      ? `恭喜！你获得了 ${submitMutation.data.score} 分`
                      : '请检查代码并重试'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
