"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, Clock, Target, Zap } from "lucide-react"

interface LeaderboardUser {
  id: string
  display_name: string
  username: string
  total_study_time: number
  level: number
  experience_points: number
  sessions_count: number
  current_streak: number
}

interface LeaderboardProps {
  users: LeaderboardUser[]
  currentUserId: string
}

export function Leaderboard({ users, currentUserId }: LeaderboardProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-xl font-bold text-muted-foreground">#{position}</span>
    }
  }

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 dark:from-yellow-950/30 dark:via-yellow-900/30 dark:to-yellow-950/30 border-yellow-300 dark:border-yellow-700 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/20"
      case 2:
        return "bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950/30 dark:via-gray-900/30 dark:to-gray-950/30 border-gray-300 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/20"
      case 3:
        return "bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 dark:from-amber-950/30 dark:via-amber-900/30 dark:to-amber-950/30 border-amber-300 dark:border-amber-700 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20"
      default:
        return "bg-gradient-to-r from-muted/30 to-muted/50 hover:from-muted/50 hover:to-muted/70 transition-all duration-200"
    }
  }

  const LeaderboardList = ({ sortedUsers, metric }: { sortedUsers: LeaderboardUser[]; metric: string }) => (
    <div className="space-y-3">
      {sortedUsers.map((user, index) => {
        const position = index + 1
        const isCurrentUser = user.id === currentUserId
        const isTopThree = position <= 3

        return (
          <div
            key={user.id}
            className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] ${getRankColor(
              position,
            )} ${isCurrentUser ? "ring-2 ring-primary/60 ring-offset-2" : ""} ${
              isTopThree ? "transform hover:scale-105" : ""
            }`}
          >
            <div className="flex items-center gap-5">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  isTopThree ? "bg-white/80 dark:bg-gray-800/80 shadow-md" : "bg-muted/50"
                }`}
              >
                {getRankIcon(position)}
              </div>

              <Avatar
                className={`h-12 w-12 ring-2 ${isTopThree ? "ring-white/60 dark:ring-gray-700/60" : "ring-muted/30"}`}
              >
                <AvatarFallback
                  className={`text-lg font-bold ${isTopThree ? "bg-gradient-to-br from-primary/20 to-accent/20" : ""}`}
                >
                  {user.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-3">
                  <p className={`font-semibold ${isTopThree ? "text-lg" : "text-base"}`}>{user.display_name}</p>
                  {isCurrentUser && (
                    <Badge variant="default" className="text-xs font-medium px-2 py-1">
                      Você
                    </Badge>
                  )}
                  {isTopThree && (
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium px-2 py-1 ${
                        position === 1
                          ? "border-yellow-400 text-yellow-600 dark:text-yellow-400"
                          : position === 2
                            ? "border-gray-400 text-gray-600 dark:text-gray-400"
                            : "border-amber-400 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      TOP {position}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-medium">@{user.username}</p>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-3 mb-1">
                <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
                  Nv. {user.level}
                </Badge>
                <div
                  className={`font-bold ${isTopThree ? "text-xl" : "text-lg"} ${
                    position === 1
                      ? "text-yellow-600 dark:text-yellow-400"
                      : position === 2
                        ? "text-gray-600 dark:text-gray-400"
                        : position === 3
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-foreground"
                  }`}
                >
                  {metric === "time" && formatTime(user.total_study_time)}
                  {metric === "sessions" && `${user.sessions_count} sessões`}
                  {metric === "streak" && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-orange-500" />
                      {user.current_streak} dias
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">{user.experience_points} XP</p>
            </div>
          </div>
        )
      })}
    </div>
  )

  const usersByTime = [...users].sort((a, b) => b.total_study_time - a.total_study_time)
  const usersBySessions = [...users].sort((a, b) => b.sessions_count - a.sessions_count)
  const usersByStreak = [...users].sort((a, b) => b.current_streak - a.current_streak)

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Trophy className="h-6 w-6 text-primary" />
          Ranking StudyRats
        </CardTitle>
        <CardDescription className="text-base">Veja como você se compara com outros estudantes</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="time" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="time" className="gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              Tempo de Estudo
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              Sessões
            </TabsTrigger>
            <TabsTrigger value="streak" className="gap-2 text-sm font-medium">
              <Zap className="h-4 w-4" />
              Sequência
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time" className="space-y-4">
            <LeaderboardList sortedUsers={usersByTime} metric="time" />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <LeaderboardList sortedUsers={usersBySessions} metric="sessions" />
          </TabsContent>

          <TabsContent value="streak" className="space-y-4">
            <LeaderboardList sortedUsers={usersByStreak} metric="streak" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
