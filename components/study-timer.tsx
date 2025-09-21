"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, Clock, Target } from "lucide-react"

interface StudyTimerProps {
  onSessionComplete?: (duration: number) => void
  onSessionUpdate?: (duration: number, isActive: boolean) => void
  targetMinutes?: number
  subject: string
}

export function StudyTimer({ onSessionComplete, onSessionUpdate, targetMinutes = 25, subject }: StudyTimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const minutes = Math.floor(seconds / 60)
  const displaySeconds = seconds % 60
  const progress = targetMinutes > 0 ? (minutes / targetMinutes) * 100 : 0

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startTimer = () => {
    setIsActive(true)
    setIsPaused(false)
  }

  const pauseTimer = () => {
    setIsPaused(true)
  }

  const resumeTimer = () => {
    setIsPaused(false)
  }

  const stopTimer = () => {
    setIsActive(false)
    setIsPaused(false)
    if (seconds > 0) {
      onSessionComplete?.(Math.floor(seconds / 60))
    }
    setSeconds(0)
  }

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1
          onSessionUpdate?.(Math.floor(newSeconds / 60), true)
          return newSeconds
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, isPaused, onSessionUpdate])

  useEffect(() => {
    onSessionUpdate?.(Math.floor(seconds / 60), isActive && !isPaused)
  }, [isActive, isPaused])

  return (
    <Card className="border-2">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5" />
          {subject}
        </CardTitle>
        {targetMinutes > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" />
            Meta: {targetMinutes} minutos
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-primary mb-2">{formatTime(seconds)}</div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant={isActive ? (isPaused ? "secondary" : "default") : "outline"}>
              {isActive ? (isPaused ? "Pausado" : "Estudando") : "Parado"}
            </Badge>
            {minutes > 0 && (
              <Badge variant="outline">
                {minutes} min{minutes !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {targetMinutes > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{Math.min(Math.round(progress), 100)}%</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>
        )}

        <div className="flex gap-2 justify-center">
          {!isActive ? (
            <Button onClick={startTimer} className="gap-2">
              <Play className="h-4 w-4" />
              Iniciar
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button onClick={resumeTimer} className="gap-2">
                  <Play className="h-4 w-4" />
                  Continuar
                </Button>
              ) : (
                <Button onClick={pauseTimer} variant="outline" className="gap-2 bg-transparent">
                  <Pause className="h-4 w-4" />
                  Pausar
                </Button>
              )}
              <Button onClick={stopTimer} variant="destructive" className="gap-2">
                <Square className="h-4 w-4" />
                Finalizar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
