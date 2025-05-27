import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Variáveis de ambiente do Supabase não configuradas")
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para o banco de dados
export interface DatabaseUsuario {
  id: string
  nome: string
  passaporte: string
  senha: string
  tipo: "policial" | "comando" | "advogado" | "dev"
  foto_perfil?: string
  idade?: number
  patente?: string
  criado_em: string
  ativo: boolean
  updated_at?: string
}

export interface DatabasePrisao {
  id: string
  numero_prisao: number
  acusado_nome: string
  acusado_passaporte: string
  acusado_foto?: string
  policial_nome: string
  policial_passaporte: string
  advogado_nome?: string
  advogado_passaporte?: string
  crimes: any[]
  totais: any
  reducoes: any
  observacoes?: string
  imagem_preso?: string
  data_hora: string
  created_at?: string
}

// Funções para usuários
export const usuarioService = {
  async getAll(): Promise<DatabaseUsuario[]> {
    const { data, error } = await supabase.from("usuarios").select("*").order("criado_em", { ascending: false })

    if (error) {
      console.error("Erro ao buscar usuários:", error)
      throw error
    }
    return data || []
  },

  async create(usuario: Omit<DatabaseUsuario, "id" | "criado_em" | "updated_at">): Promise<DatabaseUsuario> {
    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        {
          ...usuario,
          criado_em: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar usuário:", error)
      throw error
    }
    return data
  },

  async update(id: string, updates: Partial<DatabaseUsuario>): Promise<DatabaseUsuario> {
    const { data, error } = await supabase
      .from("usuarios")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar usuário:", error)
      throw error
    }
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("usuarios").delete().eq("id", id)

    if (error) {
      console.error("Erro ao deletar usuário:", error)
      throw error
    }
  },

  async findByPassaporte(passaporte: string): Promise<DatabaseUsuario | null> {
    const { data, error } = await supabase.from("usuarios").select("*").eq("passaporte", passaporte).single()

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao buscar usuário por passaporte:", error)
      throw error
    }
    return data || null
  },

  async authenticate(passaporte: string, senha: string): Promise<DatabaseUsuario | null> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("passaporte", passaporte)
      .eq("senha", senha)
      .eq("ativo", true)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Erro na autenticação:", error)
      throw error
    }
    return data || null
  },
}

// Funções para prisões
export const prisaoService = {
  async getAll(): Promise<DatabasePrisao[]> {
    const { data, error } = await supabase.from("prisoes").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar prisões:", error)
      throw error
    }
    return data || []
  },

  async create(prisao: Omit<DatabasePrisao, "id" | "numero_prisao" | "created_at">): Promise<DatabasePrisao> {
    // Obter próximo número de prisão
    const { count } = await supabase.from("prisoes").select("*", { count: "exact", head: true })

    const numeroPrisao = (count || 0) + 1

    const { data, error } = await supabase
      .from("prisoes")
      .insert([
        {
          ...prisao,
          numero_prisao: numeroPrisao,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar prisão:", error)
      throw error
    }
    return data
  },

  async getByPolicial(passaporte: string): Promise<DatabasePrisao[]> {
    const { data, error } = await supabase
      .from("prisoes")
      .select("*")
      .eq("policial_passaporte", passaporte)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar prisões do policial:", error)
      throw error
    }
    return data || []
  },

  async getContador(passaporte: string): Promise<number> {
    const { count, error } = await supabase
      .from("prisoes")
      .select("*", { count: "exact", head: true })
      .eq("policial_passaporte", passaporte)

    if (error) {
      console.error("Erro ao obter contador:", error)
      throw error
    }
    return count || 0
  },
}

// Função para escutar mudanças em tempo real
export const setupRealtimeSubscriptions = (
  onUsuarioChange: (payload: any) => void,
  onPrisaoChange: (payload: any) => void,
) => {
  console.log("Configurando subscriptions em tempo real...")

  const usuarioSubscription = supabase
    .channel("usuarios_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "usuarios" }, (payload) => {
      console.log("Mudança em usuários:", payload)
      onUsuarioChange(payload)
    })
    .subscribe()

  const prisaoSubscription = supabase
    .channel("prisoes_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "prisoes" }, (payload) => {
      console.log("Mudança em prisões:", payload)
      onPrisaoChange(payload)
    })
    .subscribe()

  return () => {
    console.log("Desconectando subscriptions...")
    usuarioSubscription.unsubscribe()
    prisaoSubscription.unsubscribe()
  }
}
