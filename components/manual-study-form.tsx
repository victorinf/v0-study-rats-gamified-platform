"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ManualStudyFormProps {
  onSubmit: (data: ManualStudyData) => Promise<void>
  isLoading?: boolean
  groups?: Array<{ id: string; name: string }>
}

export interface ManualStudyData {
  subject: string
  duration_minutes: number
  start_time: Date
  notes?: string
  group_id?: string
}

export function ManualStudyForm({ onSubmit, isLoading, groups = [] }: ManualStudyFormProps) {
  const [formData, setFormData] = useState<ManualStudyData>({
    subject: "",
    duration_minutes: 30,
    start_time: new Date(),
    notes: "",
    group_id: undefined,
  })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.subject.trim()) {
      setError("Por favor, informe a matéria estudada")
      return
    }

    if (formData.duration_minutes < 1) {
      setError("A duração deve ser de pelo menos 1 minuto")
      return
    }

    if (formData.start_time > new Date()) {
      setError("A data não pode ser no futuro")
      return
    }

    try {
      await onSubmit(formData)
      // Reset form on success
      setFormData({
        subject: "",
        duration_minutes: 30,
        start_time: new Date(),
        notes: "",
        group_id: undefined,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao salvar sessão")
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const quickDurations = [15, 30, 45, 60, 90, 120]

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Registrar Sessão Manual
        </CardTitle>
        <CardDescription>Adicione uma sessão de estudo que você já completou</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Matéria/Assunto *</Label>
            <Input
              id="subject"
              placeholder="Ex: Matemática, História, Programação..."
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Duração *</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {quickDurations.map((duration) => (
                <Button
                  key={duration}
                  type="button"
                  variant={formData.duration_minutes === duration ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, duration_minutes: duration }))}
                >
                  {formatDuration(duration)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="600"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration_minutes: Number.parseInt(e.target.value) || 0 }))
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">minutos</span>
              <Badge variant="outline" className="ml-2">
                {formatDuration(formData.duration_minutes)}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data e Hora *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.start_time, "PPP 'às' HH:mm", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.start_time}
                  onSelect={(date) => {
                    if (date) {
                      const newDate = new Date(date)
                      newDate.setHours(formData.start_time.getHours())
                      newDate.setMinutes(formData.start_time.getMinutes())
                      setFormData((prev) => ({ ...prev, start_time: newDate }))
                    }
                  }}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
                <div className="p-3 border-t">
                  <Label className="text-sm">Horário</Label>
                  <Input
                    type="time"
                    value={format(formData.start_time, "HH:mm")}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(":").map(Number)
                      const newDate = new Date(formData.start_time)
                      newDate.setHours(hours, minutes)
                      setFormData((prev) => ({ ...prev, start_time: newDate }))
                    }}
                    className="mt-1"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {groups.length > 0 && (
            <div className="space-y-2">
              <Label>Grupo (opcional)</Label>
              <Select
                value={formData.group_id || "individual"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, group_id: value === "individual" ? undefined : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Sessão individual</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione detalhes sobre o que você estudou, dificuldades encontradas, etc."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Salvando..." : "Registrar Sessão"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
