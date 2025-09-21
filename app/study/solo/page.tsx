"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { StudyTimer } from "@/components/study-timer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, BookOpen } from "lucide-react"

export default function SoloStudyPage() {
  const router = useRouter()
  const [subject, setSubject] = useState("")
  const [targetMinutes, setTargetMinutes] = useState(25)
  const [isSessionStarted, setIsSessionStarted] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const handleStartSession = async () => {
    if (!subject.trim()) return

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: session, error } = await supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
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
        const { error: profileError } = await supabase.rpc("increment_study_time", {
          user_id: user.id,
          minutes: duration,
        })

        if (profileError) {
          // Fallback: manually update if RPC doesn't exist
          const { data: profile } = await supabase
            .from("profiles")
            .select("total_study_time")
            .eq("id", user.id)
            .single()

          if (profile) {
            await supabase
              .from("profiles")
              .update({
                total_study_time: profile.total_study_time + duration,
                experience_points: profile.total_study_time + duration, // Simple XP system
              })
              .eq("id", user.id)
          }
        }
      }

      // Show completion message and redirect
      alert(`Parabéns! Você estudou ${subject} por ${duration} minutos!`)
      router.push("/dashboard")
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

  if (isSessionStarted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">Sessão Solo</h1>
              <p className="text-muted-foreground">Foque nos seus estudos</p>
            </div>

            <StudyTimer
              subject={subject}
              targetMinutes={targetMinutes}
              onSessionComplete={handleSessionComplete}
              onSessionUpdate={handleSessionUpdate}
            />

            <div className="mt-8 text-center">
              <Card className="border-2 bg-muted/20">
                <CardContent className="pt-6">
                  <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Mantenha o foco! Você está estudando sozinho, mas não está sozinho na jornada.
                  </p>
                </CardContent>
              </Card>
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
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Sessão Solo</h1>
            <p className="text-muted-foreground">Configure sua sessão de estudos</p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Nova Sessão</CardTitle>
              <CardDescription>Defina o que você vai estudar e por quanto tempo</CardDescription>
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
                Iniciar Sessão
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
