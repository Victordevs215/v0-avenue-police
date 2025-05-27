// Sistema de banco de dados usando APENAS Supabase
import {
  usuarioService,
  prisaoService,
  setupRealtimeSubscriptions,
  type DatabaseUsuario,
  type DatabasePrisao,
} from "./supabase"
import type { Usuario, Prisao } from "@/types/auth"

class DatabaseService {
  private static instance: DatabaseService
  private cache: Map<string, any> = new Map()
  private realtimeCleanup: (() => void) | null = null
  private isInitialized = false

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  constructor() {
    this.setupRealtime()
  }

  // Configurar escuta em tempo real
  private setupRealtime() {
    if (this.realtimeCleanup) return

    this.realtimeCleanup = setupRealtimeSubscriptions(
      (payload) => {
        console.log("🔄 Usuário alterado em tempo real:", payload)
        this.cache.delete("usuarios")
        // Disparar evento para componentes React
        window.dispatchEvent(new CustomEvent("avenue_usuarios_changed", { detail: payload }))
      },
      (payload) => {
        console.log("🔄 Prisão alterada em tempo real:", payload)
        this.cache.delete("prisoes")
        // Disparar evento para componentes React
        window.dispatchEvent(new CustomEvent("avenue_prisoes_changed", { detail: payload }))
      },
    )
  }

  // Converter tipos do banco para tipos da aplicação
  private convertUsuario(dbUsuario: DatabaseUsuario): Usuario {
    return {
      id: dbUsuario.id,
      nome: dbUsuario.nome,
      passaporte: dbUsuario.passaporte,
      senha: dbUsuario.senha,
      tipo: dbUsuario.tipo,
      fotoPerfil: dbUsuario.foto_perfil,
      idade: dbUsuario.idade,
      patente: dbUsuario.patente,
      criadoEm: dbUsuario.criado_em,
      ativo: dbUsuario.ativo,
    }
  }

  private convertPrisao(dbPrisao: DatabasePrisao): Prisao {
    return {
      id: dbPrisao.id,
      numeroPrisao: dbPrisao.numero_prisao,
      acusado: {
        nome: dbPrisao.acusado_nome,
        passaporte: dbPrisao.acusado_passaporte,
        foto: dbPrisao.acusado_foto,
      },
      policial: {
        nome: dbPrisao.policial_nome,
        passaporte: dbPrisao.policial_passaporte,
      },
      advogado: dbPrisao.advogado_nome
        ? {
            nome: dbPrisao.advogado_nome,
            passaporte: dbPrisao.advogado_passaporte!,
          }
        : undefined,
      crimes: dbPrisao.crimes,
      totais: dbPrisao.totais,
      reducoes: dbPrisao.reducoes,
      observacoes: dbPrisao.observacoes,
      imagemPreso: dbPrisao.imagem_preso,
      dataHora: dbPrisao.data_hora,
    }
  }

  // Métodos para usuários
  async getUsuarios(): Promise<Usuario[]> {
    try {
      console.log("📊 Buscando usuários do banco...")
      const dbUsuarios = await usuarioService.getAll()
      const usuarios = dbUsuarios.map(this.convertUsuario)

      console.log(`✅ ${usuarios.length} usuários carregados do banco`)
      this.cache.set("usuarios", usuarios)
      return usuarios
    } catch (error) {
      console.error("❌ Erro ao buscar usuários:", error)
      throw error
    }
  }

  async createUsuario(usuario: Omit<Usuario, "id" | "criadoEm">): Promise<Usuario> {
    try {
      console.log("➕ Criando usuário no banco:", usuario.nome)

      const dbUsuario = await usuarioService.create({
        nome: usuario.nome,
        passaporte: usuario.passaporte,
        senha: usuario.senha,
        tipo: usuario.tipo,
        foto_perfil: usuario.fotoPerfil,
        idade: usuario.idade,
        patente: usuario.patente,
        ativo: usuario.ativo,
      })

      const novoUsuario = this.convertUsuario(dbUsuario)
      this.cache.delete("usuarios")

      console.log("✅ Usuário criado com sucesso:", novoUsuario.id)
      return novoUsuario
    } catch (error) {
      console.error("❌ Erro ao criar usuário:", error)
      throw error
    }
  }

  async updateUsuario(id: string, updates: Partial<Usuario>): Promise<Usuario> {
    try {
      console.log("🔄 Atualizando usuário no banco:", id)

      const dbUpdates: Partial<DatabaseUsuario> = {}

      if (updates.nome) dbUpdates.nome = updates.nome
      if (updates.passaporte) dbUpdates.passaporte = updates.passaporte
      if (updates.senha) dbUpdates.senha = updates.senha
      if (updates.tipo) dbUpdates.tipo = updates.tipo
      if (updates.fotoPerfil !== undefined) dbUpdates.foto_perfil = updates.fotoPerfil
      if (updates.idade !== undefined) dbUpdates.idade = updates.idade
      if (updates.patente !== undefined) dbUpdates.patente = updates.patente
      if (updates.ativo !== undefined) dbUpdates.ativo = updates.ativo

      const dbUsuario = await usuarioService.update(id, dbUpdates)
      const usuarioAtualizado = this.convertUsuario(dbUsuario)

      this.cache.delete("usuarios")
      console.log("✅ Usuário atualizado com sucesso")
      return usuarioAtualizado
    } catch (error) {
      console.error("❌ Erro ao atualizar usuário:", error)
      throw error
    }
  }

  async deleteUsuario(id: string): Promise<void> {
    try {
      console.log("🗑️ Deletando usuário do banco:", id)
      await usuarioService.delete(id)
      this.cache.delete("usuarios")
      console.log("✅ Usuário deletado com sucesso")
    } catch (error) {
      console.error("❌ Erro ao deletar usuário:", error)
      throw error
    }
  }

  async passaporteExists(passaporte: string): Promise<boolean> {
    try {
      const usuario = await usuarioService.findByPassaporte(passaporte)
      return usuario !== null
    } catch (error) {
      console.error("❌ Erro ao verificar passaporte:", error)
      return false
    }
  }

  async authenticate(passaporte: string, senha: string): Promise<Usuario | null> {
    try {
      console.log("🔐 Autenticando usuário:", passaporte)
      const dbUsuario = await usuarioService.authenticate(passaporte, senha)

      if (dbUsuario) {
        console.log("✅ Autenticação bem-sucedida")
        return this.convertUsuario(dbUsuario)
      } else {
        console.log("❌ Credenciais inválidas")
        return null
      }
    } catch (error) {
      console.error("❌ Erro na autenticação:", error)
      return null
    }
  }

  // Métodos para prisões
  async getPrisoes(): Promise<Prisao[]> {
    try {
      console.log("📊 Buscando prisões do banco...")
      const dbPrisoes = await prisaoService.getAll()
      const prisoes = dbPrisoes.map(this.convertPrisao)

      console.log(`✅ ${prisoes.length} prisões carregadas do banco`)
      this.cache.set("prisoes", prisoes)
      return prisoes
    } catch (error) {
      console.error("❌ Erro ao buscar prisões:", error)
      throw error
    }
  }

  async createPrisao(prisao: Omit<Prisao, "id" | "numeroPrisao">): Promise<Prisao> {
    try {
      console.log("➕ Criando prisão no banco...")

      const dbPrisao = await prisaoService.create({
        acusado_nome: prisao.acusado.nome,
        acusado_passaporte: prisao.acusado.passaporte,
        acusado_foto: prisao.acusado.foto,
        policial_nome: prisao.policial.nome,
        policial_passaporte: prisao.policial.passaporte,
        advogado_nome: prisao.advogado?.nome,
        advogado_passaporte: prisao.advogado?.passaporte,
        crimes: prisao.crimes,
        totais: prisao.totais,
        reducoes: prisao.reducoes,
        observacoes: prisao.observacoes,
        imagem_preso: prisao.imagemPreso,
        data_hora: prisao.dataHora,
      })

      const novaPrisao = this.convertPrisao(dbPrisao)
      this.cache.delete("prisoes")

      console.log("✅ Prisão criada com sucesso:", novaPrisao.numeroPrisao)
      return novaPrisao
    } catch (error) {
      console.error("❌ Erro ao criar prisão:", error)
      throw error
    }
  }

  async getContadorPrisoes(passaporte: string): Promise<number> {
    try {
      const contador = await prisaoService.getContador(passaporte)
      console.log(`📊 Contador de prisões para ${passaporte}: ${contador}`)
      return contador
    } catch (error) {
      console.error("❌ Erro ao obter contador:", error)
      return 0
    }
  }

  // Forçar atualização do cache
  async forceSync(): Promise<void> {
    console.log("🔄 Forçando sincronização...")
    this.cache.clear()
    await Promise.all([this.getUsuarios(), this.getPrisoes()])
    console.log("✅ Sincronização completa")
  }

  // Limpar cache
  clearCache() {
    console.log("🧹 Limpando cache...")
    this.cache.clear()
  }

  // Parar escuta em tempo real
  stopRealtime() {
    if (this.realtimeCleanup) {
      console.log("🔌 Parando realtime...")
      this.realtimeCleanup()
      this.realtimeCleanup = null
    }
  }

  // Verificar conexão com Supabase
  async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await usuarioService.getAll()
      const connected = !error
      console.log(`🌐 Conexão com banco: ${connected ? "✅ Online" : "❌ Offline"}`)
      return connected
    } catch (error) {
      console.log("🌐 Conexão com banco: ❌ Offline")
      return false
    }
  }

  // Inicializar dados padrão
  async initializeDefaultData(): Promise<void> {
    try {
      console.log("🚀 Inicializando dados padrão...")

      // Verificar se usuário Colth existe
      const colthExists = await this.passaporteExists("2")

      if (!colthExists) {
        console.log("➕ Criando usuário padrão Colth...")
        await this.createUsuario({
          nome: "Colth",
          passaporte: "2",
          senha: "Colthrandola12",
          tipo: "dev",
          ativo: true,
        })
        console.log("✅ Usuário Colth criado")
      } else {
        console.log("✅ Usuário Colth já existe")
      }
    } catch (error) {
      console.error("❌ Erro ao inicializar dados padrão:", error)
    }
  }
}

export const db = DatabaseService.getInstance()
