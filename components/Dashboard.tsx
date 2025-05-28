"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LogOut,
  Calculator,
  BarChart3,
  Trophy,
  DollarSign,
  Users,
  FileText,
  Settings,
  Crown,
  Shield,
  Scale,
  User,
  RefreshCw,
  WifiOff,
  Database,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { db } from "../lib/database"
import type { Prisao, Usuario } from "../types/auth"
import Image from "next/image"

interface DashboardProps {
  onNavigate: (view: "dashboard" | "calculator" | "reports" | "admin" | "profile") => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { usuario, logout, syncStatus, isConnected } = useAuth()
  const [prisoes, setPrisoes] = useState<Prisao[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [stats, setStats] = useState({
    totalPrisoes: 0,
    totalArrecadado: 0,
    totalMesesPrisao: 0,
    prisoesHoje: 0,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadAllData()
    setupRealtimeListeners()
  }, [])

  const setupRealtimeListeners = () => {
    // Escutar mudanças em tempo real
    const handleUsuarioChange = () => {
      console.log("🔄 Dashboard: Recarregando usuários...")
      loadUsuarios()
    }

    const handlePrisaoChange = () => {
      console.log("🔄 Dashboard: Recarregando prisões...")
      loadPrisoes()
    }

    window.addEventListener("avenue_usuarios_changed", handleUsuarioChange)
    window.addEventListener("avenue_prisoes_changed", handlePrisaoChange)

    return () => {
      window.removeEventListener("avenue_usuarios_changed", handleUsuarioChange)
      window.removeEventListener("avenue_prisoes_changed", handlePrisaoChange)
    }
  }

  const loadAllData = async () => {
    try {
      console.log("📊 Dashboard: Carregando todos os dados...")
      setIsRefreshing(true)
      await Promise.all([loadUsuarios(), loadPrisoes()])
      setLastUpdate(new Date())
      console.log("✅ Dashboard: Dados carregados com sucesso")
    } catch (error) {
      console.error("❌ Dashboard: Erro ao carregar dados:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const loadUsuarios = async () => {
    try {
      const usuariosData = await db.getUsuarios()
      setUsuarios(usuariosData)
      console.log(`✅ Dashboard: ${usuariosData.length} usuários carregados`)
    } catch (error) {
      console.error("❌ Dashboard: Erro ao carregar usuários:", error)
    }
  }

  const loadPrisoes = async () => {
    try {
      const prisoesData = await db.getPrisoes()
      setPrisoes(prisoesData)
      calculateStats(prisoesData)
      console.log(`✅ Dashboard: ${prisoesData.length} prisões carregadas`)
    } catch (error) {
      console.error("❌ Dashboard: Erro ao carregar prisões:", error)
    }
  }

  const calculateStats = (prisoesData: Prisao[]) => {
    const hoje = new Date().toDateString()
    const prisoesHoje = prisoesData.filter((p: Prisao) => {
      try {
        return new Date(p.dataHora).toDateString() === hoje
      } catch {
        return false
      }
    }).length

    const totalArrecadado = prisoesData.reduce((acc: number, p: Prisao) => acc + (p.totais?.multaFinal || 0), 0)
    const totalMesesPrisao = prisoesData.reduce((acc: number, p: Prisao) => acc + (p.totais?.prisaoFinal || 0), 0)

    setStats({
      totalPrisoes: prisoesData.length,
      totalArrecadado,
      totalMesesPrisao,
      prisoesHoje,
    })

    console.log("📊 Stats calculadas:", {
      totalPrisoes: prisoesData.length,
      totalArrecadado,
      totalMesesPrisao,
      prisoesHoje,
    })
  }

  const handleRefresh = async () => {
    console.log("🔄 Dashboard: Refresh manual iniciado")
    await loadAllData()
  }

  // Officer ranking
  const getRankingOficiais = () => {
    const contadores: { [key: string]: { nome: string; prisoes: number; arrecadado: number } } = {}

    prisoes.forEach((prisao) => {
      const key = prisao.policial.passaporte
      if (!contadores[key]) {
        contadores[key] = {
          nome: prisao.policial.nome,
          prisoes: 0,
          arrecadado: 0,
        }
      }
      contadores[key].prisoes++
      contadores[key].arrecadado += prisao.totais?.multaFinal || 0
    })

    const ranking = Object.values(contadores)
      .sort((a, b) => b.prisoes - a.prisoes)
      .slice(0, 10)

    console.log("🏆 Ranking oficiais:", ranking)
    return ranking
  }

  // Lawyer ranking
  const getRankingAdvogados = () => {
    const contadores: { [key: string]: { nome: string; casos: number; reducoes: number } } = {}

    prisoes.forEach((prisao) => {
      if (prisao.advogado) {
        const key = prisao.advogado.passaporte
        if (!contadores[key]) {
          contadores[key] = {
            nome: prisao.advogado.nome,
            casos: 0,
            reducoes: 0,
          }
        }
        contadores[key].casos++
        if (prisao.reducoes?.advogado) {
          contadores[key].reducoes++
        }
      }
    })

    const ranking = Object.values(contadores)
      .sort((a, b) => b.casos - a.casos)
      .slice(0, 10)

    console.log("⚖️ Ranking advogados:", ranking)
    return ranking
  }

  // Get officer data
  const obterDadosOficial = (passaporte: string) => {
    return usuarios.find((u: any) => u.passaporte === passaporte)
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "policial":
        return <Shield className="h-4 w-4" />
      case "comando":
        return <Crown className="h-4 w-4" />
      case "advogado":
        return <Scale className="h-4 w-4" />
      case "dev":
        return <Settings className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getTipoBadge = (tipo: string) => {
    const colors = {
      policial: "bg-blue-900 text-blue-100",
      comando: "bg-purple-900 text-purple-100",
      advogado: "bg-green-900 text-green-100",
      dev: "bg-orange-900 text-orange-100",
    }
    return colors[tipo as keyof typeof colors] || "bg-gray-900 text-gray-100"
  }

  const getSyncIcon = () => {
    if (!isConnected) {
      return <WifiOff className="h-4 w-4 text-red-400" />
    }

    switch (syncStatus) {
      case "online":
        return <Database className="h-4 w-4 text-green-400" />
      case "syncing":
        return <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-400" />
    }
  }

  const getSyncStatus = () => {
    if (!isConnected) return "❌ Sem conexão com banco"

    switch (syncStatus) {
      case "online":
        return "🗄️ Conectado ao Supabase"
      case "syncing":
        return "🔄 Sincronizando..."
      case "offline":
        return "❌ Offline"
    }
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

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/LOGOPMA.png" alt="LOGOPMA" width={60} height={30} className="object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard - Avenue City</h1>
              <p className="text-[#26C6DA]">Sistema de Gestão Penal</p>
              <div className="flex items-center gap-2 mt-1">
                {getSyncIcon()}
                <span className="text-xs text-gray-400">{getSyncStatus()}</span>
                <span className="text-xs text-gray-500">• Última atualização: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black border-[#26C6DA]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Atualizando..." : "Atualizar"}
            </Button>
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors"
              onClick={() => onNavigate("profile")}
            >
              <div className="w-10 h-10 rounded-full bg-[#26C6DA] flex items-center justify-center overflow-hidden">
                {usuario?.fotoPerfil ? (
                  <img
                    src={usuario.fotoPerfil || "/placeholder.svg"}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-black" />
                )}
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{usuario?.nome}</p>
                <Badge className={getTipoBadge(usuario?.tipo || "")}>
                  {getTipoIcon(usuario?.tipo || "")}
                  <span className="ml-1 capitalize">{usuario?.tipo}</span>
                </Badge>
              </div>
            </div>
            <Button onClick={logout} className="bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black border-[#26C6DA]">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Connection Status Banner */}
        {(!isConnected || syncStatus !== "online") && (
          <div
            className={`p-3 rounded-lg border ${
              !isConnected
                ? "bg-red-900/30 border-red-700 text-red-100"
                : syncStatus === "syncing"
                  ? "bg-yellow-900/30 border-yellow-700 text-yellow-100"
                  : "bg-red-900/30 border-red-700 text-red-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {!isConnected && "Sem conexão com o banco de dados Supabase"}
                {isConnected && syncStatus === "syncing" && "Sincronizando dados com o banco..."}
                {isConnected && syncStatus === "offline" && "Offline - dados podem não estar atualizados"}
              </span>
            </div>
          </div>
        )}

        {/* General Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total de Prisões</CardTitle>
              <FileText className="h-4 w-4 text-[#26C6DA]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalPrisoes}</div>
              <p className="text-xs text-gray-400">Prisões hoje: {stats.prisoesHoje}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Arrecadado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">${stats.totalArrecadado.toLocaleString()}</div>
              <p className="text-xs text-gray-400">Em multas aplicadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Meses de Prisão</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{stats.totalMesesPrisao}</div>
              <p className="text-xs text-gray-400">Total aplicado</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{usuarios.filter((u) => u.ativo).length}</div>
              <p className="text-xs text-gray-400">Oficiais registrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          {canAccessCalculator() && (
            <Card
              className="bg-gray-900 border-gray-700 hover:border-[#26C6DA] transition-colors cursor-pointer"
              onClick={() => onNavigate("calculator")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calculator className="h-5 w-5 text-[#26C6DA]" />
                  Calculadora Penal
                </CardTitle>
                <CardDescription className="text-gray-400">Calcular penalidades e gerar relatórios</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black w-full">Acessar Calculadora</Button>
              </CardContent>
            </Card>
          )}

          {canAccessAdmin() && (
            <Card
              className="bg-gray-900 border-gray-700 hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => onNavigate("reports")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Relatórios Avançados
                </CardTitle>
                <CardDescription className="text-gray-400">Análises detalhadas e estatísticas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Ver Relatórios</Button>
              </CardContent>
            </Card>
          )}

          {canAccessDev() && (
            <Card
              className="bg-gray-900 border-gray-700 hover:border-orange-500 transition-colors cursor-pointer"
              onClick={() => onNavigate("admin")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5 text-orange-400" />
                  Painel Admin
                </CardTitle>
                <CardDescription className="text-gray-400">Gerenciar artigos e configurações</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">Administrar</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rankings */}
        <Tabs defaultValue="oficiais" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger
              value="oficiais"
              className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-white text-[#26C6DA]"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Ranking Oficiais
            </TabsTrigger>
            <TabsTrigger
              value="advogados"
              className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-white text-[#26C6DA]"
            >
              <Scale className="h-4 w-4 mr-2" />
              Ranking Advogados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="oficiais">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">🏆 Top 10 Oficiais</CardTitle>
                <CardDescription className="text-[#26C6DA]">
                  Ranking global por número de prisões realizadas (Banco Supabase)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getRankingOficiais().length > 0 ? (
                    getRankingOficiais().map((oficial, index) => {
                      const dadosOficial = obterDadosOficial(
                        prisoes.find((p) => p.policial.nome === oficial.nome)?.policial.passaporte || "",
                      )
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                index === 0
                                  ? "bg-yellow-600 text-yellow-100"
                                  : index === 1
                                    ? "bg-gray-400 text-gray-900"
                                    : index === 2
                                      ? "bg-orange-600 text-orange-100"
                                      : "bg-gray-700 text-gray-300"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#26C6DA] flex items-center justify-center overflow-hidden">
                              {dadosOficial?.fotoPerfil ? (
                                <img
                                  src={dadosOficial.fotoPerfil || "/placeholder.svg"}
                                  alt="Foto do oficial"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Shield className="h-5 w-5 text-black" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">{oficial.nome}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-400">{oficial.prisoes} prisões</p>
                                {dadosOficial?.patente && (
                                  <span className="text-xs bg-blue-900 text-blue-100 px-2 py-1 rounded">
                                    {dadosOficial.patente}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-400">${oficial.arrecadado.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">arrecadado</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma prisão registrada ainda</p>
                      <p className="text-sm">Use a calculadora para registrar a primeira prisão</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advogados">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">⚖️ Top 10 Advogados</CardTitle>
                <CardDescription className="text-[#26C6DA]">
                  Ranking global por participação em casos (Banco Supabase)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getRankingAdvogados().length > 0 ? (
                    getRankingAdvogados().map((advogado, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? "bg-yellow-600 text-yellow-100"
                                : index === 1
                                  ? "bg-gray-400 text-gray-900"
                                  : index === 2
                                    ? "bg-orange-600 text-orange-100"
                                    : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-[#26C6DA] flex items-center justify-center">
                            <Scale className="h-5 w-5 text-black" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{advogado.nome}</p>
                            <p className="text-sm text-gray-400">{advogado.casos} casos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[#26C6DA]">{advogado.reducoes}</p>
                          <p className="text-xs text-gray-400">reduções</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum advogado registrado ainda</p>
                      <p className="text-sm">Advogados aparecerão quando participarem de casos</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
