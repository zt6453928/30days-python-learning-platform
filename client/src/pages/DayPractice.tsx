import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, Circle, Code } from "lucide-react";
import { Link, useParams } from "wouter";

export default function DayPractice() {
  const { dayId } = useParams<{ dayId: string }>();
  const dayIdNum = parseInt(dayId || '1');
  
  const { data: challenges, isLoading } = trpc.days.getChallenges.useQuery({ dayId: dayIdNum });

  const level1Challenges = challenges?.filter(c => c.level === 1) || [];
  const level2Challenges = challenges?.filter(c => c.level === 2) || [];
  const level3Challenges = challenges?.filter(c => c.level === 3) || [];

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
                <h1 className="text-xl font-bold">Day {dayIdNum} 练习题</h1>
                <p className="text-sm text-gray-600">共 {challenges?.length || 0} 道题目</p>
              </div>
            </div>
            <Link href={`/day/${dayIdNum}/learn`}>
              <Button variant="outline" size="sm">
                查看学习内容
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="level1" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="level1">
              Level 1 ({level1Challenges.length})
            </TabsTrigger>
            <TabsTrigger value="level2">
              Level 2 ({level2Challenges.length})
            </TabsTrigger>
            <TabsTrigger value="level3">
              Level 3 ({level3Challenges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="level1">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">基础练习</h2>
                <p className="text-gray-600">巩固基础知识，建立扎实的编程基础</p>
              </div>
              <div className="space-y-4">
                {level1Challenges.map((challenge, index) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} index={index + 1} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="level2">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">进阶练习</h2>
                <p className="text-gray-600">提升编程能力，掌握进阶技巧</p>
              </div>
              <div className="space-y-4">
                {level2Challenges.map((challenge, index) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} index={index + 1} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="level3">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">综合挑战</h2>
                <p className="text-gray-600">整合所学知识，挑战复杂问题</p>
              </div>
              <div className="space-y-4">
                {level3Challenges.map((challenge, index) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} index={index + 1} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, index }: { challenge: any; index: number }) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <span className="text-gray-400">#{index}</span>
              {challenge.title}
            </CardTitle>
            <CardDescription className="mt-2">
              {challenge.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={difficultyColors[challenge.difficulty as keyof typeof difficultyColors]}>
              {challenge.difficulty === 'easy' ? '简单' : challenge.difficulty === 'medium' ? '中等' : '困难'}
            </Badge>
            <Badge variant="outline">{challenge.estimatedTime}</Badge>
            <Badge variant="outline">{challenge.points} 分</Badge>
          </div>
          <Link href={`/challenge/${challenge.id}`}>
            <Button size="sm">
              <Code className="h-4 w-4 mr-2" />
              开始挑战
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
