-- Script completo per verificare e aggiungere tutte le colonne mancanti
-- Questo script può essere eseguito più volte in sicurezza

-- 1. Verifica e aggiungi colonne mancanti nella tabella topics
DO $$ 
BEGIN
    -- actual_hours
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'topics' 
                   AND column_name = 'actual_hours') THEN
        ALTER TABLE public.topics ADD COLUMN actual_hours NUMERIC DEFAULT 0;
    END IF;

    -- marked_for_exam (nel caso fosse mancante)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'topics' 
                   AND column_name = 'marked_for_exam') THEN
        ALTER TABLE public.topics ADD COLUMN marked_for_exam BOOLEAN DEFAULT FALSE;
    END IF;

    -- exam_ids (nel caso fosse mancante)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'topics' 
                   AND column_name = 'exam_ids') THEN
        ALTER TABLE public.topics ADD COLUMN exam_ids TEXT[] DEFAULT '{}';
    END IF;

    -- resources (nel caso fosse mancante)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'topics' 
                   AND column_name = 'resources') THEN
        ALTER TABLE public.topics ADD COLUMN resources TEXT[] DEFAULT '{}';
    END IF;

    -- completed_date (nel caso fosse mancante)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'topics' 
                   AND column_name = 'completed_date') THEN
        ALTER TABLE public.topics ADD COLUMN completed_date TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Verifica e aggiungi colonne mancanti nella tabella homework
DO $$ 
BEGIN
    -- actual_hours
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'homework' 
                   AND column_name = 'actual_hours') THEN
        ALTER TABLE public.homework ADD COLUMN actual_hours NUMERIC DEFAULT 0;
    END IF;

    -- attachments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'homework' 
                   AND column_name = 'attachments') THEN
        ALTER TABLE public.homework ADD COLUMN attachments TEXT[] DEFAULT '{}';
    END IF;

    -- completed_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'homework' 
                   AND column_name = 'completed_date') THEN
        ALTER TABLE public.homework ADD COLUMN completed_date TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Aggiorna i valori di default per i record esistenti
UPDATE public.topics 
SET actual_hours = 0 
WHERE actual_hours IS NULL;

UPDATE public.homework 
SET actual_hours = 0 
WHERE actual_hours IS NULL;

-- 4. Aggiungi commenti alle colonne per documentazione
COMMENT ON COLUMN public.topics.actual_hours IS 'Ore effettive di studio per questo argomento';
COMMENT ON COLUMN public.topics.marked_for_exam IS 'Se questo argomento è marcato per una verifica imminente';
COMMENT ON COLUMN public.topics.exam_ids IS 'Array degli ID delle verifiche che includono questo argomento';
COMMENT ON COLUMN public.topics.resources IS 'Array di risorse di studio per questo argomento';
COMMENT ON COLUMN public.topics.completed_date IS 'Data di completamento dello studio di questo argomento';

COMMENT ON COLUMN public.homework.actual_hours IS 'Ore effettive spese per completare questo compito';
COMMENT ON COLUMN public.homework.attachments IS 'Array di URL degli allegati del compito';
COMMENT ON COLUMN public.homework.completed_date IS 'Data di completamento del compito';