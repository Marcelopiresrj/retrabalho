-- Create table manutencoes_campo
CREATE TABLE IF NOT EXISTS manutencoes_campo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estado TEXT,
    cidade TEXT,
    armario TEXT,
    splitter TEXT,
    nome_ci TEXT,
    categoria TEXT,
    subcategoria TEXT,
    sintoma TEXT,
    causa TEXT,
    cumplimento_sla TEXT,
    data_manutencao DATE,
    is_rework BOOLEAN DEFAULT false
);

-- Create critical indexes for performance
CREATE INDEX IF NOT EXISTS idx_manutencoes_campo_nome_ci ON manutencoes_campo (nome_ci);
CREATE INDEX IF NOT EXISTS idx_manutencoes_campo_data_manutencao ON manutencoes_campo (data_manutencao);

-- Disable RLS to allow webhook inserts (required if not using Service Role Key)
ALTER TABLE manutencoes_campo DISABLE ROW LEVEL SECURITY;