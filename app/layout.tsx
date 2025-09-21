import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { StudySessionProvider } from "@/contexts/study-session-context"
import { GlobalHeader } from "@/components/global-header"
import { StudySessionPopover } from "@/components/study-session-popover"
import "./globals.css"

export const metadata: Metadata = {
  title: "StudyRats - Plataforma Gamificada de Estudos",
  description: "Estude em tempo real com seus amigos e conquiste suas metas acadêmicas",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <StudySessionProvider>
          <GlobalHeader />
          <Suspense fallback={null}>{children}</Suspense>
          <StudySessionPopover />
        </StudySessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
