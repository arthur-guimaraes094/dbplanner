-- Criação da tabela para armazenar os diagramas
CREATE TABLE public.diagrams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    nodes JSONB DEFAULT '[]'::jsonb NOT NULL,
    edges JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
-- Como estamos apenas começando, vamos criar uma política que permite acesso total 
-- (leitura, inserção, atualização, deleção) para usuários anônimos temporariamente
-- NOTA: Em um projeto de produção, você limitaria isso apenas a usuários autenticados.
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso total temporário" 
ON public.diagrams 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Função (Trigger) para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_diagrams_updated_at
BEFORE UPDATE ON public.diagrams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
