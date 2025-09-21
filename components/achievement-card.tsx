"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Lock, CheckCircle } from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  points: number
  requirement_type: string
  requirement_value: number
  is_earned?: boolean
  progress?: number
  earned_at?: string
}

interface AchievementCardProps {
  achievement: Achievement
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const progress = achievement.progress || 0
  const progressPercentage = Math.min((progress / achievement.requirement_value) * 100, 100)
  const isCompleted = achievement.is_earned || progressPercentage >= 100

  const getRequirementText = () => {
    switch (achievement.requirement_type) {
      case "study_time":
        return `${achievement.requirement_value} minutos de estudo`
      case "sessions":
        return `${achievement.requirement_value} sessões de estudo`
      case "streak":
        return `${achievement.requirement_value} dias consecutivos`
      case "group_activity":
        return "Participar de um grupo"
      default:
        return achievement.description
    }
  }

  const getProgressText = () => {
    if (isCompleted) return "Concluído!"

    switch (achievement.requirement_type) {
      case "study_time":
        return `${progress}/${achievement.requirement_value} minutos`
      case "sessions":
        return `${progress}/${achievement.requirement_value} sessões`
      case "streak":
        return `${progress}/${achievement.requirement_value} dias`
      default:
        return `${Math.round(progressPercentage)}%`
    }
  }

  return (
    <Card
      className={`border-2 transition-all ${isCompleted ? "bg-gradient-to-br from-accent/10 to-primary/10 border-accent" : "hover:shadow-md"}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-2xl p-2 rounded-full ${isCompleted ? "bg-accent/20" : "bg-muted"}`}>
              {isCompleted ? (
                <CheckCircle className="h-6 w-6 text-accent" />
              ) : progressPercentage > 0 ? (
                <Trophy className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Lock className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{achievement.name}</CardTitle>
              <CardDescription className="text-sm">{getRequirementText()}</CardDescription>
            </div>
          </div>
          <Badge variant={isCompleted ? "default" : "outline"} className="text-xs">
            {achievement.points} XP
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{achievement.description}</p>

        {!isCompleted && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{getProgressText()}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {achievement.earned_at && (
          <div className="text-xs text-muted-foreground">
            Conquistado em {new Date(achievement.earned_at).toLocaleDateString("pt-BR")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
