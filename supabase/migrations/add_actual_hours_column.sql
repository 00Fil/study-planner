-- Aggiungi la colonna actualHours alla tabella topics se non esiste già
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 
                   FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'topics' 
                   AND column_name = 'actual_hours') THEN
        ALTER TABLE public.topics 
        ADD COLUMN actual_hours NUMERIC DEFAULT 0;
        
        COMMENT ON COLUMN public.topics.actual_hours IS 'Ore effettive di studio per questo argomento';
    END IF;
END $$;

-- Aggiorna la colonna actualHours con un valore di default per i record esistenti
UPDATE public.topics 
SET actual_hours = 0 
WHERE actual_hours IS NULL;