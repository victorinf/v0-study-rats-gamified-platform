import { io, type Socket } from "socket.io-client"

interface StudySessionData {
  userId: string
  groupId: string
  username: string
  displayName: string
  startTime: string
  elapsedTime: number
  subject: string
}

interface ServerToClientEvents {
  user_started_studying: (data: StudySessionData) => void
  user_stopped_studying: (data: { userId: string; groupId: string; totalTime: number }) => void
  study_timer_update: (data: { userId: string; groupId: string; elapsedTime: number }) => void
  group_members_update: (data: { groupId: string; members: any[] }) => void
}

interface ClientToServerEvents {
  start_study_session: (data: StudySessionData) => void
  end_study_session: (data: { userId: string; groupId: string; totalTime: number; subject: string }) => void
  join_group: (groupId: string) => void
  leave_group: (groupId: string) => void
}

class SocketManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(process.env.NODE_ENV === "production" ? "" : "http://localhost:3001", {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.socket.on("connect", () => {
      console.log("[v0] Socket connected:", this.socket?.id)
      this.reconnectAttempts = 0
    })

    this.socket.on("disconnect", (reason) => {
      console.log("[v0] Socket disconnected:", reason)
    })

    this.socket.on("connect_error", (error) => {
      console.log("[v0] Socket connection error:", error)
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log("[v0] Max reconnection attempts reached")
        this.socket?.disconnect()
      }
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket
  }
}

export const socketManager = new SocketManager()
export type { StudySessionData, ServerToClientEvents, ClientToServerEvents }
