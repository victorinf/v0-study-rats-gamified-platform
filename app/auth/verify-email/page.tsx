import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">StudyRats</h1>
        </div>

        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-accent">Verifique seu email!</CardTitle>
            <CardDescription>Quase lá! Confirme sua conta</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-accent/10 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta e começar a
                estudar!
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Não recebeu o email? Verifique sua caixa de spam.</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/auth/login">Voltar para o login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
