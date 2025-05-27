-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    passaporte VARCHAR(12) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('policial', 'comando', 'advogado', 'dev')) NOT NULL,
    foto_perfil TEXT,
    idade INTEGER,
    patente VARCHAR(100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ativo BOOLEAN DEFAULT true
);

-- Criar tabela de prisões
CREATE TABLE IF NOT EXISTS prisoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_prisao INTEGER NOT NULL,
    acusado_nome VARCHAR(255) NOT NULL,
    acusado_passaporte VARCHAR(12) NOT NULL,
    acusado_foto TEXT,
    policial_nome VARCHAR(255) NOT NULL,
    policial_passaporte VARCHAR(12) NOT NULL,
    advogado_nome VARCHAR(255),
    advogado_passaporte VARCHAR(12),
    crimes JSONB NOT NULL,
    totais JSONB NOT NULL,
    reducoes JSONB NOT NULL,
    observacoes TEXT,
    imagem_preso TEXT,
    data_hora VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_passaporte ON usuarios(passaporte);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

CREATE INDEX IF NOT EXISTS idx_prisoes_numero ON prisoes(numero_prisao);
CREATE INDEX IF NOT EXISTS idx_prisoes_policial ON prisoes(policial_passaporte);
CREATE INDEX IF NOT EXISTS idx_prisoes_acusado ON prisoes(acusado_passaporte);
CREATE INDEX IF NOT EXISTS idx_prisoes_data ON prisoes(created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE prisoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança (permitir acesso total por enquanto)
CREATE POLICY "Permitir acesso total aos usuários" ON usuarios
    FOR ALL USING (true);

CREATE POLICY "Permitir acesso total às prisões" ON prisoes
    FOR ALL USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela usuarios
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário padrão Colth se não existir
INSERT INTO usuarios (id, nome, passaporte, senha, tipo, criado_em, ativo)
VALUES (
    'colth-dev-default',
    'Colth',
    '2',
    'Colthrandola12',
    'dev',
    NOW(),
    true
)
ON CONFLICT (passaporte) DO NOTHING;
