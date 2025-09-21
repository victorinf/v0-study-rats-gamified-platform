"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { StudyTimer } from "@/components/study-timer"
import { GroupStudyParticipants } from "@/components/group-study-participants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users } from "lucide-react"

interface Participant {
  id: string
  display_name: string
  username: string
  is_studying: boolean
  study_time: number
  subject?: string
}

interface GroupDetails {
  id: string
  name: string
  description: string
}

export default function GroupStudyPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [subject, setSubject] = useState("")
  const [targetMinutes, setTargetMinutes] = useState(25)
  const [isSessionStarted, setIsSessionStarted] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchGroupData = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from("study_groups")
        .select("*")
        .eq("id", groupId)
        .single()

      if (groupError) throw groupError
      setGroup(groupData)

      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)

      if (membersError) throw membersError

      const memberIds = membersData.map((member) => member.user_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", memberIds)

      if (profilesError) throw profilesError

      const mockParticipants: Participant[] = membersData.map((member, index) => {
        const profile = profilesData.find((p) => p.id === member.user_id) || {
          username: "unknown",
          display_name: "Unknown User",
        }

        return {
          id: member.user_id,
          display_name: profile.display_name,
          username: profile.username,
          is_studying: Math.random() > 0.6, // Random for demo
          study_time: Math.floor(Math.random() * 60), // Random study time for demo
          subject: index % 3 === 0 ? "Matemática" : index % 3 === 1 ? "História" : undefined,
        }
      })

      setParticipants(mockParticipants)
    } catch (error) {
      console.error("Erro ao carregar dados do grupo:", error)
      router.push("/groups")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartSession = async () => {
    if (!subject.trim()) return

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: session, error } = await supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
          group_id: groupId,
          subject: subject.trim(),
          start_time: new Date().toISOString(),
          session_type: "real_time",
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setCurrentSessionId(session.id)
      setIsSessionStarted(true)

      // Update member status to studying
      await supabase.from("group_members").update({ is_online: true }).eq("group_id", groupId).eq("user_id", user.id)
    } catch (error) {
      console.error("Erro ao iniciar sessão:", error)
    }
  }

  const handleSessionComplete = async (duration: number) => {
    if (!currentSessionId) return

    try {
      const supabase = createClient()
      const endTime = new Date()

      const { error: sessionError } = await supabase
        .from("study_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: duration,
          is_active: false,
        })
        .eq("id", currentSessionId)

      if (sessionError) throw sessionError

      // Update user's total study time
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_study_time, experience_points")
          .eq("id", user.id)
          .single()

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              total_study_time: profile.total_study_time + duration,
              experience_points: profile.experience_points + duration,
            })
            .eq("id", user.id)
        }
      }

      alert(`Parabéns! Você estudou ${subject} por ${duration} minutos no grupo ${group?.name}!`)
      router.push(`/groups/${groupId}`)
    } catch (error) {
      console.error("Erro ao finalizar sessão:", error)
    }
  }

  const handleSessionUpdate = async (duration: number, isActive: boolean) => {
    if (!currentSessionId) return

    try {
      const supabase = createClient()
      await supabase
        .from("study_sessions")
        .update({
          duration_minutes: duration,
          is_active: isActive,
        })
        .eq("id", currentSessionId)
    } catch (error) {
      console.error("Erro ao atualizar sessão:", error)
    }
  }

  useEffect(() => {
    fetchGroupData()
  }, [groupId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sessão de grupo...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Grupo não encontrado</h2>
          <Button onClick={() => router.push("/groups")}>Voltar aos Grupos</Button>
        </div>
      </div>
    )
  }

  if (isSessionStarted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/groups/${groupId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Grupo
            </Button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Sessão em Grupo</h1>
            <p className="text-muted-foreground">Estudando com {group.name}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <StudyTimer
                subject={subject}
                targetMinutes={targetMinutes}
                onSessionComplete={handleSessionComplete}
                onSessionUpdate={handleSessionUpdate}
              />
            </div>

            <div>
              <GroupStudyParticipants participants={participants} groupName={group.name} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/groups/${groupId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Grupo
            </Button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Sessão em Grupo</h1>
            <p className="text-muted-foreground">Configure sua sessão no {group.name}</p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nova Sessão em Grupo
              </CardTitle>
              <CardDescription>Defina o que você vai estudar junto com o grupo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Matéria/Assunto</Label>
                <Input
                  id="subject"
                  placeholder="Ex: Matemática, História, Programação..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Meta de Tempo (minutos)</Label>
                <Input
                  id="target"
                  type="number"
                  min="5"
                  max="180"
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(Number.parseInt(e.target.value) || 25)}
                />
                <p className="text-xs text-muted-foreground">Recomendamos sessões de 25-50 minutos</p>
              </div>

              <Button onClick={handleStartSession} className="w-full" disabled={!subject.trim()}>
                Iniciar Sessão em Grupo
              </Button>
            </CardContent>
          </Card>

          <div className="mt-6">
            <GroupStudyParticipants participants={participants} groupName={group.name} />
          </div>
        </div>
      </div>
    </div>
  )
}
