"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Plus, Users, BookOpen, Target } from "lucide-react"
import { useRouter } from "next/navigation"

export function QuickActionsCard() {
  const router = useRouter()

  const actions = [
    {
      title: "Iniciar Sessão Solo",
      description: "Comece a estudar sozinho",
      icon: Play,
      action: () => router.push("/study/solo"),
      variant: "default" as const,
    },
    {
      title: "Registrar Estudo Manual",
      description: "Adicione uma sessão já concluída",
      icon: Plus,
      action: () => router.push("/study/manual"),
      variant: "outline" as const,
    },
    {
      title: "Encontrar Grupos",
      description: "Junte-se a grupos de estudo",
      icon: Users,
      action: () => router.push("/groups"),
      variant: "outline" as const,
    },
    {
      title: "Ver Conquistas",
      description: "Acompanhe seu progresso",
      icon: Target,
      action: () => router.push("/achievements"),
      variant: "outline" as const,
    },
  ]

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
        <CardDescription>O que você gostaria de fazer agora?</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="h-auto p-4 flex flex-col items-start gap-2"
            onClick={action.action}
          >
            <div className="flex items-center gap-2 w-full">
              <action.icon className="h-4 w-4" />
              <span className="font-medium text-sm">{action.title}</span>
            </div>
            <span className="text-xs text-left opacity-80">{action.description}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
