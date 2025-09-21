"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { StudyStatsCard } from "@/components/study-stats-card"
import { ActiveGroupsCard } from "@/components/active-groups-card"
import { RecentSessionsCard } from "@/components/recent-sessions-card"
import { QuickActionsCard } from "@/components/quick-actions-card"
import { Button } from "@/components/ui/button"
import { LogOut, Settings } from "lucide-react"

interface UserProfile {
  id: string
  username: string
  display_name: string
  total_study_time: number
  level: number
  experience_points: number
}

interface StudyStats {
  totalStudyTime: number
  sessionsToday: number
  weeklyGoal: number
  weeklyProgress: number
  currentStreak: number
  level: number
  experiencePoints: number
  nextLevelXP: number
}

interface Group {
  id: string
  name: string
  member_count: number
  online_members: number
  is_studying: boolean
}

interface StudySession {
  id: string
  subject: string
  duration_minutes: number
  session_type: "real_time" | "manual"
  start_time: string
  group_name?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<StudyStats | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Get user's groups with member counts in a single query
      const { data: userGroupsData, error: userGroupsError } = await supabase
        .from("group_members")
        .select(`
          group_id,
          study_groups!inner(
            id,
            name
          )
        `)
        .eq("user_id", user.id)

      if (userGroupsError) throw userGroupsError

      // Get member counts for each group using a simple approach
      const processedGroups: Group[] = []
      for (const membership of userGroupsData) {
        const group = membership.study_groups

        // Simple count query without RLS issues
        const { data: memberData, error: memberError } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", group.id)

        if (!memberError && memberData) {
          processedGroups.push({
            id: group.id,
            name: group.name,
            member_count: memberData.length,
            online_members: Math.floor(Math.random() * memberData.length) + 1,
            is_studying: Math.random() > 0.7,
          })
        }
      }
      setGroups(processedGroups)

      // Fetch recent study sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("study_sessions")
        .select(`
          *,
          study_groups(name)
        `)
        .eq("user_id", user.id)
        .order("start_time", { ascending: false })
        .limit(5)

      if (sessionsError) throw sessionsError

      const processedSessions = sessionsData.map((session) => ({
        ...session,
        group_name: session.study_groups?.name,
      }))
      setRecentSessions(processedSessions)

      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todaySessions = sessionsData.filter((session) => new Date(session.start_time) >= today)

      const weeklyGoal = 300 // 5 hours per week
      const thisWeekStart = new Date(today)
      thisWeekStart.setDate(today.getDate() - today.getDay())

      const thisWeekSessions = sessionsData.filter((session) => new Date(session.start_time) >= thisWeekStart)

      const weeklyStudyTime = thisWeekSessions.reduce((total, session) => total + (session.duration_minutes || 0), 0)

      const calculatedStats: StudyStats = {
        totalStudyTime: profileData.total_study_time,
        sessionsToday: todaySessions.length,
        weeklyGoal,
        weeklyProgress: Math.min((weeklyStudyTime / weeklyGoal) * 100, 100),
        currentStreak: 3, // Mock data for now
        level: profileData.level,
        experiencePoints: profileData.experience_points,
        nextLevelXP: profileData.level * 100, // Simple XP calculation
      }

      setStats(calculatedStats)
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!profile || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Erro ao carregar dados</h2>
          <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">StudyRats</h1>
            <p className="text-sm text-muted-foreground">Olá, {profile.display_name}! 👋</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Visão Geral</h2>
          <StudyStatsCard stats={stats} />
        </section>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <QuickActionsCard />
            <RecentSessionsCard sessions={recentSessions} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <ActiveGroupsCard groups={groups} />
          </div>
        </div>
      </main>
    </div>
  )
}
