"use client"

import { useState, useEffect, useRef } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  Users,
  Database,
  UserPlus,
  Eye,
  EyeOff,
  Wifi,
  Camera,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { criminalArticles, type CriminalArticle } from "../types/criminal-articles"
import type { Usuario } from "../types/auth"
import { db } from "../lib/database"
import { supabase } from "../lib/supabaseClient" // ajuste o caminho conforme seu projeto
import Image from "next/image"

interface PainelAdminProps {
  onVoltar: () => void
}

export default function PainelAdmin({ onVoltar }: PainelAdminProps) {
  const { usuario } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [artigos, setArtigos] = useState<CriminalArticle[]>(criminalArticles)
  const [editandoArtigo, setEditandoArtigo] = useState<CriminalArticle | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"online" | "offline" | "syncing">("online")
  const [novoArtigo, setNovoArtigo] = useState<Partial<CriminalArticle>>({
    article: "",
    description: "",
    penalty: 0,
    fine: 0,
    bail: 0,
  })
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    passaporte: "",
    senha: "",
    tipo: "" as "policial" | "comando" | "advogado" | "dev",
  })
  const [notification, setNotification] = useState<{ tipo: "sucesso" | "erro" | null; mensagem: string }>({
    tipo: null,
    mensagem: "",
  })
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null)
  const [senhaAtual, setSenhaAtual] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setSyncStatus("syncing")
      const usuariosData = await db.getUsuarios()
      setUsuarios(usuariosData)
      setSyncStatus("online")
    } catch (error) {
      console.error("Error loading data:", error)
      setSyncStatus("offline")
    }
  }

  const showNotification = (tipo: "sucesso" | "erro", mensagem: string) => {
    setNotification({ tipo, mensagem })
    setTimeout(() => setNotification({ tipo: null, mensagem: "" }), 3000)
  }

  const formatarNome = (valor: string) => {
    return valor.replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
  }

  const formatarPassaporte = (valor: string) => {
    const numeros = valor.replace(/\D/g, "")
    return numeros.slice(0, 12)
  }

  const validarPassaporte = (passaporte: string) => {
    return passaporte.length >= 1 && passaporte.length <= 12 && /^\d+$/.test(passaporte)
  }

  const criarUsuario = async () => {
    if (!novoUsuario.nome || !novoUsuario.passaporte || !novoUsuario.senha || !novoUsuario.tipo) {
      showNotification("erro", "Preencha todos os campos")
      return
    }

    if (novoUsuario.nome.length < 3) {
      showNotification("erro", "O nome deve ter pelo menos 3 caracteres")
      return
    }

    if (!validarPassaporte(novoUsuario.passaporte)) {
      showNotification("erro", "Passaporte deve ter entre 1 e 12 dígitos")
      return
    }

    if (novoUsuario.senha.length < 6) {
      showNotification("erro", "A senha deve ter pelo menos 6 caracteres")
      return
    }

    try {
      // Check if passport already exists
      const passaporteExiste = await db.passaporteExists(novoUsuario.passaporte)
      if (passaporteExiste) {
        showNotification("erro", "Passaporte já cadastrado")
        return
      }

      const usuario: Omit<Usuario, "id" | "criadoEm"> = {
        nome: novoUsuario.nome,
        passaporte: novoUsuario.passaporte,
        senha: novoUsuario.senha,
        tipo: novoUsuario.tipo,
        ativo: true,
      }

      await db.createUsuario(usuario)
      await loadData()

      setNovoUsuario({ nome: "", passaporte: "", senha: "", tipo: "" as any })
      showNotification("sucesso", "Usuário criado com sucesso!")
    } catch (error) {
      showNotification("erro", "Erro ao criar usuário")
    }
  }

  const salvarArtigo = () => {
    if (!novoArtigo.article || !novoArtigo.description) {
      showNotification("erro", "Preencha todos os campos obrigatórios")
      return
    }

    const id = `art-custom-${Date.now()}`
    const artigo: CriminalArticle = {
      id,
      article: novoArtigo.article!,
      description: novoArtigo.description!,
      penalty: novoArtigo.penalty || 0,
      fine: novoArtigo.fine || 0,
      bail: novoArtigo.bail || 0,
    }

    setArtigos([...artigos, artigo])
    setNovoArtigo({ article: "", description: "", penalty: 0, fine: 0, bail: 0 })
    showNotification("sucesso", "Artigo adicionado com sucesso!")
  }

  const editarArtigo = (artigo: CriminalArticle) => {
    setEditandoArtigo(artigo)
  }

  const salvarEdicao = () => {
    if (!editandoArtigo) return

    const artigosAtualizados = artigos.map((a) => (a.id === editandoArtigo.id ? editandoArtigo : a))
    setArtigos(artigosAtualizados)
    setEditandoArtigo(null)
    showNotification("sucesso", "Artigo atualizado com sucesso!")
  }

  const removerArtigo = (id: string) => {
    if (confirm("Tem certeza que deseja remover este artigo?")) {
      setArtigos(artigos.filter((a) => a.id !== id))
      showNotification("sucesso", "Artigo removido com sucesso!")
    }
  }

  const alterarStatusUsuario = async (id: string, ativo: boolean) => {
    try {
      await db.updateUsuario(id, { ativo })
      await loadData()
      showNotification("sucesso", `Usuário ${ativo ? "ativado" : "desativado"} com sucesso!`)
    } catch (error) {
      showNotification("erro", "Erro ao alterar status do usuário")
    }
  }

  const removerUsuario = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      try {
        await db.deleteUsuario(id)
        await loadData()
        showNotification("sucesso", "Usuário removido com sucesso!")
      } catch (error) {
        showNotification("erro", "Erro ao remover usuário")
      }
    }
  }

  const exportarDados = async () => {
    try {
      const usuarios = await db.getUsuarios()
      const prisoes = await db.getPrisoes()

      const dados = {
        usuarios,
        artigos,
        prisoes,
        timestamp: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `backup-avenue-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showNotification("sucesso", "Backup exportado com sucesso!")
    } catch (error) {
      showNotification("erro", "Erro ao exportar backup")
    }
  }

  const limparDados = () => {
    if (confirm("ATENÇÃO: Isso irá apagar TODOS os dados do sistema. Tem certeza?")) {
      if (confirm("Esta ação é IRREVERSÍVEL. Confirma novamente?")) {
        try {
          sessionStorage.clear()
          db.clearCache()
          setUsuarios([])
          showNotification("sucesso", "Todos os dados foram limpos!")
        } catch (error) {
          showNotification("erro", "Erro ao limpar dados")
        }
      }
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "policial":
        return "👮"
      case "comando":
        return "👑"
      case "advogado":
        return "⚖️"
      case "dev":
        return "💻"
      default:
        return "👤"
    }
  }

  const getSyncIcon = () => {
    switch (syncStatus) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-400" />
      case "syncing":
        return <Wifi className="h-4 w-4 text-yellow-400 animate-pulse" />
      case "offline":
        return <Wifi className="h-4 w-4 text-red-400" />
    }
  }

  const salvarEdicaoUsuario = async () => {
    if (!editandoUsuario) return
    if (!editandoUsuario.nome || !editandoUsuario.passaporte || !editandoUsuario.tipo) {
      showNotification("erro", "Preencha todos os campos obrigatórios")
      return
    }
    if (editandoUsuario.nome.length < 3) {
      showNotification("erro", "O nome deve ter pelo menos 3 caracteres")
      return
    }
    if (!validarPassaporte(editandoUsuario.passaporte)) {
      showNotification("erro", "Passaporte deve ter entre 1 e 12 dígitos")
      return
    }
    if (!senhaAtual || senhaAtual !== usuarios.find(u => u.id === editandoUsuario.id)?.senha) {
      showNotification("erro", "Digite corretamente a senha atual para confirmar")
      return
    }

    try {
      const usuarioOriginal = usuarios.find(u => u.id === editandoUsuario.id)
      if (!usuarioOriginal) {
        showNotification("erro", "Usuário não encontrado")
        return
      }

      const updates: any = {}
      if (editandoUsuario.nome !== usuarioOriginal.nome) updates.nome = editandoUsuario.nome
      if (editandoUsuario.passaporte !== usuarioOriginal.passaporte) updates.passaporte = editandoUsuario.passaporte
      if (editandoUsuario.tipo !== usuarioOriginal.tipo) updates.tipo = editandoUsuario.tipo
      if ((editandoUsuario.patente || "") !== (usuarioOriginal.patente || "")) updates.patente = editandoUsuario.patente || ""
      // Troque de 'foto' para 'fotoPerfil'
      if ((editandoUsuario.foto || "") !== (usuarioOriginal.foto || "")) updates.fotoPerfil = editandoUsuario.foto

      // Só envia senha se foi preenchida e diferente da original
      if (editandoUsuario.senha && editandoUsuario.senha.length >= 6 && editandoUsuario.senha !== usuarioOriginal.senha) {
        updates.senha = editandoUsuario.senha
      }

      if (Object.keys(updates).length > 0) {
        await db.updateUsuario(editandoUsuario.id, updates)
        await loadData()
        showNotification("sucesso", "Usuário atualizado com sucesso!")
      } else {
        showNotification("sucesso", "Nada para atualizar!")
      }
      setEditandoUsuario(null)
      setSenhaAtual("")
    } catch (error) {
      showNotification("erro", "Erro ao atualizar usuário")
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={onVoltar} className="bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Image src="/avenue-logo.gif" alt="Avenue Logo" width={80} height={40} className="object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
              <p className="text-[#26C6DA]">Gerenciamento completo do sistema</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {getSyncIcon()}
              <span className="text-xs text-gray-400 capitalize">{syncStatus}</span>
            </div>
            <p className="text-white font-medium">{usuario?.nome}</p>
            <p className="text-orange-400 text-sm">👑 Desenvolvedor</p>
          </div>
        </div>

        {/* Notification */}
        {notification.tipo && (
          <div
            className={`p-4 rounded-lg border ${
              notification.tipo === "sucesso"
                ? "bg-green-900/90 border-green-700 text-green-100"
                : "bg-red-900/90 border-red-700 text-red-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${notification.tipo === "sucesso" ? "bg-green-400" : "bg-red-400"}`}
              ></div>
              <span className="text-sm font-medium">{notification.mensagem}</span>
            </div>
          </div>
        )}

        {/* Quick Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Usuários</CardTitle>
              <Users className="h-4 w-4 text-[#26C6DA]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{usuarios.length}</div>
              <p className="text-xs text-gray-400">{usuarios.filter((u) => u.ativo).length} ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Artigos</CardTitle>
              <Database className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{artigos.length}</div>
              <p className="text-xs text-gray-400">Código penal</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Prisões</CardTitle>
              <Database className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {JSON.parse(sessionStorage.getItem("avenue_prisoes") || "[]").length}
              </div>
              <p className="text-xs text-gray-400">Registradas globalmente</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Sistema</CardTitle>
              <Settings className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">Global</div>
              <p className="text-xs text-gray-400">Sincronizado</p>
            </CardContent>
          </Card>
        </div>

        {/* Administration Tabs */}
        <Tabs defaultValue="usuarios" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="usuarios" className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-black">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger
              value="criar-conta"
              className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-black"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Conta
            </TabsTrigger>
            <TabsTrigger value="artigos" className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-black">
              <Database className="h-4 w-4 mr-2" />
              Artigos
            </TabsTrigger>
            <TabsTrigger value="sistema" className="data-[state=active]:bg-[#26C6DA] data-[state=active]:text-black">
              <Settings className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="criar-conta">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <UserPlus className="h-5 w-5 text-green-400" />
                  Criar Nova Conta
                </CardTitle>
                <CardDescription className="text-[#26C6DA]">
                  Criar contas para Comando, Advogado e Desenvolvedor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Nome Completo</Label>
                    <Input
                      value={novoUsuario.nome}
                      onChange={(e) =>
                        setNovoUsuario((prev) => ({
                          ...prev,
                          nome: formatarNome(e.target.value),
                        }))
                      }
                      placeholder="Digite o nome completo"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Passaporte (1-12 dígitos)</Label>
                    <Input
                      value={novoUsuario.passaporte}
                      onChange={(e) =>
                        setNovoUsuario((prev) => ({
                          ...prev,
                          passaporte: formatarPassaporte(e.target.value),
                        }))
                      }
                      placeholder="Digite apenas números"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Tipo de Acesso</Label>
                    <Select
                      value={novoUsuario.tipo}
                      onValueChange={(value: any) => setNovoUsuario((prev) => ({ ...prev, tipo: value }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="policial" className="text-white hover:bg-gray-700">
                          👮 Policial
                        </SelectItem>
                        <SelectItem value="comando" className="text-white hover:bg-gray-700">
                          👑 Comando
                        </SelectItem>
                        <SelectItem value="advogado" className="text-white hover:bg-gray-700">
                          ⚖️ Advogado
                        </SelectItem>
                        <SelectItem value="dev" className="text-white hover:bg-gray-700">
                          💻 Desenvolvedor
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Senha</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={novoUsuario.senha}
                        onChange={(e) => setNovoUsuario((prev) => ({ ...prev, senha: e.target.value }))}
                        placeholder="Digite a senha (mín. 6 caracteres)"
                        className="bg-gray-800 border-gray-600 text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={criarUsuario} className="w-full bg-green-600 hover:bg-green-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Conta
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Gerenciar Usuários</CardTitle>
                <CardDescription className="text-[#26C6DA]">
                  {usuarios.length} usuários registrados globalmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usuarios.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${user.ativo ? "bg-green-400" : "bg-red-400"}`}></div>
                        <div>
                          <p className="font-medium text-white flex items-center gap-2">
                            <span>{getTipoIcon(user.tipo)}</span>
                            {user.nome}
                          </p>
                          <p className="text-sm text-gray-400">Passaporte: {user.passaporte}</p>
                          <p className="text-xs text-[#26C6DA] capitalize">{user.tipo}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => alterarStatusUsuario(user.id, !user.ativo)}
                          size="sm"
                          className={`${user.ativo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white`}
                        >
                          {user.ativo ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          onClick={() => removerUsuario(user.id)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => setEditandoUsuario({ ...user, senha: "", foto: user.foto || "" })}
                          size="sm"
                          className="bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="artigos">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Add New Article */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Plus className="h-5 w-5 text-green-400" />
                    Adicionar Artigo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Artigo</Label>
                    <Input
                      value={novoArtigo.article}
                      onChange={(e) => setNovoArtigo((prev) => ({ ...prev, article: e.target.value }))}
                      placeholder="Ex: Art. 6.1"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Descrição</Label>
                    <Textarea
                      value={novoArtigo.description}
                      onChange={(e) => setNovoArtigo((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição do crime"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="text-white">Multa ($)</Label>
                      <Input
                        type="number"
                        value={novoArtigo.fine}
                        onChange={(e) => setNovoArtigo((prev) => ({ ...prev, fine: Number(e.target.value) }))}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Prisão (meses)</Label>
                      <Input
                        type="number"
                        value={novoArtigo.penalty}
                        onChange={(e) => setNovoArtigo((prev) => ({ ...prev, penalty: Number(e.target.value) }))}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Fiança ($)</Label>
                      <Input
                        type="number"
                        value={novoArtigo.bail}
                        onChange={(e) => setNovoArtigo((prev) => ({ ...prev, bail: Number(e.target.value) }))}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <Button onClick={salvarArtigo} className="w-full bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Artigo
                  </Button>
                </CardContent>
              </Card>

              {/* Articles List */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Artigos Existentes</CardTitle>
                  <CardDescription className="text-[#26C6DA]">{artigos.length} artigos no código penal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {artigos.map((artigo) => (
                      <div key={artigo.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-white">{artigo.article}</p>
                          <p className="text-sm text-gray-400">{artigo.description}</p>
                          <p className="text-xs text-[#26C6DA]">
                            ${artigo.fine.toLocaleString()} • {artigo.penalty}m •
                            {artigo.bail === -1 ? " Sem fiança" : ` $${artigo.bail.toLocaleString()}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => editarArtigo(artigo)}
                            size="sm"
                            className="bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => removerArtigo(artigo.id)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Edit Modal */}
            {editandoArtigo && (
              <Card className="bg-gray-900 border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white">Editando: {editandoArtigo.article}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white">Artigo</Label>
                      <Input
                        value={editandoArtigo.article}
                        onChange={(e) =>
                          setEditandoArtigo((prev) => (prev ? { ...prev, article: e.target.value } : null))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Descrição</Label>
                      <Input
                        value={editandoArtigo.description}
                        onChange={(e) =>
                          setEditandoArtigo((prev) => (prev ? { ...prev, description: e.target.value } : null))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Multa ($)</Label>
                      <Input
                        type="number"
                        value={editandoArtigo.fine}
                        onChange={(e) =>
                          setEditandoArtigo((prev) => (prev ? { ...prev, fine: Number(e.target.value) } : null))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Prisão (meses)</Label>
                      <Input
                        type="number"
                        value={editandoArtigo.penalty}
                        onChange={(e) =>
                          setEditandoArtigo((prev) => (prev ? { ...prev, penalty: Number(e.target.value) } : null))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Fiança ($)</Label>
                      <Input
                        type="number"
                        value={editandoArtigo.bail}
                        onChange={(e) =>
                          setEditandoArtigo((prev) => (prev ? { ...prev, bail: Number(e.target.value) } : null))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={salvarEdicao} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                    <Button
                      onClick={() => setEditandoArtigo(null)}
                      variant="outline"
                      className="border-gray-600 text-white"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sistema">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Backup e Restauração</CardTitle>
                  <CardDescription className="text-[#26C6DA]">Gerenciar dados do sistema global</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={exportarDados} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Database className="h-4 w-4 mr-2" />
                    Exportar Backup Global
                  </Button>
                  <Button
                    onClick={limparDados}
                    variant="outline"
                    className="w-full border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Todos os Dados
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Informações do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Versão:</span>
                    <span className="text-white">2.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sincronização:</span>
                    <span className="text-green-400">Global</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <div className="flex items-center gap-2">
                      {getSyncIcon()}
                      <span className="text-green-400 capitalize">{syncStatus}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Passaportes:</span>
                    <span className="text-white">1-12 dígitos</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit User Modal */}
        {editandoUsuario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="relative w-full max-w-xl mx-auto">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Editar Perfil: {editandoUsuario.nome}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    {/* Foto do usuário */}
                    <div className="flex flex-col items-center">
                      {editandoUsuario.foto ? (
                        <img
                          src={editandoUsuario.foto}
                          alt="Foto do usuário"
                          className="w-24 h-24 rounded-full object-cover border-2 border-[#26C6DA]"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl text-white">
                          {editandoUsuario.nome?.[0] || "?"}
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file && editandoUsuario) {
                            // Caminho único para cada usuário
                            const ext = file.name.split('.').pop()
                            const path = `usuarios/${editandoUsuario.id}/avatar.${ext}`

                            // Upload para o bucket 'avatars'
                            const { error } = await supabase.storage
                              .from('avatars')
                              .upload(path, file, { upsert: true })

                            if (!error) {
                              // Pega a URL pública
                              const { data } = supabase.storage.from('avatars').getPublicUrl(path)
                              setEditandoUsuario((prev) =>
                                prev ? { ...prev, foto: data.publicUrl } : prev
                              )
                            } else {
                              showNotification("erro", "Erro ao enviar imagem")
                            }
                          }
                        }}
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black mt-2"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white">ID</Label>
                      <Input
                        value={editandoUsuario.id}
                        readOnly
                        className="bg-gray-800 border-gray-600 text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Nome</Label>
                      <Input
                        value={editandoUsuario.nome}
                        onChange={(e) =>
                          setEditandoUsuario((prev) => prev ? { ...prev, nome: formatarNome(e.target.value) } : null)
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-white">Senha</Label>
                      <Input
                        type="text"
                        value={editandoUsuario.senha}
                        onChange={(e) =>
                          setEditandoUsuario((prev) => prev ? { ...prev, senha: e.target.value } : null)
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Patente</Label>
                      <Input
                        value={editandoUsuario.patente || ""}
                        onChange={(e) =>
                          setEditandoUsuario((prev) => prev ? { ...prev, patente: e.target.value } : null)
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Ex: Tenente, Soldado, etc."
                      />
                    </div>
                  </div>
                  {/* Campo para senha atual */}
                  <div className="space-y-2">o} className="bg-[#26C6DA] hover:bg-[#26C6DA]/80 text-black">
                    <Label className="text-white">Digite a senha atual para confirmar</Label>className="h-4 w-4 mr-2" />
                    <Input
                      type="password"n>
                      value={senhaAtual}
                      onChange={e => setSenhaAtual(e.target.value)}tEditandoUsuario(null)}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Senha atual" className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
                    />
                  </div>r
                  <div className="flex gap-2">tton>
                    <Button onClick={salvarEdicaoUsuario} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />dContent>
                      Salvarrd>
                    </Button>v>
                    <Button</div>
                      onClick={() => setEditandoUsuario(null)}
                      variant="outline"v>
                      className="bg-red-600 hover:bg-red-700 border-red-600 text-white" </div>
                    > )
                      Cancelar}
                    </Button>
                  </div>
