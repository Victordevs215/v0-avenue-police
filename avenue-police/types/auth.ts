export interface Usuario {
  id: string
  nome: string
  passaporte: string
  senha: string
  tipo: "policial" | "comando" | "advogado" | "dev"
  fotoPerfil?: string
  idade?: number
  patente?: string
  criadoEm: string
  ativo: boolean
}

export interface Prisao {
  id: string
  numeroPrisao: number
  acusado: {
    nome: string
    passaporte: string
    foto?: string
  }
  policial: {
    nome: string
    passaporte: string
  }
  advogado?: {
    nome: string
    passaporte: string
  }
  crimes: Array<{
    id: string
    article: string
    description: string
    fine: number
    penalty: number
    bail: number
  }>
  totais: {
    multaOriginal: number
    prisaoOriginal: number
    multaFinal: number
    prisaoFinal: number
    fianca: number
  }
  reducoes: {
    advogado: boolean
    cooperacao: boolean
  }
  observacoes?: string
  imagemPreso?: string
  dataHora: string
}

export interface DatabaseResponse<T> {
  success: boolean
  data?: T
  error?: string
}
