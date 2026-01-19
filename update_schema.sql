-- Run this in Supabase SQL Editor to fix the missing column
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS pdf_system_prompt TEXT;
