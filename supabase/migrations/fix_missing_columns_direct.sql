-- Script diretto per aggiungere le colonne mancanti
-- ATTENZIONE: Eseguire solo se le colonne NON esistono già

-- Aggiungi actual_hours alla tabella topics
ALTER TABLE public.topics 
ADD COLUMN IF NOT EXISTS actual_hours NUMERIC DEFAULT 0;

-- Aggiungi actual_hours alla tabella homework  
ALTER TABLE public.homework 
ADD COLUMN IF NOT EXISTS actual_hours NUMERIC DEFAULT 0;

-- Aggiungi altre colonne potenzialmente mancanti in topics
ALTER TABLE public.topics 
ADD COLUMN IF NOT EXISTS marked_for_exam BOOLEAN DEFAULT FALSE;

ALTER TABLE public.topics 
ADD COLUMN IF NOT EXISTS exam_ids TEXT[] DEFAULT '{}';

ALTER TABLE public.topics 
ADD COLUMN IF NOT EXISTS resources TEXT[] DEFAULT '{}';

ALTER TABLE public.topics 
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMPTZ;

-- Aggiungi colonne mancanti in homework
ALTER TABLE public.homework 
ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';

ALTER TABLE public.homework 
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMPTZ;

-- Aggiorna valori NULL a default
UPDATE public.topics SET actual_hours = 0 WHERE actual_hours IS NULL;
UPDATE public.homework SET actual_hours = 0 WHERE actual_hours IS NULL;
UPDATE public.topics SET marked_for_exam = FALSE WHERE marked_for_exam IS NULL;
UPDATE public.topics SET exam_ids = '{}' WHERE exam_ids IS NULL;
UPDATE public.topics SET resources = '{}' WHERE resources IS NULL;
UPDATE public.homework SET attachments = '{}' WHERE attachments IS NULL;