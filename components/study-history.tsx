"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Clock, BookOpen, Users, Calendar, Trash2, Edit } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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

interface StudyHistoryProps {
  sessions: StudySession[]
  onEdit?: (session: StudySession) => void
  onDelete?: (sessionId: string) => void
  isLoading?: boolean
}

export function StudyHistory({ sessions, onEdit, onDelete, isLoading }: StudyHistoryProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  const groupSessionsByDate = (sessions: StudySession[]) => {
    const groups: { [key: string]: StudySession[] } = {}

    sessions.forEach((session) => {
      const date = format(new Date(session.start_time), "yyyy-MM-dd")
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(session)
    })

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }

  if (sessions.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Estudos
          </CardTitle>
          <CardDescription>Suas sessões de estudo registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma sessão registrada</h3>
            <p className="text-muted-foreground">
              Comece a estudar ou registre sessões manuais para ver seu histórico aqui
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const groupedSessions = groupSessionsByDate(sessions)

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Estudos
        </CardTitle>
        <CardDescription>
          {sessions.length} sessão{sessions.length !== 1 ? "ões" : ""} registrada{sessions.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {groupedSessions.map(([date, dateSessions]) => (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">{format(new Date(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}</h4>
              <Badge variant="outline" className="text-xs">
                {dateSessions.length} sessão{dateSessions.length !== 1 ? "ões" : ""}
              </Badge>
            </div>

            <div className="space-y-2 ml-6">
              {dateSessions.map((session, index) => (
                <div key={session.id}>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{session.subject}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
                        {session.notes && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">{session.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-medium text-sm">{formatDuration(session.duration_minutes)}</div>
                        <Badge
                          variant={session.session_type === "real_time" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {session.session_type === "real_time" ? "Tempo Real" : "Manual"}
                        </Badge>
                      </div>

                      {session.session_type === "manual" && (
                        <div className="flex gap-1">
                          {onEdit && (
                            <Button size="sm" variant="ghost" onClick={() => onEdit(session)} disabled={isLoading}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button size="sm" variant="ghost" onClick={() => onDelete(session.id)} disabled={isLoading}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < dateSessions.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
