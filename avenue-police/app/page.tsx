"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "../contexts/AuthContext"
import LoginForm from "../components/LoginForm"
import Dashboard from "../components/Dashboard"
import CalculadoraPenal from "../calculadora-penal"
import RelatoriosAvancados from "../components/RelatoriosAvancados"
import PainelAdmin from "../components/PainelAdmin"
import PerfilUsuario from "../components/PerfilUsuario"

function AppContent() {
  const { isAuthenticated, usuario } = useAuth()
  const [currentView, setCurrentView] = useState<"dashboard" | "calculator" | "reports" | "admin" | "profile">(
    "dashboard",
  )

  // Aplicar tema especial para Colth em TODAS as páginas
  useEffect(() => {
    if (isAuthenticated && usuario?.nome === "Colth" && usuario?.passaporte === "2") {
      // Aplicar fundo do Stitch
      document.body.style.backgroundImage = "url('/stitch-background.png')"
      document.body.style.backgroundSize = "cover"
      document.body.style.backgroundPosition = "center"
      document.body.style.backgroundAttachment = "fixed"
      document.body.style.backgroundRepeat = "no-repeat"

      return () => {
        // Limpar tema ao sair
        document.body.style.backgroundImage = ""
        document.body.style.backgroundSize = ""
        document.body.style.backgroundPosition = ""
        document.body.style.backgroundAttachment = ""
        document.body.style.backgroundRepeat = ""
      }
    } else if (isAuthenticated) {
      // Para outros usuários, garantir que o fundo seja preto
      document.body.style.backgroundColor = "black"
      document.body.style.backgroundImage = ""
    }
  }, [isAuthenticated, usuario])

  if (!isAuthenticated) {
    return <LoginForm />
  }

  const canAccessCalculator = () => {
    return usuario?.tipo === "policial" || usuario?.tipo === "comando" || usuario?.tipo === "dev"
  }

  const canAccessAdmin = () => {
    return usuario?.tipo === "comando" || usuario?.tipo === "advogado" || usuario?.tipo === "dev"
  }

  const canAccessDev = () => {
    return usuario?.tipo === "dev"
  }

  // Verificar se é o perfil especial da Colth
  const isColthProfile = usuario?.nome === "Colth" && usuario?.passaporte === "2"

  // Wrapper com overlay para Colth
  const PageWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isColthProfile) {
      return (
        <div className="relative min-h-screen">
          <div className="fixed inset-0 bg-black bg-opacity-30 pointer-events-none z-0"></div>
          <div className="relative z-10">{children}</div>
        </div>
      )
    }
    return <>{children}</>
  }

  // Renderização condicional baseada na view atual
  if (currentView === "calculator" && canAccessCalculator()) {
    return (
      <PageWrapper>
        <CalculadoraPenal onVoltar={() => setCurrentView("dashboard")} />
      </PageWrapper>
    )
  }

  if (currentView === "reports" && canAccessAdmin()) {
    return (
      <PageWrapper>
        <RelatoriosAvancados onVoltar={() => setCurrentView("dashboard")} />
      </PageWrapper>
    )
  }

  if (currentView === "admin" && canAccessDev()) {
    return (
      <PageWrapper>
        <PainelAdmin onVoltar={() => setCurrentView("dashboard")} />
      </PageWrapper>
    )
  }

  if (currentView === "profile") {
    return (
      <PageWrapper>
        <PerfilUsuario onVoltar={() => setCurrentView("dashboard")} />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Dashboard onNavigate={setCurrentView} />
    </PageWrapper>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
