"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { socketManager, type StudySessionData } from "@/lib/socket"
import type { Socket } from "socket.io-client"

interface StudySession {
  id: string
  user_id: string
  group_id?: string
  subject: string
  start_time: string
  end_time?: string
  duration_minutes: number
  is_active: boolean
  session_type: string
}

interface GroupMemberStatus {
  userId: string
  username: string
  displayName: string
  isStudying: boolean
  studyStartTime?: string
  elapsedTime: number
  subject?: string
}

interface StudySessionContextType {
  currentSession: StudySession | null
  isStudying: boolean
  groupMembersStatus: GroupMemberStatus[]
  startStudySession: (subject: string, groupId?: string) => Promise<void>
  endStudySession: () => Promise<void>
  updateSessionDuration: () => void
  joinGroup: (groupId: string) => void
  leaveGroup: (groupId: string) => void
}

const StudySessionContext = createContext<StudySessionContextType | undefined>(undefined)

export function StudySessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null)
  const [isStudying, setIsStudying] = useState(false)
  const [groupMembersStatus, setGroupMembersStatus] = useState<GroupMemberStatus[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const socketInstance = socketManager.connect()
    setSocket(socketInstance)

    socketInstance.on("user_started_studying", (data: StudySessionData) => {
      console.log("[v0] User started studying:", data)
      setGroupMembersStatus((prev) => {
        const existing = prev.find((member) => member.userId === data.userId)
        if (existing) {
          return prev.map((member) =>
            member.userId === data.userId
              ? { ...member, isStudying: true, studyStartTime: data.startTime, subject: data.subject, elapsedTime: 0 }
              : member,
          )
        } else {
          return [
            ...prev,
            {
              userId: data.userId,
              username: data.username,
              displayName: data.displayName,
              isStudying: true,
              studyStartTime: data.startTime,
              subject: data.subject,
              elapsedTime: 0,
            },
          ]
        }
      })
    })

    socketInstance.on("user_stopped_studying", (data) => {
      console.log("[v0] User stopped studying:", data)
      setGroupMembersStatus((prev) =>
        prev.map((member) =>
          member.userId === data.userId
            ? { ...member, isStudying: false, studyStartTime: undefined, subject: undefined, elapsedTime: 0 }
            : member,
        ),
      )
    })

    socketInstance.on("study_timer_update", (data) => {
      setGroupMembersStatus((prev) =>
        prev.map((member) => (member.userId === data.userId ? { ...member, elapsedTime: data.elapsedTime } : member)),
      )
    })

    return () => {
      socketManager.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isStudying || !currentSession || !socket) return

    const interval = setInterval(() => {
      updateSessionDuration()

      if (currentSession.group_id) {
        const startTime = new Date(currentSession.start_time)
        const elapsedMinutes = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60)

        socket.emit("study_timer_update", {
          userId: currentSession.user_id,
          groupId: currentSession.group_id,
          elapsedTime: elapsedMinutes,
        })
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [isStudying, currentSession, socket])

  // Check for active session on mount
  useEffect(() => {
    checkActiveSession()
  }, [])

  const checkActiveSession = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: activeSession } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (activeSession) {
        setCurrentSession(activeSession)
        setIsStudying(true)
      }
    } catch (error) {
      console.error("Error checking active session:", error)
    }
  }

  const startStudySession = async (subject: string, groupId?: string) => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not authenticated")

      const { data: existingSession } = await supabase
        .from("study_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (existingSession) {
        throw new Error("Você já tem uma sessão de estudo ativa. Finalize-a antes de iniciar uma nova.")
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .single()

      // Create new session
      const { data: newSession, error } = await supabase
        .from("study_sessions")
        .insert({
          user_id: user.id,
          group_id: groupId,
          subject,
          start_time: new Date().toISOString(),
          duration_minutes: 0,
          is_active: true,
          session_type: "real_time",
        })
        .select()
        .single()

      if (error) throw error

      setCurrentSession(newSession)
      setIsStudying(true)

      if (groupId && socket && profile) {
        socket.emit("start_study_session", {
          userId: user.id,
          groupId,
          username: profile.username,
          displayName: profile.display_name,
          startTime: new Date().toISOString(),
          elapsedTime: 0,
          subject,
        })
      }
    } catch (error) {
      console.error("Error starting study session:", error)
      throw error
    }
  }

  const endStudySession = async () => {
    if (!currentSession) return

    try {
      const supabase = createClient()
      const endTime = new Date().toISOString()
      const startTime = new Date(currentSession.start_time)
      const durationMinutes = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60)

      const { error } = await supabase
        .from("study_sessions")
        .update({
          end_time: endTime,
          duration_minutes: durationMinutes,
          is_active: false,
        })
        .eq("id", currentSession.id)

      if (error) throw error

      // Update user's total study time and streak
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("total_study_time").eq("id", user.id).single()

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              total_study_time: (profile.total_study_time || 0) + durationMinutes,
            })
            .eq("id", user.id)
        }

        await supabase.rpc("update_user_streak", { user_id: user.id })
      }

      if (currentSession.group_id && socket) {
        socket.emit("end_study_session", {
          userId: currentSession.user_id,
          groupId: currentSession.group_id,
          totalTime: durationMinutes,
          subject: currentSession.subject,
        })
      }

      setCurrentSession(null)
      setIsStudying(false)
    } catch (error) {
      console.error("Error ending study session:", error)
      throw error
    }
  }

  const updateSessionDuration = () => {
    if (!currentSession) return

    const startTime = new Date(currentSession.start_time)
    const durationMinutes = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60) // minutes

    setCurrentSession((prev) => (prev ? { ...prev, duration_minutes: durationMinutes } : null)) // Changed from duration to duration_minutes
  }

  const joinGroup = (groupId: string) => {
    if (socket) {
      socket.emit("join_group", groupId)
    }
  }

  const leaveGroup = (groupId: string) => {
    if (socket) {
      socket.emit("leave_group", groupId)
    }
  }

  return (
    <StudySessionContext.Provider
      value={{
        currentSession,
        isStudying,
        groupMembersStatus, // Add group members status
        startStudySession,
        endStudySession,
        updateSessionDuration,
        joinGroup, // Add group management
        leaveGroup, // Add group management
      }}
    >
      {children}
    </StudySessionContext.Provider>
  )
}

export function useStudySession() {
  const context = useContext(StudySessionContext)
  if (context === undefined) {
    throw new Error("useStudySession must be used within a StudySessionProvider")
  }
  return context
}
