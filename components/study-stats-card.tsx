"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Target, TrendingUp, Zap } from "lucide-react"

interface StudyStatsCardProps {
  stats: {
    totalStudyTime: number
    sessionsToday: number
    weeklyGoal: number
    weeklyProgress: number
    currentStreak: number
    level: number
    experiencePoints: number
    nextLevelXP: number
  }
}

export function StudyStatsCard({ stats }: StudyStatsCardProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const xpProgress = (stats.experiencePoints / stats.nextLevelXP) * 100

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatTime(stats.totalStudyTime)}</div>
          <p className="text-xs text-muted-foreground">{stats.sessionsToday} sessões hoje</p>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta Semanal</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{Math.round(stats.weeklyProgress)}%</div>
          <Progress value={stats.weeklyProgress} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">{formatTime(stats.weeklyGoal)} por semana</p>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sequência</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">{stats.currentStreak}</div>
          <p className="text-xs text-muted-foreground">dias consecutivos</p>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nível</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <div className="text-2xl font-bold text-primary">{stats.level}</div>
            <Badge variant="secondary" className="text-xs">
              {stats.experiencePoints} XP
            </Badge>
          </div>
          <Progress value={xpProgress} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.nextLevelXP - stats.experiencePoints} XP para o próximo nível
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
