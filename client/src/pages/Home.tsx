import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookOpen, Code, Trophy, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: progress } = trpc.progress.getOverall.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const completionRate = progress 
    ? (progress.overall.daysCompleted / 30) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/days">
                  <Button variant="ghost">学习路径</Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost">我的进度</Button>
                </Link>
                <span className="text-sm text-gray-600">你好, {user?.name}</span>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>登录开始学习</Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          30天掌握Python
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          完整的学习内容 + 充足的练习题库 + 即时反馈系统
          <br />
          从零基础到Python高手，只需30天
        </p>
        
        {isAuthenticated ? (
          <div className="max-w-md mx-auto mb-8">
            <Card>
              <CardHeader>
                <CardTitle>你的学习进度</CardTitle>
                <CardDescription>
                  已完成 {progress?.overall.daysCompleted || 0} / 30 天
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={completionRate} className="mb-4" />
                <Link href="/days">
                  <Button className="w-full" size="lg">
                    继续学习 →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <a href={getLoginUrl()}>
            <Button size="lg" className="text-lg px-8 py-6">
              开始学习之旅 →
            </Button>
          </a>
        )}
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">为什么选择我们</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <BookOpen className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>完整的学习内容</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                展示原文档的所有知识点，一个字都不少。包含概念讲解、代码示例、实战演练。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>充足的练习题库</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                219道练习题，分为基础、进阶、挑战三个级别。包含原文档所有题目 + 额外综合题。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-12 w-12 text-yellow-600 mb-4" />
              <CardTitle>即时反馈系统</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                代码提交后立即获得测试结果。进度追踪、成就徽章、排行榜，让学习更有动力。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">30</div>
              <div className="text-blue-100">学习天数</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">219+</div>
              <div className="text-blue-100">练习题目</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">内容完整</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">0</div>
              <div className="text-blue-100">学习成本</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h3 className="text-3xl font-bold mb-6">准备好开始了吗？</h3>
        <p className="text-xl text-gray-600 mb-8">
          立即加入，开启你的Python学习之旅
        </p>
        {!isAuthenticated && (
          <a href={getLoginUrl()}>
            <Button size="lg" className="text-lg px-8 py-6">
              免费开始学习
            </Button>
          </a>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>
            基于{" "}
            <a
              href="https://github.com/Asabeneh/30-Days-Of-Python"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              30-Days-Of-Python
            </a>{" "}
            构建 | MIT License
          </p>
        </div>
      </footer>
    </div>
  );
}
