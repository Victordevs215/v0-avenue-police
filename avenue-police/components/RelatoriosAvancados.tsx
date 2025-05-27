"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, TrendingUp, Users, DollarSign, FileText, User, Eye, X, Search, RefreshCw } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { db } from "../lib/database"
import type { Prisao, Usuario } from "../types/auth"
import Image from "next/image"

interface RelatoriosAvancadosProps {
  onVoltar: () => void
}

export default function RelatoriosAvancados({ onVoltar }: RelatoriosAvancadosProps) {
  const { usuario, syncStatus } = useAuth()
  const [prisoes, setPrisoes] = useState<Prisao[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filtroMes, setFiltroMes] = useState<string>("todos")
  const [filtroOficial, setFiltroOficial] = useState<string>("todos")
  const [prisaoSelecionada, setPrisaoSelecionada] = useState<Prisao | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadData()
    setupRealtimeListeners()
  }, [])

  const setupRealtimeListeners = () => {
    const handlePrisaoChange = () => {
      console.log("🔄 Relatórios: Recarregando dados...")
      loadData()
    }

    const handleUsuarioChange = () => {
      console.log("🔄 Relatórios: Recarregando usuários...")
      loadUsuarios()
    }

    window.addEventListener("avenue_prisoes_changed", handlePrisaoChange)
    window.addEventListener("avenue_usuarios_changed", handleUsuarioChange)

    return () => {
      window.removeEventListener("avenue_prisoes_changed", handlePrisaoChange)
      window.removeEventListener("avenue_usuarios_changed", handleUsuarioChange)
    }
  }

  const loadData = async () => {
    try {
      console.log("📊 Relatórios: Carregando dados...")
      setIsLoading(true)
      await Promise.all([loadPrisoes(), loadUsuarios()])
      setLastUpdate(new Date())
      console.log("✅ Relatórios: Dados carregados")
    } catch (error) {
      console.error("❌ Relatórios: Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPrisoes = async () => {
    try {
      const prisoesData = await db.getPrisoes()
      setPrisoes(prisoesData)
      console.log(`✅ Relatórios: ${prisoesData.length} prisões carregadas`)
    } catch (error) {
      console.error("❌ Relatórios: Erro ao carregar prisões:", error)
    }
  }

  const loadUsuarios = async () => {
    try {
      const usuariosData = await db.getUsuarios()
      setUsuarios(usuariosData)
      console.log(`✅ Relatórios: ${usuariosData.length} usuários carregados`)
    } catch (error) {
      console.error("❌ Relatórios: Erro ao carregar usuários:", error)
    }
  }

  // Função para formatar data corretamente
  const formatarData = (dataString: string) => {
    try {
      // Tentar diferentes formatos de data
      let data: Date

      if (dataString.includes("/")) {
        // Formato brasileiro: DD/MM/YYYY HH:mm:ss
        const [datePart, timePart] = dataString.split(" ")
        const [day, month, year] = datePart.split("/")
        const timeString = timePart || "00:00:00"
        data = new Date(`${year}-${month}-${day}T${timeString}`)
      } else {
        // Formato ISO ou outros
        data = new Date(dataString)
      }

      if (isNaN(data.getTime())) {
        console.error("Data inválida:", dataString)
        return "Data inválida"
      }

      return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Erro ao formatar data:", dataString, error)
      return "Data inválida"
    }
  }

  // Filtrar prisões baseado nos filtros selecionados
  const prisoesFiltradas = prisoes.filter((prisao) => {
    try {
      const dataPrisao = new Date(prisao.dataHora)
      const mesAtual = new Date().getMonth()
      const anoAtual = new Date().getFullYear()

      let passaFiltroMes = true
      if (filtroMes === "atual") {
        passaFiltroMes = dataPrisao.getMonth() === mesAtual && dataPrisao.getFullYear() === anoAtual
      } else if (filtroMes === "anterior") {
        const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1
        const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual
        passaFiltroMes = dataPrisao.getMonth() === mesAnterior && dataPrisao.getFullYear() === anoAnterior
      }

      let passaFiltroOficial = true
      if (filtroOficial !== "todos") {
        passaFiltroOficial = prisao.policial.passaporte === filtroOficial
      }

      let passaFiltroSearch = true
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        passaFiltroSearch =
          prisao.acusado.nome.toLowerCase().includes(term) ||
          prisao.acusado.passaporte.toLowerCase().includes(term) ||
          prisao.policial.nome.toLowerCase().includes(term) ||
          prisao.policial.passaporte.toLowerCase().includes(term)
      }

      return passaFiltroMes && passaFiltroOficial && passaFiltroSearch
    } catch (error) {
      return true // Incluir prisões com data inválida para não perder dados
    }
  })

  // Estatísticas calculadas
  const stats = {
    totalPrisoes: prisoesFiltradas.length,
    totalArrecadado: prisoesFiltradas.reduce((acc, p) => acc + (p.totais?.multaFinal || 0), 0),
    totalMesesPrisao: prisoesFiltradas.reduce((acc, p) => acc + (p.totais?.prisaoFinal || 0), 0),
    mediaPorPrisao:
      prisoesFiltradas.length > 0
        ? Math.round(
            prisoesFiltradas.reduce((acc, p) => acc + (p.totais?.multaFinal || 0), 0) / prisoesFiltradas.length,
          )
        : 0,
    casosComAdvogado: prisoesFiltradas.filter((p) => p.advogado).length,
    casosComCooperacao: prisoesFiltradas.filter((p) => p.reducoes?.cooperacao).length,
  }

  // Crimes mais comuns
  const crimesComuns = prisoesFiltradas
    .flatMap((p) => p.crimes)
    .reduce((acc: any, crime) => {
      const key = crime.article
      if (!acc[key]) {
        acc[key] = { article: crime.article, description: crime.description, count: 0, totalMulta: 0 }
      }
      acc[key].count++
      acc[key].totalMulta += crime.fine
      return acc
    }, {})

  const topCrimes = Object.values(crimesComuns)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10)

  // Oficiais únicos para filtro
  const oficiaisUnicos = Array.from(new Set(prisoes.map((p) => p.policial.passaporte))).map((passaporte) => {
    const prisao = prisoes.find((p) => p.policial.passaporte === passaporte)
    return { passaporte, nome: prisao?.policial.nome || "" }
  })

  // Obter dados do oficial
  const obterDadosOficial = (passaporte: string) => {
    return usuarios.find((u) => u.passaporte === passaporte)
  }

  // Função para abrir modal com detalhes da prisão
  const abrirDetalhes = (prisao: Prisao) => {
    setPrisaoSelecionada(prisao)
    setModalAberto(true)
  }

  // Função para fechar modal
  const fecharModal = () => {
    setModalAberto(false)
    setPrisaoSelecionada(null)
  }

  const getSyncIcon = () => {
    switch (syncStatus) {
      case "online":
        return "🗄️"
      case "syncing":
        return <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin inline" />
      case "offline":
        return "❌"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={onVoltar} className="bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black border-[#26C6DA]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Image src="/avenue-logo.gif" alt="Avenue Logo" width={80} height={40} className="object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-white">Relatórios Avançados</h1>
              <p className="text-[#26C6DA]">Análises detalhadas do sistema penal - Avenue City</p>
              <div className="flex items-center gap-2 mt-1">
                {getSyncIcon()}
                <span className="text-xs text-gray-400">
                  Banco Supabase • Última atualização: {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-medium">{usuario?.nome}</p>
            <p className="text-gray-400 text-sm capitalize">{usuario?.tipo}</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 text-[#26C6DA] animate-spin mr-3" />
            <span className="text-white">Carregando dados do banco...</span>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Filtros */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Filtros de Análise</CardTitle>
                <CardDescription className="text-[#26C6DA]">Dados em tempo real do banco Supabase</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-white text-sm">Período</label>
                  <Select value={filtroMes} onValueChange={setFiltroMes}>
                    <SelectTrigger className="bg-[#26C6DA] text-white border-[#26C6DA]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="todos" className="text-white hover:bg-[#26C6DA] hover:text-black">
                        Todos os períodos
                      </SelectItem>
                      <SelectItem value="atual" className="text-white hover:bg-[#26C6DA] hover:text-black">
                        Mês atual
                      </SelectItem>
                      <SelectItem value="anterior" className="text-white hover:bg-[#26C6DA] hover:text-black">
                        Mês anterior
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-white text-sm">Oficial</label>
                  <Select value={filtroOficial} onValueChange={setFiltroOficial}>
                    <SelectTrigger className="bg-[#26C6DA] text-white border-[#26C6DA]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="todos" className="text-white hover:bg-[#26C6DA] hover:text-black">
                        Todos os oficiais
                      </SelectItem>
                      {oficiaisUnicos.map((oficial) => (
                        <SelectItem
                          key={oficial.passaporte}
                          value={oficial.passaporte}
                          className="text-white hover:bg-[#26C6DA] hover:text-black"
                        >
                          {oficial.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-white text-sm">Pesquisar</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nome/Passaporte"
                      className="w-full bg-gray-800 text-white border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:border-[#26C6DA]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas Filtradas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Prisões</CardTitle>
                  <FileText className="h-4 w-4 text-[#26C6DA]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats.totalPrisoes}</div>
                  <p className="text-xs text-gray-400">No período selecionado</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Arrecadado</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">${stats.totalArrecadado.toLocaleString()}</div>
                  <p className="text-xs text-gray-400">Média: ${stats.mediaPorPrisao.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Com Advogado</CardTitle>
                  <Users className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-400">{stats.casosComAdvogado}</div>
                  <p className="text-xs text-gray-400">
                    {stats.totalPrisoes > 0 ? Math.round((stats.casosComAdvogado / stats.totalPrisoes) * 100) : 0}% dos
                    casos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white">Cooperação</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-400">{stats.casosComCooperacao}</div>
                  <p className="text-xs text-gray-400">
                    {stats.totalPrisoes > 0 ? Math.round((stats.casosComCooperacao / stats.totalPrisoes) * 100) : 0}%
                    dos casos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Análises Detalhadas */}
            <Tabs defaultValue="crimes" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger
                  value="crimes"
                  className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-white text-white bg-gray-800"
                >
                  Crimes Mais Comuns
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-white text-white bg-gray-800"
                >
                  Linha do Tempo
                </TabsTrigger>
                <TabsTrigger
                  value="detalhes"
                  className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-white text-white bg-gray-800"
                >
                  Detalhes dos Casos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="crimes">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">📊 Top 10 Crimes Mais Aplicados</CardTitle>
                    <CardDescription className="text-[#26C6DA]">
                      Baseado no período e filtros selecionados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topCrimes.length > 0 ? (
                        topCrimes.map((crime: any, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#26C6DA] text-black flex items-center justify-center font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-white">{crime.article}</p>
                                <p className="text-sm text-gray-400">{crime.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-[#26C6DA]">{crime.count} casos</p>
                              <p className="text-xs text-gray-400">${crime.totalMulta.toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum crime encontrado nos filtros selecionados</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">📅 Histórico de Prisões</CardTitle>
                    <CardDescription className="text-[#26C6DA]">
                      Últimas prisões registradas - Clique para ver detalhes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {prisoesFiltradas.length > 0 ? (
                        prisoesFiltradas
                          .sort((a, b) => {
                            try {
                              return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
                            } catch {
                              return 0
                            }
                          })
                          .slice(0, 20)
                          .map((prisao) => {
                            const dadosOficial = obterDadosOficial(prisao.policial.passaporte)
                            return (
                              <div
                                key={prisao.id}
                                className="p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                                onClick={() => abrirDetalhes(prisao)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#26C6DA] flex items-center justify-center">
                                      {dadosOficial?.fotoPerfil ? (
                                        <img
                                          src={dadosOficial.fotoPerfil || "/placeholder.svg"}
                                          alt="Foto do oficial"
                                          className="w-full h-full rounded-full object-cover"
                                        />
                                      ) : (
                                        <User className="h-5 w-5 text-black" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-white">{prisao.acusado.nome}</p>
                                      <p className="text-sm text-gray-400">Passaporte: {prisao.acusado.passaporte}</p>
                                    </div>
                                  </div>
                                  <div className="text-right flex items-center gap-2">
                                    <div>
                                      <p className="text-sm text-[#26C6DA]">#{prisao.numeroPrisao}</p>
                                      <p className="text-xs text-gray-400">{formatarData(prisao.dataHora)}</p>
                                    </div>
                                    <Eye className="h-4 w-4 text-[#26C6DA]" />
                                  </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-400">Oficial: {prisao.policial.nome}</span>
                                    {dadosOficial?.patente && (
                                      <span className="text-xs bg-blue-900 text-blue-100 px-2 py-1 rounded">
                                        {dadosOficial.patente}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-green-400">
                                    ${(prisao.totais?.multaFinal || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma prisão encontrada nos filtros selecionados</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="detalhes">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">🔍 Análise Detalhada</CardTitle>
                    <CardDescription className="text-[#26C6DA]">Informações específicas do período</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <h4 className="font-medium text-white mb-2">Reduções Aplicadas</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Com Advogado:</span>
                            <span className="text-purple-400">{stats.casosComAdvogado} casos</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Com Cooperação:</span>
                            <span className="text-orange-400">{stats.casosComCooperacao} casos</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Sem Reduções:</span>
                            <span className="text-red-400">
                              {stats.totalPrisoes - Math.max(stats.casosComAdvogado, stats.casosComCooperacao)} casos
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-800 rounded-lg">
                        <h4 className="font-medium text-white mb-2">Tempo de Prisão</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total:</span>
                            <span className="text-orange-400">{stats.totalMesesPrisao} meses</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Média por caso:</span>
                            <span className="text-orange-400">
                              {stats.totalPrisoes > 0 ? Math.round(stats.totalMesesPrisao / stats.totalPrisoes) : 0}{" "}
                              meses
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Modal de Detalhes da Prisão - MODAL ÚNICO */}
            {modalAberto && prisaoSelecionada && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  {/* Header do Modal */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Detalhes da Prisão #{prisaoSelecionada.numeroPrisao}
                      </h2>
                      <p className="text-[#26C6DA]">Informações completas do caso</p>
                    </div>
                    <Button onClick={fecharModal} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Conteúdo do Modal */}
                  <div className="p-6 space-y-6">
                    {/* Informações Básicas */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="bg-gray-800 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">👤 Acusado</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-[#26C6DA] flex items-center justify-center overflow-hidden">
                              {prisaoSelecionada.acusado.foto ? (
                                <img
                                  src={prisaoSelecionada.acusado.foto || "/placeholder.svg"}
                                  alt="Foto do acusado"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="h-6 w-6 text-black" />
                              )}
                            </div>
                            <div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Nome:</span>
                                <span className="text-white font-medium">{prisaoSelecionada.acusado.nome}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Passaporte:</span>
                                <span className="text-white">{prisaoSelecionada.acusado.passaporte}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-800 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">👮 Oficial Responsável</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-[#26C6DA] flex items-center justify-center overflow-hidden">
                              {obterDadosOficial(prisaoSelecionada.policial.passaporte)?.fotoPerfil ? (
                                <img
                                  src={
                                    obterDadosOficial(prisaoSelecionada.policial.passaporte)?.fotoPerfil ||
                                    "/placeholder.svg" ||
                                    "/placeholder.svg"
                                  }
                                  alt="Foto do oficial"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="h-6 w-6 text-black" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{prisaoSelecionada.policial.nome}</p>
                              {obterDadosOficial(prisaoSelecionada.policial.passaporte)?.patente && (
                                <span className="text-xs bg-blue-900 text-blue-100 px-2 py-1 rounded">
                                  {obterDadosOficial(prisaoSelecionada.policial.passaporte)?.patente}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Patente:</span>
                            <span className="text-white">
                              {obterDadosOficial(prisaoSelecionada.policial.passaporte)?.patente || "Não disponível"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Crimes */}
                    <Card className="bg-gray-800 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">📋 Crimes Aplicados</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {prisaoSelecionada.crimes.map((crime, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                              <div>
                                <span className="text-white font-medium">{crime.article}</span>
                                <p className="text-sm text-gray-400">{crime.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-red-400">${crime.fine.toLocaleString()}</p>
                                <p className="text-orange-400 text-sm">{crime.penalty}m</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Totais */}
                    <Card className="bg-gray-800 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">💰 Penalidades Finais</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="text-center p-3 bg-gray-700 rounded">
                            <p className="text-red-400 text-2xl font-bold">
                              ${(prisaoSelecionada.totais?.multaFinal || 0).toLocaleString()}
                            </p>
                            <p className="text-gray-400 text-sm">Multa Final</p>
                          </div>
                          <div className="text-center p-3 bg-gray-700 rounded">
                            <p className="text-orange-400 text-2xl font-bold">
                              {prisaoSelecionada.totais?.prisaoFinal || 0}
                            </p>
                            <p className="text-gray-400 text-sm">Meses de Prisão</p>
                          </div>
                          <div className="text-center p-3 bg-gray-700 rounded">
                            <p className="text-[#26C6DA] text-2xl font-bold">
                              {prisaoSelecionada.totais?.fianca > 0
                                ? `$${prisaoSelecionada.totais.fianca.toLocaleString()}`
                                : "Sem fiança"}
                            </p>
                            <p className="text-gray-400 text-sm">Fiança</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Observações */}
                    {prisaoSelecionada.observacoes && (
                      <Card className="bg-gray-800 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">📝 Observações</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-300">{prisaoSelecionada.observacoes}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
