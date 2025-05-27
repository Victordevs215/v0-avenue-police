"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Camera, Save, User, Shield, Edit, Heart } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import Image from "next/image"

interface PerfilUsuarioProps {
  onVoltar: () => void
}

export default function PerfilUsuario({ onVoltar }: PerfilUsuarioProps) {
  const { usuario, updateUsuario } = useAuth()
  const [editando, setEditando] = useState(false)
  const [fotoPerfil, setFotoPerfil] = useState<string>(usuario?.fotoPerfil || "")
  const [idade, setIdade] = useState<string>(usuario?.idade?.toString() || "")
  const [patente, setPatente] = useState<string>(usuario?.patente || "")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notification, setNotification] = useState<{ tipo: "sucesso" | "erro" | null; mensagem: string }>({
    tipo: null,
    mensagem: "",
  })
  const [salvando, setSalvando] = useState(false)

  const patentes = [
    "Aluno",
    "Soldado",
    "Cabo",
    "3°Sargento",
    "2°Sargento",
    "1°Sargento",
    "Subtenente",
    "2°Tenente",
    "1°Tenente",
    "Capitão",
    "Major",
    "Tenente-Coronel",
    "Coronel",
    "Supervisor Regional",
    "Supervisor Geral",
    "Sub-Comando Geral",
    "Comando Geral",

  ]

  const showNotification = (tipo: "sucesso" | "erro", mensagem: string) => {
    setNotification({ tipo, mensagem })
    setTimeout(() => setNotification({ tipo: null, mensagem: "" }), 3000)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Verificar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification("erro", "Imagem muito grande. Máximo 5MB.")
        return
      }

      // Verificar tipo do arquivo
      if (!file.type.startsWith("image/")) {
        showNotification("erro", "Por favor, selecione apenas arquivos de imagem.")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFotoPerfil(result)
        console.log("📷 Imagem carregada para preview")
      }
      reader.onerror = () => {
        showNotification("erro", "Erro ao carregar a imagem.")
      }
      reader.readAsDataURL(file)
    }
  }

  const salvarPerfil = async () => {
    if (!usuario) {
      showNotification("erro", "Usuário não encontrado")
      return
    }

    try {
      console.log("💾 Salvando perfil do usuário:", usuario.nome)
      setSalvando(true)

      // Preparar dados para atualização
      const updates: Partial<typeof usuario> = {}

      // Sempre incluir a foto de perfil se foi alterada
      if (fotoPerfil !== (usuario.fotoPerfil || "")) {
        updates.fotoPerfil = fotoPerfil
        console.log("📷 Atualizando foto de perfil")
      }

      // Incluir idade se foi alterada
      const novaIdade = idade ? Number.parseInt(idade) : undefined
      if (novaIdade !== usuario.idade) {
        updates.idade = novaIdade
        console.log("🎂 Atualizando idade:", novaIdade)
      }

      // Incluir patente se foi alterada
      if (patente !== (usuario.patente || "")) {
        updates.patente = patente || undefined
        console.log("🎖️ Atualizando patente:", patente)
      }

      // Só fazer a atualização se houver mudanças
      if (Object.keys(updates).length > 0) {
        console.log("🔄 Enviando atualizações:", updates)
        await updateUsuario(updates)
        console.log("✅ Perfil atualizado com sucesso")
        showNotification("sucesso", "Perfil atualizado com sucesso!")
      } else {
        console.log("ℹ️ Nenhuma alteração detectada")
        showNotification("sucesso", "Nenhuma alteração para salvar")
      }

      setEditando(false)
    } catch (error) {
      console.error("❌ Erro ao salvar perfil:", error)
      showNotification("erro", "Erro ao salvar perfil. Tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  const cancelarEdicao = () => {
    console.log("❌ Cancelando edição do perfil")
    setEditando(false)
    // Restaurar valores originais
    setFotoPerfil(usuario?.fotoPerfil || "")
    setIdade(usuario?.idade?.toString() || "")
    setPatente(usuario?.patente || "")
  }

  // Check if it's Colth's special profile
  const isColthProfile = usuario?.nome === "Colth" && usuario?.passaporte === "2"

  return (
    <div className={`min-h-screen p-4 ${isColthProfile ? "text-white" : "bg-black text-white"}`}>
      <div className={`mx-auto max-w-4xl space-y-6`}>
        {/* Special Header for Colth */}
        {isColthProfile && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 rounded-full shadow-lg">
              <Heart className="h-6 w-6 text-white animate-pulse" />
              <h1 className="text-2xl font-bold text-white">💕 Perfil da Colth 💕</h1>
              <Heart className="h-6 w-6 text-white animate-pulse" />
            </div>
          </div>
        )}

        {/* Normal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onVoltar}
              className={`${isColthProfile ? "bg-pink-500 hover:bg-pink-600 text-white border-pink-500" : "bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black border-[#26C6DA]"}`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            {!isColthProfile && (
              <>
                <Image src="/avenue-logo.gif" alt="Avenue Logo" width={80} height={40} className="object-contain" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Perfil do Usuário</h1>
                  <p className="text-[#26C6DA]">Gerencie suas informações pessoais</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notification */}
        {notification.tipo && (
          <div
            className={`p-4 rounded-lg border ${
              notification.tipo === "sucesso"
                ? "bg-green-900/90 border-green-700 text-green-100"
                : "bg-red-900/90 border-red-700 text-red-100"
            } ${isColthProfile ? "shadow-lg backdrop-blur-sm" : ""}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${notification.tipo === "sucesso" ? "bg-green-400" : "bg-red-400"}`}
              ></div>
              <span className="text-sm font-medium">{notification.mensagem}</span>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Photo */}
          <Card
            className={`${isColthProfile ? "bg-purple-900/80 border-pink-500 shadow-lg backdrop-blur-sm" : "bg-gray-900 border-gray-700"}`}
          >
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isColthProfile ? "text-pink-200" : "text-white"}`}>
                <Camera className={`h-5 w-5 ${isColthProfile ? "text-pink-400" : "text-[#26C6DA]"}`} />
                Foto de Perfil
                {isColthProfile && <Heart className="h-4 w-4 text-pink-400 animate-pulse" />}
              </CardTitle>
              <CardDescription className={isColthProfile ? "text-pink-300" : "text-[#26C6DA]"}>
                {editando ? "Clique na foto para alterar" : "Sua foto atual"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div
                className={`relative w-32 h-32 rounded-full border-2 ${editando ? "cursor-pointer" : ""} overflow-hidden ${
                  isColthProfile ? "bg-purple-800 border-pink-400 shadow-lg" : "bg-gray-800 border-[#26C6DA]"
                }`}
                onClick={() => editando && fileInputRef.current?.click()}
              >
                {fotoPerfil ? (
                  <img
                    src={fotoPerfil || "/placeholder.svg"}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className={`h-16 w-16 ${isColthProfile ? "text-pink-400" : "text-[#26C6DA]"}`} />
                  </div>
                )}
                {editando && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

              {editando && (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className={`${isColthProfile ? "bg-pink-500 hover:bg-pink-600 text-white" : "bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black"}`}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Alterar Foto
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card
            className={`${isColthProfile ? "bg-purple-900/80 border-pink-500 shadow-lg backdrop-blur-sm" : "bg-gray-900 border-gray-700"}`}
          >
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isColthProfile ? "text-pink-200" : "text-white"}`}>
                <Shield className={`h-5 w-5 ${isColthProfile ? "text-pink-400" : "text-[#26C6DA]"}`} />
                Informações Pessoais
                {isColthProfile && <Heart className="h-4 w-4 text-pink-400 animate-pulse" />}
              </CardTitle>
              <CardDescription className={isColthProfile ? "text-pink-300" : "text-[#26C6DA]"}>
                Dados do oficial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className={isColthProfile ? "text-pink-200" : "text-white"}>Nome Completo</Label>
                <Input
                  value={usuario?.nome || ""}
                  readOnly
                  className={`${isColthProfile ? "bg-purple-800 border-pink-600 text-pink-100" : "bg-gray-700 border-gray-600 text-gray-300"} cursor-not-allowed`}
                />
              </div>

              <div className="space-y-2">
                <Label className={isColthProfile ? "text-pink-200" : "text-white"}>Passaporte</Label>
                <Input
                  value={usuario?.passaporte || ""}
                  readOnly
                  className={`${isColthProfile ? "bg-purple-800 border-pink-600 text-pink-100" : "bg-gray-700 border-gray-600 text-gray-300"} cursor-not-allowed`}
                />
              </div>

              <div className="space-y-2">
                <Label className={isColthProfile ? "text-pink-200" : "text-white"}>Tipo de Acesso</Label>
                <Input
                  value={usuario?.tipo || ""}
                  readOnly
                  className={`${isColthProfile ? "bg-purple-800 border-pink-600 text-pink-100" : "bg-gray-700 border-gray-600 text-gray-300"} cursor-not-allowed capitalize`}
                />
              </div>

              <div className="space-y-2">
                <Label className={isColthProfile ? "text-pink-200" : "text-white"}>Idade</Label>
                <Input
                  type="number"
                  value={idade}
                  onChange={(e) => setIdade(e.target.value)}
                  placeholder="Digite sua idade"
                  readOnly={!editando}
                  min="18"
                  max="100"
                  className={
                    editando
                      ? `${isColthProfile ? "bg-purple-800 border-pink-600 text-pink-100" : "bg-gray-800 border-gray-600 text-white"}`
                      : `${isColthProfile ? "bg-purple-800 border-pink-600 text-pink-100" : "bg-gray-700 border-gray-600 text-gray-300"} cursor-not-allowed`
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className={isColthProfile ? "text-pink-200" : "text-white"}>Patente</Label>
                {editando ? (
                  <Select value={patente} onValueChange={setPatente}>
                    <SelectTrigger
                      className={`${isColthProfile ? "bg-purple-800 border-pink-600 text-pink-100" : "bg-gray-800 border-gray-600 text-white"}`}
                    >
                      <SelectValue placeholder="Selecione sua patente" />
                    </SelectTrigger>
                    <SelectContent
                      className={`${isColthProfile ? "bg-purple-800 border-pink-600" : "bg-gray-800 border-gray-600"}`}
                    >
                      {patentes.map((p) => (
                        <SelectItem
                          key={p}
                          value={p}
                          className={`${isColthProfile ? "text-pink-100 hover:bg-pink-700" : "text-white hover:bg-[#26C6DA] hover:text-black"}`}
                        >
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={patente || "Não informado"}
                    readOnly
                    className={`${isColthProfile ? "bg-purple-800 border-pink-600 text-pink-100" : "bg-gray-700 border-gray-600 text-gray-300"} cursor-not-allowed`}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card
          className={`${isColthProfile ? "bg-purple-900/80 border-pink-500 shadow-lg backdrop-blur-sm" : "bg-gray-900 border-gray-700"}`}
        >
          <CardContent className="pt-6">
            <div className="flex gap-4 justify-center">
              {!editando ? (
                <Button
                  onClick={() => setEditando(true)}
                  className={`${isColthProfile ? "bg-pink-500 hover:bg-pink-600 text-white" : "bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black"}`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                  {isColthProfile && <Heart className="h-4 w-4 ml-2 animate-pulse" />}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={salvarPerfil}
                    disabled={salvando}
                    className={`${isColthProfile ? "bg-pink-500 hover:bg-pink-600 text-white" : "bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black"} ${salvando ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {salvando ? "Salvando..." : "Salvar Alterações"}
                    {isColthProfile && <Heart className="h-4 w-4 ml-2 animate-pulse" />}
                  </Button>
                  <Button
                    onClick={cancelarEdicao}
                    disabled={salvando}
                    className={`${isColthProfile ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-gray-600 hover:bg-gray-700 text-white"}`}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Officer Statistics */}
        {(usuario?.tipo === "policial" || usuario?.tipo === "comando" || usuario?.tipo === "dev") && (
          <Card
            className={`${isColthProfile ? "bg-purple-900/80 border-pink-500 shadow-lg backdrop-blur-sm" : "bg-gray-900 border-gray-700"}`}
          >
            <CardHeader>
              <CardTitle className={`${isColthProfile ? "text-pink-200" : "text-white"} flex items-center gap-2`}>
                📊 Suas Estatísticas
                {isColthProfile && <Heart className="h-4 w-4 text-pink-400 animate-pulse" />}
              </CardTitle>
              <CardDescription className={isColthProfile ? "text-pink-300" : "text-[#26C6DA]"}>
                Resumo da sua atividade no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className={`text-center p-4 rounded-lg ${isColthProfile ? "bg-purple-800/60" : "bg-gray-800"}`}>
                  <div className={`text-2xl font-bold ${isColthProfile ? "text-pink-400" : "text-[#26C6DA]"}`}>
                    {
                      JSON.parse(sessionStorage.getItem("avenue_prisoes") || "[]").filter(
                        (p: any) => p.policial.passaporte === usuario?.passaporte,
                      ).length
                    }
                  </div>
                  <p className={`text-sm ${isColthProfile ? "text-pink-300" : "text-gray-400"}`}>Prisões Realizadas</p>
                </div>
                <div className={`text-center p-4 rounded-lg ${isColthProfile ? "bg-purple-800/60" : "bg-gray-800"}`}>
                  <div className={`text-2xl font-bold ${isColthProfile ? "text-pink-400" : "text-green-400"}`}>
                    $
                    {JSON.parse(sessionStorage.getItem("avenue_prisoes") || "[]")
                      .filter((p: any) => p.policial.passaporte === usuario?.passaporte)
                      .reduce((acc: number, p: any) => acc + (p.totais?.multaFinal || 0), 0)
                      .toLocaleString()}
                  </div>
                  <p className={`text-sm ${isColthProfile ? "text-pink-300" : "text-gray-400"}`}>Total Arrecadado</p>
                </div>
                <div className={`text-center p-4 rounded-lg ${isColthProfile ? "bg-purple-800/60" : "bg-gray-800"}`}>
                  <div className={`text-2xl font-bold ${isColthProfile ? "text-pink-400" : "text-orange-400"}`}>
                    {JSON.parse(sessionStorage.getItem("avenue_prisoes") || "[]")
                      .filter((p: any) => p.policial.passaporte === usuario?.passaporte)
                      .reduce((acc: number, p: any) => acc + (p.totais?.prisaoFinal || 0), 0)}
                  </div>
                  <p className={`text-sm ${isColthProfile ? "text-pink-300" : "text-gray-400"}`}>Meses de Prisão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Special message for Colth */}
        {isColthProfile && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 rounded-full shadow-lg">
              <Heart className="h-5 w-5 text-white animate-pulse" />
              <span className="text-white font-medium">Feito com amor para você! 💕</span>
              <Heart className="h-5 w-5 text-white animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
