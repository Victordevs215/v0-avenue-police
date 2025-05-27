"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  FileText,
  DollarSign,
  Clock,
  User,
  Shield,
  Scale,
  UserCheck,
  Handshake,
  Upload,
  ImageIcon,
  ArrowLeft,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react"
import { criminalArticles, categories, type CriminalArticle } from "./types/criminal-articles"
import { useAuth } from "./contexts/AuthContext"
import type { Prisao } from "./types/auth"
import { db } from "./lib/database"
import Image from "next/image"

interface CalculadoraPenalProps {
  onVoltar?: () => void
}

export default function CalculadoraPenal({ onVoltar }: CalculadoraPenalProps) {
  const { usuario, syncStatus } = useAuth()

  // Validation functions
  const validarNome = (nome: string) => {
    const regex = /^[a-zA-ZÀ-ÿ\s]+$/
    return regex.test(nome)
  }

  const validarPassaporte = (passaporte: string) => {
    return passaporte.length >= 1 && passaporte.length <= 12 && /^\d+$/.test(passaporte)
  }

  const formatarNome = (valor: string) => {
    return valor.replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
  }

  const formatarPassaporte = (valor: string) => {
    const numeros = valor.replace(/\D/g, "")
    return numeros.slice(0, 12)
  }

  // Save arrest to global history
  const salvarPrisao = async (dadosPrisao: Omit<Prisao, "id" | "numeroPrisao">) => {
    try {
      const novaPrisao = await db.createPrisao(dadosPrisao)
      return novaPrisao.numeroPrisao
    } catch (error) {
      console.error("Erro ao salvar prisão:", error)
      return 1
    }
  }

  // Get officer's arrest counter
  const obterContadorPrisoes = async (passaportePolicial: string) => {
    try {
      return await db.getContadorPrisoes(passaportePolicial)
    } catch (error) {
      console.error("Erro ao obter contador:", error)
      return 0
    }
  }

  const [artigosSelecionados, setArtigosSelecionados] = useState<CriminalArticle[]>([])
  const [artigoSelecionado, setArtigoSelecionado] = useState<string>("")

  // Accused data
  const [nomeAcusado, setNomeAcusado] = useState("")
  const [passaporteAcusado, setPassaporteAcusado] = useState("")
  const [imagemPreso, setImagemPreso] = useState<File | null>(null)
  const [imagemPresoUrl, setImagemPresoUrl] = useState<string>("")

  // Officer data (auto-filled)
  const [nomePolicial, setNomePolicial] = useState(usuario?.nome || "")
  const [passaportePolicial, setPassaportePolicial] = useState(usuario?.passaporte || "")

  // Lawyer data
  const [temAdvogado, setTemAdvogado] = useState(false)
  const [nomeAdvogado, setNomeAdvogado] = useState("")
  const [passaporteAdvogado, setPassaporteAdvogado] = useState("")

  // Cooperation
  const [cooperacao, setCooperacao] = useState(false)

  const [observacoes, setObservacoes] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculated totals
  const [multaTotal, setMultaTotal] = useState(0)
  const [prisaoTotal, setPrisaoTotal] = useState(0)
  const [fiancaTotal, setFiancaTotal] = useState(0)
  const [multaFinal, setMultaFinal] = useState(0)
  const [prisaoFinal, setPrisaoFinal] = useState(0)

  const [notificacao, setNotificacao] = useState<{ tipo: "sucesso" | "erro" | null; mensagem: string }>({
    tipo: null,
    mensagem: "",
  })

  // State to show current officer's arrest counter
  const [contadorPrisoesAtual, setContadorPrisoesAtual] = useState(0)

  useEffect(() => {
    const totalMulta = artigosSelecionados.reduce((acc, artigo) => acc + artigo.fine, 0)
    const totalPrisao = artigosSelecionados.reduce((acc, artigo) => acc + artigo.penalty, 0)
    const totalFianca = artigosSelecionados.reduce((acc, artigo) => acc + (artigo.bail > 0 ? artigo.bail : 0), 0)

    setMultaTotal(totalMulta)
    setPrisaoTotal(totalPrisao)
    setFiancaTotal(totalFianca)

    // Apply reductions
    let multaComDesconto = totalMulta
    let prisaoComDesconto = totalPrisao

    // Lawyer discount (30%)
    if (temAdvogado && nomeAdvogado && passaporteAdvogado) {
      multaComDesconto *= 0.7
      prisaoComDesconto *= 0.7
    }

    // Cooperation discount (20%)
    if (cooperacao) {
      multaComDesconto *= 0.8
      prisaoComDesconto *= 0.8
    }

    setMultaFinal(Math.round(multaComDesconto))
    setPrisaoFinal(Math.round(prisaoComDesconto))
  }, [artigosSelecionados, temAdvogado, nomeAdvogado, passaporteAdvogado, cooperacao])

  // Update counter when user logged in
  useEffect(() => {
    if (usuario?.passaporte) {
      obterContadorPrisoes(usuario.passaporte).then(setContadorPrisoesAtual)
    }
  }, [usuario])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImagemPreso(file)
      const url = URL.createObjectURL(file)
      setImagemPresoUrl(url)
    }
  }

  const adicionarArtigo = () => {
    if (artigoSelecionado) {
      const artigo = criminalArticles.find((a) => a.id === artigoSelecionado)
      if (artigo && !artigosSelecionados.find((a) => a.id === artigo.id)) {
        setArtigosSelecionados([...artigosSelecionados, artigo])
        setArtigoSelecionado("")
      }
    }
  }

  const removerArtigo = (artigoId: string) => {
    setArtigosSelecionados(artigosSelecionados.filter((artigo) => artigo.id !== artigoId))
  }

  const limparCalculadora = () => {
    setArtigosSelecionados([])
    setNomeAcusado("")
    setPassaporteAcusado("")
    setTemAdvogado(false)
    setNomeAdvogado("")
    setPassaporteAdvogado("")
    setCooperacao(false)
    setObservacoes("")
    setImagemPreso(null)
    setImagemPresoUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const enviarWebhook = async (dados: any) => {
    const webhookUrl =
      "https://discord.com/api/webhooks/1376524903129284679/NFvchiDzpePe5nXoBUhddA_JHM2WN00t6zymeeIy606M899TlExwhc3Mf-i0rCwaaC1k"

    if (!webhookUrl) {
      console.log("URL do webhook não configurada")
      setNotificacao({ tipo: "erro", mensagem: "URL do webhook não configurada" })
      return
    }

    try {
      // Save arrest to global system
      const numeroPrisao = await salvarPrisao({
        acusado: dados.acusado,
        policial: dados.policial,
        advogado: dados.advogado.presente
          ? {
              nome: dados.advogado.nome,
              passaporte: dados.advogado.passaporte,
            }
          : undefined,
        crimes: dados.crimes,
        totais: dados.totais,
        reducoes: dados.reducoes,
        dataHora: dados.dataHora,
        observacoes: dados.observacoes,
        imagemPreso: imagemPresoUrl,
      })

      // Update local counter
      setContadorPrisoesAtual(await obterContadorPrisoes(dados.policial.passaporte))

      const embedData = {
        embeds: [
          {
            title: "🚔 RELATÓRIO DE PRISÃO - AVENUE CITY",
            description: "**Governo Federal - Avenue City**\nRelatório oficial de prisão",
            color: 0x26c6da,
            image: imagemPreso
              ? {
                  url: "attachment://foto_preso.png",
                }
              : undefined,
            fields: [
              {
                name: "👤 **ACUSADO**",
                value: `**Nome:** ${dados.acusado.nome}\n**Passaporte:** ${dados.acusado.passaporte}`,
                inline: true,
              },
              {
                name: "👮 **POLICIAL RESPONSÁVEL**",
                value: `**Nome:** ${dados.policial.nome}\n**Passaporte:** ${dados.policial.passaporte}\n**Prisões realizadas:** ${numeroPrisao}`,
                inline: true,
              },
              ...(dados.advogado.presente
                ? [
                    {
                      name: "⚖️ **ADVOGADO**",
                      value: `**Nome:** ${dados.advogado.nome}\n**Passaporte:** ${dados.advogado.passaporte}`,
                      inline: true,
                    },
                  ]
                : []),
              {
                name: "📋 **CRIMES COMETIDOS**",
                value: dados.crimes.map((crime: any) => `• **${crime.article}** - ${crime.description}`).join("\n"),
                inline: false,
              },
              {
                name: "💰 **PENALIDADES FINAIS**",
                value: `**💵 Multa:** $${dados.totais.multaFinal.toLocaleString()}\n**⏰ Prisão:** ${dados.totais.prisaoFinal} meses\n**🏦 Fiança:** ${dados.totais.fianca > 0 ? `$${dados.totais.fianca.toLocaleString()}` : "Sem fiança"}`,
                inline: true,
              },
              {
                name: "📊 **REDUÇÕES APLICADAS**",
                value: `${dados.reducoes.advogado ? "✅ **Advogado** (-30%)" : "❌ Sem advogado"}\n${dados.reducoes.cooperacao ? "✅ **Cooperação** (-20%)" : "❌ Sem cooperação"}`,
                inline: true,
              },
              ...(dados.observacoes
                ? [
                    {
                      name: "📝 **OBSERVAÇÕES**",
                      value: dados.observacoes,
                      inline: false,
                    },
                  ]
                : []),
            ],
            footer: {
              text: `Avenue City • ${dados.dataHora} • Prisão #${numeroPrisao} • Sistema Global Sincronizado`,
              icon_url: "https://cdn.discordapp.com/attachments/1234567890/avenue-logo.png",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      }

      const formData = new FormData()

      if (imagemPreso) {
        formData.append("payload_json", JSON.stringify(embedData))
        formData.append("files[0]", imagemPreso, "foto_preso.png")
      } else {
        formData.append("payload_json", JSON.stringify(embedData))
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        body: imagemPreso ? formData : JSON.stringify(embedData),
        headers: imagemPreso
          ? {}
          : {
              "Content-Type": "application/json",
            },
      })

      if (response.ok) {
        setNotificacao({
          tipo: "sucesso",
          mensagem: `Relatório enviado com sucesso! Prisão #${numeroPrisao} (Banco Supabase)`,
        })
        setTimeout(() => setNotificacao({ tipo: null, mensagem: "" }), 5000)
      } else {
        const errorText = await response.text()
        console.error("Erro na resposta:", errorText)
        throw new Error(`Erro ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("Erro ao enviar webhook:", error)
      setNotificacao({
        tipo: "erro",
        mensagem: error instanceof Error ? error.message : "Erro ao enviar relatório para o Discord.",
      })
      setTimeout(() => setNotificacao({ tipo: null, mensagem: "" }), 5000)
    }
  }

  const gerarRelatorio = async () => {
    if (!nomeAcusado || !passaporteAcusado) {
      setNotificacao({
        tipo: "erro",
        mensagem: "Por favor, preencha todos os campos do acusado.",
      })
      setTimeout(() => setNotificacao({ tipo: null, mensagem: "" }), 5000)
      return
    }

    if (!validarNome(nomeAcusado)) {
      setNotificacao({ tipo: "erro", mensagem: "O nome do acusado deve conter apenas letras e acentos." })
      setTimeout(() => setNotificacao({ tipo: null, mensagem: "" }), 5000)
      return
    }

    if (!validarPassaporte(passaporteAcusado)) {
      setNotificacao({ tipo: "erro", mensagem: "O passaporte do acusado deve ter entre 1 e 12 dígitos." })
      setTimeout(() => setNotificacao({ tipo: null, mensagem: "" }), 5000)
      return
    }

    if (temAdvogado && nomeAdvogado && passaporteAdvogado) {
      if (!validarNome(nomeAdvogado)) {
        setNotificacao({ tipo: "erro", mensagem: "O nome do advogado deve conter apenas letras e acentos." })
        setTimeout(() => setNotificacao({ tipo: null, mensagem: "" }), 5000)
        return
      }
      if (!validarPassaporte(passaporteAdvogado)) {
        setNotificacao({ tipo: "erro", mensagem: "O passaporte do advogado deve ter entre 1 e 12 dígitos." })
        setTimeout(() => setNotificacao({ tipo: null, mensagem: "" }), 5000)
        return
      }
    }

    if (artigosSelecionados.length === 0) {
      setNotificacao({ tipo: "erro", mensagem: "Por favor, adicione pelo menos um crime." })
      setTimeout(() => setNotificacao({ tipo: null, mensagem: "" }), 5000)
      return
    }

    const relatorio = {
      acusado: {
        nome: nomeAcusado,
        passaporte: passaporteAcusado,
      },
      policial: {
        nome: nomePolicial,
        passaporte: passaportePolicial,
      },
      advogado: {
        presente: temAdvogado && nomeAdvogado && passaporteAdvogado,
        nome: nomeAdvogado,
        passaporte: passaporteAdvogado,
      },
      crimes: artigosSelecionados,
      totais: {
        multaOriginal: multaTotal,
        prisaoOriginal: prisaoTotal,
        multaFinal: multaFinal,
        prisaoFinal: prisaoFinal,
        fianca: fiancaTotal,
      },
      reducoes: {
        advogado: temAdvogado && nomeAdvogado && passaporteAdvogado,
        cooperacao: cooperacao,
      },
      observacoes,
      dataHora: new Date().toLocaleString("pt-BR"),
    }

    console.log("Relatório Gerado:", relatorio)
    await enviarWebhook(relatorio)
  }

  const getSyncIcon = () => {
    switch (syncStatus) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-400" />
      case "syncing":
        return <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-400" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onVoltar && (
              <Button onClick={onVoltar} className="bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black border-[#26C6DA]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            <Image src="/avenue-logo.gif" alt="Avenue Logo" width={120} height={60} className="object-contain" />
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">Governo Federal - Avenue City</h1>
              <p className="text-[#26C6DA] text-lg">Calculadora dedicada para os oficiais da cidade</p>
              <div className="flex items-center gap-2 mt-1">
                {getSyncIcon()}
                <span className="text-xs text-gray-400">
                  {syncStatus === "online" && "🗄️ Sistema Supabase Sincronizado"}
                  {syncStatus === "syncing" && "🔄 Sincronizando dados..."}
                  {syncStatus === "offline" && "❌ Offline - dados podem não sincronizar"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus !== "online" && (
          <div
            className={`p-3 rounded-lg border ${
              syncStatus === "syncing"
                ? "bg-yellow-900/30 border-yellow-700 text-yellow-100"
                : "bg-red-900/30 border-red-700 text-red-100"
            }`}
          >
            <div className="flex items-center gap-2">
              {getSyncIcon()}
              <span className="text-sm">
                {syncStatus === "syncing" && "Sincronizando dados com banco Supabase..."}
                {syncStatus === "offline" && "Sem conexão - relatório pode não ser compartilhado globalmente"}
              </span>
            </div>
          </div>
        )}

        {/* Notification */}
        {notificacao.tipo && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${
              notificacao.tipo === "sucesso"
                ? "bg-green-900/90 border-green-700 text-green-100"
                : "bg-red-900/90 border-red-700 text-red-100"
            } backdrop-blur-sm`}
          >
            <div className="flex items-center gap-2">
              {notificacao.tipo === "sucesso" ? (
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              ) : (
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              )}
              <span className="text-sm font-medium">{notificacao.mensagem}</span>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Accused Data */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-[#26C6DA]" />
                Dados do Acusado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-acusado" className="text-white">
                  Nome do Acusado *
                </Label>
                <Input
                  id="nome-acusado"
                  value={nomeAcusado}
                  onChange={(e) => setNomeAcusado(formatarNome(e.target.value))}
                  placeholder="Digite o nome do acusado"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passaporte-acusado" className="text-white">
                  Passaporte do Acusado * (1-12 dígitos)
                </Label>
                <Input
                  id="passaporte-acusado"
                  value={passaporteAcusado}
                  onChange={(e) => setPassaporteAcusado(formatarPassaporte(e.target.value))}
                  placeholder="Digite apenas números"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imagem-preso" className="text-white">
                  Foto do Preso
                </Label>
                <div className="space-y-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    <Upload className="h-4 w-4 mr-2 text-[#26C6DA]" />
                    Selecionar Imagem
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {imagemPresoUrl && (
                    <div className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-600">
                      <ImageIcon className="h-4 w-4 text-[#26C6DA]" />
                      <span className="text-sm text-white truncate">Imagem selecionada</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Officer Data */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-[#26C6DA]" />
                Dados do Policial
              </CardTitle>
              {contadorPrisoesAtual > 0 && (
                <CardDescription className="text-[#26C6DA]">Prisões realizadas: {contadorPrisoesAtual}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-policial" className="text-white">
                  Nome do Policial
                </Label>
                <Input
                  id="nome-policial"
                  value={nomePolicial}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passaporte-policial" className="text-white">
                  Passaporte do Policial
                </Label>
                <Input
                  id="passaporte-policial"
                  value={passaportePolicial}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                />
              </div>
              <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
                ℹ️ Dados preenchidos automaticamente com base no login
              </div>
            </CardContent>
          </Card>

          {/* Lawyer Data */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Scale className="h-5 w-5 text-[#26C6DA]" />
                Dados do Advogado
              </CardTitle>
              <CardDescription className="text-[#26C6DA]">Reduz pena em 30%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="tem-advogado" checked={temAdvogado} onCheckedChange={setTemAdvogado} />
                <Label htmlFor="tem-advogado" className="text-white">
                  Possui advogado
                </Label>
              </div>
              {temAdvogado && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome-advogado" className="text-white">
                      Nome do Advogado
                    </Label>
                    <Input
                      id="nome-advogado"
                      value={nomeAdvogado}
                      onChange={(e) => setNomeAdvogado(formatarNome(e.target.value))}
                      placeholder="Digite o nome do advogado"
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passaporte-advogado" className="text-white">
                      Passaporte do Advogado (1-12 dígitos)
                    </Label>
                    <Input
                      id="passaporte-advogado"
                      value={passaporteAdvogado}
                      onChange={(e) => setPassaporteAdvogado(formatarPassaporte(e.target.value))}
                      placeholder="Digite o passaporte"
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Summary of Penalties */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5 text-[#26C6DA]" />
                Resumo das Penalidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-900/30 rounded-lg border border-red-700">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-red-400" />
                    <span className="font-medium text-white">Multa Final</span>
                  </div>
                  <span className="text-lg font-bold text-red-400">${multaFinal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-900/30 rounded-lg border border-orange-700">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span className="font-medium text-white">Prisão Final</span>
                  </div>
                  <span className="text-lg font-bold text-orange-400">{prisaoFinal} meses</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-lg border border-blue-700">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[#26C6DA]" />
                    <span className="font-medium text-white">Fiança</span>
                  </div>
                  <span className="text-lg font-bold text-[#26C6DA]">
                    {fiancaTotal > 0 ? `$${fiancaTotal.toLocaleString()}` : "Sem fiança"}
                  </span>
                </div>
              </div>

              {/* Cooperation */}
              <div className="flex items-center space-x-2 p-3 bg-green-900/30 rounded-lg border border-green-700">
                <Checkbox id="cooperacao" checked={cooperacao} onCheckedChange={setCooperacao} />
                <Label htmlFor="cooperacao" className="flex items-center gap-2 text-white">
                  <Handshake className="h-4 w-4 text-green-400" />
                  Cooperação (-20%)
                </Label>
              </div>

              <Separator className="bg-gray-700" />
              <div className="space-y-2">
                <Button
                  onClick={gerarRelatorio}
                  className="w-full bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black font-semibold"
                  disabled={artigosSelecionados.length === 0}
                >
                  Gerar Relatório
                </Button>
                <Button onClick={limparCalculadora} className="w-full bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black">
                  Limpar Tudo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Article Selection */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Adicionar Artigo Criminal</CardTitle>
            <CardDescription className="text-[#26C6DA]">
              Selecione os artigos do código penal aplicáveis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="artigo" className="text-white">
                  Artigo Criminal
                </Label>
                <Select value={artigoSelecionado} onValueChange={setArtigoSelecionado}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione um artigo" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {Object.entries(categories).map(([categoria, artigos]) => (
                      <div key={categoria}>
                        <div className="px-2 py-1 text-sm font-semibold text-[#26C6DA]">{categoria}</div>
                        {artigos.map((artigoId) => {
                          const artigo = criminalArticles.find((a) => a.id === artigoId)
                          if (!artigo) return null
                          return (
                            <SelectItem key={artigo.id} value={artigo.id} className="text-white hover:bg-gray-700">
                              <div className="flex flex-col">
                                <span>
                                  {artigo.article} - {artigo.description}
                                </span>
                                <span className="text-xs text-gray-400">
                                  Multa: ${artigo.fine.toLocaleString()} | Prisão: {artigo.penalty} meses
                                  {artigo.bail > 0 && ` | Fiança: $${artigo.bail.toLocaleString()}`}
                                  {artigo.bail === -1 && ` | Sem fiança`}
                                </span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={adicionarArtigo}
                  className="w-full bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black font-semibold"
                  disabled={!artigoSelecionado}
                >
                  Adicionar Artigo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Articles List */}
        {artigosSelecionados.length > 0 && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Artigos Selecionados ({artigosSelecionados.length})</CardTitle>
              {(multaTotal !== multaFinal || prisaoTotal !== prisaoFinal) && (
                <CardDescription className="text-[#26C6DA]">
                  Valores originais: ${multaTotal.toLocaleString()} multa, {prisaoTotal} meses prisão
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {artigosSelecionados.map((artigo) => (
                  <div key={artigo.id} className="border border-gray-700 rounded-lg p-4 space-y-2 bg-gray-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-[#26C6DA]">{artigo.article}</h4>
                        <p className="text-sm text-white">{artigo.description}</p>
                      </div>
                      <Button
                        onClick={() => removerArtigo(artigo.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        ×
                      </Button>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-400 font-medium">Multa: ${artigo.fine.toLocaleString()}</span>
                      <span className="text-orange-400 font-medium">Prisão: {artigo.penalty}m</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-[#26C6DA] font-medium">
                        Fiança:{" "}
                        {artigo.bail > 0
                          ? `$${artigo.bail.toLocaleString()}`
                          : artigo.bail === -1
                            ? "Sem fiança"
                            : "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Observations */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Observações Adicionais</CardTitle>
            <CardDescription className="text-[#26C6DA]">
              Adicione informações extras sobre o caso ou circunstâncias especiais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações sobre o caso, circunstâncias atenuantes ou agravantes..."
              className="min-h-[100px] bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
