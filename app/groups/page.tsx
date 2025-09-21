"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GroupCard } from "@/components/group-card"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { Search, Users, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface Group {
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

export default function GroupsPage() {
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  const fetchGroups = async () => {
    try {
      console.log("[v0] Starting fetchGroups")
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      console.log("[v0] User authenticated, fetching groups")
      // Fetch all groups without foreign key relationships
      const { data: groups, error: groupsError } = await supabase
        .from("study_groups")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      console.log("[v0] Groups query result:", { groups, groupsError })
      if (groupsError) throw groupsError

      console.log("[v0] Fetching creator profiles")
      const creatorIds = [...new Set(groups.map((g) => g.creator_id))]
      const { data: creators, error: creatorsError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", creatorIds)

      console.log("[v0] Creators query result:", { creators, creatorsError })
      if (creatorsError) throw creatorsError

      console.log("[v0] Fetching member counts")
      const groupIds = groups.map((g) => g.id)
      const { data: memberCounts, error: memberCountsError } = await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds)

      console.log("[v0] Member counts query result:", { memberCounts, memberCountsError })
      if (memberCountsError) throw memberCountsError

      const memberCountMap = memberCounts.reduce(
        (acc, member) => {
          acc[member.group_id] = (acc[member.group_id] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      console.log("[v0] Fetching user memberships")
      // Fetch user's group memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)

      console.log("[v0] Memberships query result:", { memberships, membershipsError })
      if (membershipsError) throw membershipsError

      const memberGroupIds = new Set(memberships.map((m) => m.group_id))

      const processedGroups = groups.map((group) => {
        const creator = creators.find((c) => c.id === group.creator_id)
        return {
          ...group,
          member_count: memberCountMap[group.id] || 0,
          creator_name: creator?.display_name || "Usuário",
          is_member: memberGroupIds.has(group.id),
        }
      })

      console.log("[v0] Successfully processed groups:", processedGroups.length)
      setAllGroups(processedGroups)
      setMyGroups(processedGroups.filter((g) => g.is_member))
    } catch (error) {
      console.error("[v0] Error in fetchGroups:", error)
      console.error("Erro ao carregar grupos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    setActionLoading(groupId)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: user.id,
      })

      if (error) throw error

      await fetchGroups()
    } catch (error) {
      console.error("Erro ao entrar no grupo:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    setActionLoading(groupId)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id)

      if (error) throw error

      await fetchGroups()
    } catch (error) {
      console.error("Erro ao sair do grupo:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewGroup = (groupId: string) => {
    router.push(`/groups/${groupId}`)
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const filteredAllGroups = allGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredMyGroups = myGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando grupos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Grupos de Estudo</h1>
            <p className="text-muted-foreground">Encontre ou crie grupos para estudar com outros StudyRats</p>
          </div>
          <CreateGroupDialog onGroupCreated={fetchGroups} />
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="gap-2">
              <Users className="h-4 w-4" />
              Todos os Grupos ({filteredAllGroups.length})
            </TabsTrigger>
            <TabsTrigger value="my" className="gap-2">
              <Plus className="h-4 w-4" />
              Meus Grupos ({filteredMyGroups.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {filteredAllGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Tente buscar com outros termos" : "Seja o primeiro a criar um grupo!"}
                </p>
                <CreateGroupDialog onGroupCreated={fetchGroups} />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAllGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onJoin={handleJoinGroup}
                    onLeave={handleLeaveGroup}
                    onView={handleViewGroup}
                    isLoading={actionLoading === group.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my" className="space-y-6">
            {filteredMyGroups.length === 0 ? (
              <div className="text-center py-12">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Você ainda não está em nenhum grupo</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "Nenhum dos seus grupos corresponde à busca"
                    : "Entre em um grupo existente ou crie o seu próprio!"}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setSearchTerm("")} variant="outline">
                    Ver Todos os Grupos
                  </Button>
                  <CreateGroupDialog onGroupCreated={fetchGroups} />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onLeave={handleLeaveGroup}
                    onView={handleViewGroup}
                    isLoading={actionLoading === group.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
