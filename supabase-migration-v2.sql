-- SmartDoc v2 Migration: Branding + Chat Logs
-- Run this in the Supabase SQL Editor after the initial setup

-- Add branding column to guides
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS branding jsonb DEFAULT '{}';
-- Shape: { "primaryColor": "#1a73e8", "logoUrl": "", "welcomeMessage": "" }

-- Chat logs table for conversation analytics
CREATE TABLE public.chat_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id uuid REFERENCES public.guides(id) ON DELETE CASCADE NOT NULL,
  user_message text NOT NULL,
  assistant_message text NOT NULL,
  citations jsonb DEFAULT '[]',
  mode text DEFAULT 'chat',
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_chat_logs_guide_id ON public.chat_logs(guide_id);

ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by API routes)
CREATE POLICY "Service role full access" ON public.chat_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Guide owners can view their own chat logs
CREATE POLICY "Owners view logs" ON public.chat_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.guides
      WHERE guides.id = chat_logs.guide_id
        AND guides.user_id = auth.uid()
    )
  );
