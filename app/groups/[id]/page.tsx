"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Users, Clock, Settings, UserMinus, Crown, BookOpen } from "lucide-react"
import { useStudySession } from "@/contexts/study-session-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface GroupMember {
  id: string
  user_id: string
  joined_at: string
  is_online: boolean
  last_seen: string
  profiles: {
    username: string
    display_name: string
    level: number
    total_study_time: number
  }
}

interface GroupDetails {
  id: string
  name: string
  description: string
  creator_id: string
  max_members: number
  is_active: boolean
  created_at: string
  profiles: {
    username: string
    display_name: string
  }
}

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const { startStudySession, isStudying, groupMembersStatus, joinGroup, leaveGroup } = useStudySession()
  const [studySubject, setStudySubject] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchGroupDetails = async () => {
    try {
      console.log("[v0] Starting fetchGroupDetails for group:", groupId)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setCurrentUser(user)

      console.log("[v0] Fetching group data")
      const { data: groupData, error: groupError } = await supabase
        .from("study_groups")
        .select("*")
        .eq("id", groupId)
        .single()

      console.log("[v0] Group data query result:", { groupData, groupError })
      if (groupError) throw groupError

      console.log("[v0] Fetching creator data")
      const { data: creatorData, error: creatorError } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", groupData.creator_id)
        .single()

      console.log("[v0] Creator data query result:", { creatorData, creatorError })
      if (creatorError) throw creatorError

      const groupWithCreator = {
        ...groupData,
        profiles: creatorData,
      }

      setGroup(groupWithCreator)
      setIsCreator(groupData.creator_id === user.id)

      console.log("[v0] Fetching members data")
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true })

      console.log("[v0] Members data query result:", { membersData, membersError })
      if (membersError) throw membersError

      console.log("[v0] Fetching member profiles")
      const memberIds = membersData.map((member) => member.user_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, level, total_study_time")
        .in("id", memberIds)

      console.log("[v0] Profiles data query result:", { profilesData, profilesError })
      if (profilesError) throw profilesError

      const membersWithProfiles = membersData.map((member) => ({
        ...member,
        profiles: profilesData.find((profile) => profile.id === member.user_id) || {
          username: "unknown",
          display_name: "Unknown User",
          level: 1,
          total_study_time: 0,
        },
      }))

      console.log("[v0] Successfully processed group details")
      setMembers(membersWithProfiles)
      setIsMember(membersData.some((member) => member.user_id === user.id))
    } catch (error) {
      console.error("[v0] Error in fetchGroupDetails:", error)
      console.error("Erro ao carregar detalhes do grupo:", error)
      router.push("/groups")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!currentUser) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", currentUser.id)

      if (error) throw error
      router.push("/groups")
    } catch (error) {
      console.error("Erro ao sair do grupo:", error)
    }
  }

  const handleJoinGroup = async () => {
    if (!currentUser) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: currentUser.id,
      })

      if (error) throw error
      await fetchGroupDetails()
    } catch (error) {
      console.error("Erro ao entrar no grupo:", error)
    }
  }

  const handleStartStudy = async () => {
    if (!studySubject.trim()) return

    try {
      await startStudySession(studySubject, groupId)
      setIsDialogOpen(false)
      setStudySubject("")
    } catch (error) {
      console.error("Error starting study session:", error)
    }
  }

  useEffect(() => {
    fetchGroupDetails()
  }, [groupId])

  useEffect(() => {
    if (isMember && groupId) {
      joinGroup(groupId)
      return () => {
        leaveGroup(groupId)
      }
    }
  }, [isMember, groupId, joinGroup, leaveGroup])

  const getMemberStudyStatus = (userId: string) => {
    return groupMembersStatus.find((member) => member.userId === userId)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando grupo...</p>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.push("/groups")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Group Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl text-balance">{group.name}</CardTitle>
                    <CardDescription className="text-pretty mt-2">
                      {group.description || "Sem descrição"}
                    </CardDescription>
                  </div>
                  <Badge variant={group.is_active ? "default" : "secondary"}>
                    {group.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-accent" />
                    <span>
                      Criado por <strong>{group.profiles.display_name}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(group.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {members.length}/{group.max_members} membros
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {isMember ? (
                      <>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button disabled={isStudying}>{isStudying ? "Já Estudando" : "Estudar Agora"}</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Iniciar Sessão de Estudo</DialogTitle>
                              <DialogDescription>Qual matéria você vai estudar hoje?</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="subject">Matéria</Label>
                                <Input
                                  id="subject"
                                  placeholder="Ex: Matemática, História, Programação..."
                                  value={studySubject}
                                  onChange={(e) => setStudySubject(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && studySubject.trim()) {
                                      handleStartStudy()
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                  Cancelar
                                </Button>
                                <Button onClick={handleStartStudy} disabled={!studySubject.trim()}>
                                  Começar a Estudar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {!isCreator && (
                          <Button variant="outline" onClick={handleLeaveGroup}>
                            <UserMinus className="h-4 w-4 mr-2" />
                            Sair do Grupo
                          </Button>
                        )}
                        {isCreator && (
                          <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurações
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button onClick={handleJoinGroup} disabled={members.length >= group.max_members}>
                        {members.length >= group.max_members ? "Grupo Lotado" : "Entrar no Grupo"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Members List */}
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Membros ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map((member) => {
                  const studyStatus = getMemberStudyStatus(member.user_id)
                  const isCurrentlyStudying = studyStatus?.isStudying || false

                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {member.profiles.display_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {isCurrentlyStudying && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-background"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.profiles.display_name}</p>
                          <p className="text-xs text-muted-foreground">@{member.profiles.username}</p>
                          {isCurrentlyStudying && studyStatus && (
                            <div className="flex items-center gap-1 mt-1">
                              <BookOpen className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600 font-medium">
                                {studyStatus.subject} • {formatDuration(studyStatus.elapsedTime)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {member.user_id === group.creator_id && <Crown className="h-3 w-3 text-accent" />}
                          <Badge variant="outline" className="text-xs">
                            Nv. {member.profiles.level}
                          </Badge>
                        </div>
                        <div
                          className={`text-xs mt-1 ${
                            isCurrentlyStudying
                              ? "text-green-500 font-medium"
                              : member.is_online
                                ? "text-green-500"
                                : "text-muted-foreground"
                          }`}
                        >
                          {isCurrentlyStudying ? "Estudando Agora" : member.is_online ? "Online" : "Offline"}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
