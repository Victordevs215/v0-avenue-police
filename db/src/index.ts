export interface Usuario {
  id: string;
  nome: string;
  passaporte: string;
  senha: string;
  tipo: "policial" | "comando" | "advogado" | "dev";
  ativo: boolean;
  criadoEm?: Date;
}

export interface CriminalArticle {
  id: string;
  article: string;
  description: string;
  penalty: number; // em meses
  fine: number; // em dólares
  bail: number; // em dólares, -1 se não houver fiança
}
