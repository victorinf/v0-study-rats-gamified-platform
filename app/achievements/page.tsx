"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AchievementCard } from "@/components/achievement-card"
import { Leaderboard } from "@/components/leaderboard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Target, Star, Users } from "lucide-react"

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

interface UserProfile {
  id: string
  display_name: string
  username: string
  total_study_time: number
  level: number
  experience_points: number
}

interface LeaderboardUser extends UserProfile {
  sessions_count: number
  current_streak: number
}

export default function AchievementsPage() {
  const router = useRouter()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch current user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError
      setCurrentUser(profile)

      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("points", { ascending: true })

      if (achievementsError) throw achievementsError

      // Fetch user's earned achievements
      const { data: userAchievements, error: userAchievementsError } = await supabase
        .from("user_achievements")
        .select("achievement_id, earned_at")
        .eq("user_id", user.id)

      if (userAchievementsError) throw userAchievementsError

      const earnedAchievementIds = new Set(userAchievements.map((ua) => ua.achievement_id))

      // Fetch user's study sessions for progress calculation
      const { data: sessions, error: sessionsError } = await supabase
        .from("study_sessions")
        .select("duration_minutes, start_time")
        .eq("user_id", user.id)

      if (sessionsError) throw sessionsError

      // Calculate progress for each achievement
      const processedAchievements = achievementsData.map((achievement) => {
        const isEarned = earnedAchievementIds.has(achievement.id)
        const earnedData = userAchievements.find((ua) => ua.achievement_id === achievement.id)

        let progress = 0
        switch (achievement.requirement_type) {
          case "study_time":
            progress = profile.total_study_time
            break
          case "sessions":
            progress = sessions.length
            break
          case "streak":
            progress = 3 // Mock streak data
            break
          case "group_activity":
            progress = 1 // Mock group participation
            break
        }

        return {
          ...achievement,
          is_earned: isEarned,
          progress,
          earned_at: earnedData?.earned_at,
        }
      })

      setAchievements(processedAchievements)

      // Fetch leaderboard data (mock data for demo)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("total_study_time", { ascending: false })
        .limit(10)

      if (profilesError) throw profilesError

      const leaderboardData = profiles.map((profile) => ({
        ...profile,
        sessions_count: Math.floor(Math.random() * 50) + 10, // Mock data
        current_streak: Math.floor(Math.random() * 15) + 1, // Mock data
      }))

      setLeaderboardUsers(leaderboardData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando conquistas...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar dados</h2>
          <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </div>
      </div>
    )
  }

  const earnedAchievements = achievements.filter((a) => a.is_earned)
  const availableAchievements = achievements.filter((a) => !a.is_earned)
  const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0)
  const nextLevelXP = currentUser.level * 100
  const levelProgress = (currentUser.experience_points / nextLevelXP) * 100

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Conquistas & Rankings</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso e compare com outros StudyRats</p>
        </div>

        {/* User Progress Overview */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="border-2 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Seu Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">Nível {currentUser.level}</div>
                  <Progress value={levelProgress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {currentUser.experience_points}/{nextLevelXP} XP
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-accent mb-1">{earnedAchievements.length}</div>
                  <p className="text-sm text-muted-foreground">Conquistas de {achievements.length}</p>
                  <Badge variant="outline" className="mt-2">
                    {totalPoints} pontos totais
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500 mb-1">
                    {Math.floor(currentUser.total_study_time / 60)}h
                  </div>
                  <p className="text-sm text-muted-foreground">Tempo total de estudo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="achievements" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="achievements" className="gap-2">
                <Trophy className="h-4 w-4" />
                Conquistas
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Users className="h-4 w-4" />
                Rankings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="achievements" className="space-y-8">
              {earnedAchievements.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-accent" />
                    Conquistas Desbloqueadas ({earnedAchievements.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {earnedAchievements.map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  Próximas Conquistas ({availableAchievements.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableAchievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <Leaderboard users={leaderboardUsers} currentUserId={currentUser.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
