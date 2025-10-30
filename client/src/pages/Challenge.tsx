import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Editor from '@monaco-editor/react';
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
  const [showSolution, setShowSolution] = useState(false);
  
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

  const { data: solution, refetch: fetchSolution } = trpc.challenges.getSolution.useQuery(
    { challengeId: challengeId || '' },
    { enabled: false }
  );

  const handleViewSolution = async () => {
    try {
      await fetchSolution();
      setShowSolution(true);
    } catch (error: any) {
      toast.error(error.message || '需要先通过题目才能查看参考答案');
    }
  };

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
                <div className="border rounded-lg overflow-hidden">
                  <Editor
                    height="500px"
                    defaultLanguage="python"
                    value={code || challenge.starterCode}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      wordWrap: 'on',
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                </div>
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

            {/* AI Feedback */}
            {submitMutation.data && (
              <Card className={submitMutation.data.passed ? 'border-green-500' : 'border-red-500'}>
                <CardHeader>
                  <CardTitle className={submitMutation.data.passed ? 'text-green-600' : 'text-red-600'}>
                    {submitMutation.data.passed ? '✅ 通过' : '❌ 未通过'}
                  </CardTitle>
                  <CardDescription>
                    得分: {submitMutation.data.score}/100
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 简短反馈 */}
                  <div>
                    <h4 className="font-semibold mb-2">AI反馈</h4>
                    <p className="text-gray-700">{submitMutation.data.feedback}</p>
                  </div>

                  {/* 详细分析 */}
                  {submitMutation.data.analysis && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {submitMutation.data.analysis.correctness}
                          </div>
                          <div className="text-sm text-gray-600">正确性</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {submitMutation.data.analysis.codeQuality}
                          </div>
                          <div className="text-sm text-gray-600">代码质量</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {submitMutation.data.analysis.efficiency}
                          </div>
                          <div className="text-sm text-gray-600">效率</div>
                        </div>
                      </div>

                      {submitMutation.data.analysis.strengths?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-green-700">优点</h4>
                          <ul className="space-y-1">
                            {submitMutation.data.analysis.strengths.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600">✓</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {submitMutation.data.analysis.weaknesses?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-red-700">不足</h4>
                          <ul className="space-y-1">
                            {submitMutation.data.analysis.weaknesses.map((w: string, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-red-600">✗</span>
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {submitMutation.data.analysis.suggestions?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 text-blue-700">改进建议</h4>
                          <ul className="space-y-1">
                            {submitMutation.data.analysis.suggestions.map((s: string, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 查看参考答案按钮 */}
                  {submitMutation.data.passed && (
                    <Button
                      onClick={handleViewSolution}
                      variant="outline"
                      className="w-full"
                    >
                      查看参考答案
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 参考答案 */}
            {showSolution && solution && (
              <Card className="border-blue-500">
                <CardHeader>
                  <CardTitle className="text-blue-600">参考答案</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">代码</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Editor
                        height="300px"
                        defaultLanguage="python"
                        value={solution.solutionCode}
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 14,
                        }}
                      />
                    </div>
                  </div>
                  {solution.explanation && (
                    <div>
                      <h4 className="font-semibold mb-2">解释</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{solution.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
