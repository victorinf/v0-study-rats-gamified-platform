"use client"

import { useState } from "react"
import { useStudySession } from "@/contexts/study-session-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, BookOpen, Trophy, X, Users } from "lucide-react"

export function StudySessionPopover() {
  const { currentSession, isStudying, endStudySession, groupMembersStatus } = useStudySession()
  const [isOpen, setIsOpen] = useState(false)

  if (!isStudying || !currentSession) return null

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const handleEndSession = async () => {
    try {
      await endStudySession()
      setIsOpen(false)
    } catch (error) {
      console.error("Error ending session:", error)
    }
  }

  const studyingMembers = groupMembersStatus.filter(
    (member) => member.userId !== currentSession.user_id && member.isStudying,
  )

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button size="lg" className="rounded-full shadow-lg animate-pulse bg-green-600 hover:bg-green-700">
            <BookOpen className="h-5 w-5 mr-2" />
            Estudando...
            {studyingMembers.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                +{studyingMembers.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Sessão de Estudo</CardTitle>
                  <CardDescription>Em andamento</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Matéria:</span>
                  </div>
                  <span className="font-medium">{currentSession.subject}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Duração:</span>
                  </div>
                  <span className="font-medium">{formatDuration(currentSession.duration_minutes)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Pontos:</span>
                  </div>
                  <span className="font-medium">{Math.floor(currentSession.duration_minutes / 5)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Iniciado às:</span>
                  <span>
                    {new Date(currentSession.start_time).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {studyingMembers.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Estudando Agora ({studyingMembers.length})</span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {studyingMembers.map((member) => (
                        <div key={member.userId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">{member.displayName}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">{member.subject}</div>
                            <div className="text-xs font-medium">{formatDuration(member.elapsedTime)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2 border-t">
                <Button onClick={handleEndSession} variant="destructive" size="sm" className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Finalizar Sessão
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}
