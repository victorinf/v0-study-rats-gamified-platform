"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, User } from "lucide-react"

interface GroupCardProps {
  group: {
    id: string
    name: string
    description: string
    creator_id: string
    max_members: number
    is_active: boolean
    created_at: string
    member_count?: number
    creator_name?: string
    is_member?: boolean
  }
  onJoin?: (groupId: string) => void
  onLeave?: (groupId: string) => void
  onView?: (groupId: string) => void
  isLoading?: boolean
}

export function GroupCard({ group, onJoin, onLeave, onView, isLoading }: GroupCardProps) {
  const memberCount = group.member_count || 0
  const isFull = memberCount >= group.max_members

  return (
    <Card className="hover:shadow-lg transition-shadow border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-balance">{group.name}</CardTitle>
            <CardDescription className="text-pretty">{group.description || "Sem descrição"}</CardDescription>
          </div>
          <Badge variant={group.is_active ? "default" : "secondary"}>{group.is_active ? "Ativo" : "Inativo"}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{group.creator_name || "Criador"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{new Date(group.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {memberCount}/{group.max_members} membros
            </span>
            {isFull && (
              <Badge variant="destructive" className="text-xs">
                Lotado
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {group.is_member ? (
            <>
              <Button onClick={() => onView?.(group.id)} className="flex-1" disabled={isLoading}>
                Ver Grupo
              </Button>
              <Button onClick={() => onLeave?.(group.id)} variant="outline" disabled={isLoading}>
                Sair
              </Button>
            </>
          ) : (
            <Button
              onClick={() => onJoin?.(group.id)}
              className="flex-1"
              disabled={isLoading || isFull || !group.is_active}
            >
              {isFull ? "Grupo Lotado" : "Entrar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
