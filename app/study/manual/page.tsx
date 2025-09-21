"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ManualStudyForm, type ManualStudyData } from "@/components/manual-study-form"
import { StudyHistory } from "@/components/study-history"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, History } from "lucide-react"

interface Group {
  id: string
  name: string
}

interface StudySession {
  id: string
  subject: string
  duration_minutes: number
  start_time: string
  end_time?: string
  session_type: "real_time" | "manual"
  notes?: string
  group_name?: string
}

export default function ManualStudyPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

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

      // Fetch user's groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("group_members")
        .select(`
          group_id,
          study_groups(id, name)
        `)
        .eq("user_id", user.id)

      if (groupsError) throw groupsError

      const userGroups = groupsData.map((item) => ({
        id: item.study_groups.id,
        name: item.study_groups.name,
      }))
      setGroups(userGroups)

      // Fetch user's study sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("study_sessions")
        .select(`
          *,
          study_groups(name)
        `)
        .eq("user_id", user.id)
        .order("start_time", { ascending: false })

      if (sessionsError) throw sessionsError

      const processedSessions = sessionsData.map((session) => ({
        ...session,
        group_name: session.study_groups?.name,
      }))
      setSessions(processedSessions)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmitManualSession = async (data: ManualStudyData) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Calculate end time
      const endTime = new Date(data.start_time)
      endTime.setMinutes(endTime.getMinutes() + data.duration_minutes)

      // Insert study session
      const { data: session, error: sessionError } = await supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
          group_id: data.group_id || null,
          subject: data.subject,
          start_time: data.start_time.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: data.duration_minutes,
          session_type: "manual",
          is_active: false,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Update user's total study time and experience
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_study_time, experience_points")
        .eq("id", user.id)
        .single()

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            total_study_time: profile.total_study_time + data.duration_minutes,
            experience_points: profile.experience_points + data.duration_minutes,
          })
          .eq("id", user.id)
      }

      // Refresh sessions list
      await fetchData()

      // Show success message
      alert(`Sessão de ${data.subject} (${data.duration_minutes} min) registrada com sucesso!`)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sessão?")) return

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get session details before deleting
      const { data: session } = await supabase
        .from("study_sessions")
        .select("duration_minutes")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single()

      if (!session) return

      // Delete session
      const { error: deleteError } = await supabase
        .from("study_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user.id)

      if (deleteError) throw deleteError

      // Update user's total study time
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_study_time, experience_points")
        .eq("id", user.id)
        .single()

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            total_study_time: Math.max(0, profile.total_study_time - session.duration_minutes),
            experience_points: Math.max(0, profile.experience_points - session.duration_minutes),
          })
          .eq("id", user.id)
      }

      // Refresh sessions list
      await fetchData()
    } catch (error) {
      console.error("Erro ao excluir sessão:", error)
      alert("Erro ao excluir sessão")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold text-primary mb-2">Registro Manual</h1>
          <p className="text-muted-foreground">Adicione sessões de estudo que você já completou</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="add" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Sessão
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Histórico ({sessions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <ManualStudyForm onSubmit={handleSubmitManualSession} isLoading={isLoading} groups={groups} />
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <StudyHistory sessions={sessions} onDelete={handleDeleteSession} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
