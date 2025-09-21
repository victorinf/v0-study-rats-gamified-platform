"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Play, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

interface Group {
  id: string
  name: string
  member_count: number
  online_members: number
  is_studying: boolean
}

interface ActiveGroupsCardProps {
  groups: Group[]
}

export function ActiveGroupsCard({ groups }: ActiveGroupsCardProps) {
  const router = useRouter()

  if (groups.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Meus Grupos
          </CardTitle>
          <CardDescription>Você ainda não está em nenhum grupo</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/groups")} className="w-full">
            Encontrar Grupos
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Meus Grupos ({groups.length})
        </CardTitle>
        <CardDescription>Grupos onde você está participando</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.slice(0, 4).map((group) => (
          <div key={group.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{group.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{group.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {group.online_members}/{group.member_count} online
                  </span>
                  {group.is_studying && (
                    <Badge variant="default" className="text-xs">
                      Estudando
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => router.push(`/groups/${group.id}`)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button size="sm" onClick={() => router.push(`/groups/${group.id}/study`)}>
                <Play className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}

        {groups.length > 4 && (
          <Button variant="outline" className="w-full mt-3 bg-transparent" onClick={() => router.push("/groups")}>
            Ver Todos os Grupos
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
