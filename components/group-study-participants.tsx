"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Clock } from "lucide-react"

interface Participant {
  id: string
  display_name: string
  username: string
  is_studying: boolean
  study_time: number
  subject?: string
}

interface GroupStudyParticipantsProps {
  participants: Participant[]
  groupName: string
}

export function GroupStudyParticipants({ participants, groupName }: GroupStudyParticipantsProps) {
  const activeParticipants = participants.filter((p) => p.is_studying)
  const inactiveParticipants = participants.filter((p) => !p.is_studying)

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {groupName}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{activeParticipants.length} estudando agora</span>
          <span>{participants.length} membros online</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeParticipants.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-green-600">Estudando Agora</h4>
            {activeParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-green-100 dark:bg-green-900">
                      {participant.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{participant.display_name}</p>
                    <p className="text-xs text-muted-foreground">{participant.subject || "Estudando"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(participant.study_time)}</span>
                  </div>
                  <Badge variant="default" className="text-xs bg-green-600">
                    Ativo
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {inactiveParticipants.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Online</h4>
            {inactiveParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {participant.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{participant.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{participant.username}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Online
                </Badge>
              </div>
            ))}
          </div>
        )}

        {participants.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum membro online</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
