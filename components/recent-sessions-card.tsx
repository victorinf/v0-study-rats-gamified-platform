"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, BookOpen, Users } from "lucide-react"

interface StudySession {
  id: string
  subject: string
  duration_minutes: number
  session_type: "real_time" | "manual"
  start_time: string
  group_name?: string
}

interface RecentSessionsCardProps {
  sessions: StudySession[]
}

export function RecentSessionsCard({ sessions }: RecentSessionsCardProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    }
  }

  if (sessions.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sessões Recentes
          </CardTitle>
          <CardDescription>Suas últimas sessões de estudo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma sessão de estudo ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Comece a estudar para ver seu histórico aqui</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Sessões Recentes
        </CardTitle>
        <CardDescription>Suas últimas sessões de estudo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{session.subject}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(session.start_time)}</span>
                  {session.group_name && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{session.group_name}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">{formatTime(session.duration_minutes || 0)}</div>
              <Badge variant={session.session_type === "real_time" ? "default" : "secondary"} className="text-xs">
                {session.session_type === "real_time" ? "Tempo Real" : "Manual"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
