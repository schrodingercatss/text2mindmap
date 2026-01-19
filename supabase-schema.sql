-- ============================================
-- text2mindmap Database Schema for Supabase
-- ============================================
-- Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor)

-- 1. User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    api_key TEXT,
    base_url TEXT DEFAULT 'https://api.openai.com/v1',
    model_name TEXT DEFAULT 'gpt-4o',
    paper_reading_model_name TEXT DEFAULT 'gemini-2.5-pro-thinking',
    system_prompt TEXT,
    pdf_system_prompt TEXT,
    paper_reading_prompt TEXT,
    output_language TEXT DEFAULT 'zh',
    icon_color_preference TEXT DEFAULT 'random',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Mind Maps Table
CREATE TABLE IF NOT EXISTS mind_maps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    original_filename TEXT,
    data JSONB,
    process_steps JSONB,
    paper_notes TEXT,
    mode TEXT DEFAULT 'mindmap',
    model_name TEXT,
    file_type TEXT,
    icon_color TEXT DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_maps ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_settings
CREATE POLICY "Users can view their own settings" 
    ON user_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
    ON user_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
    ON user_settings FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
    ON user_settings FOR DELETE 
    USING (auth.uid() = user_id);

-- 5. RLS Policies for mind_maps
CREATE POLICY "Users can view their own mind maps" 
    ON mind_maps FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mind maps" 
    ON mind_maps FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mind maps" 
    ON mind_maps FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mind maps" 
    ON mind_maps FOR DELETE 
    USING (auth.uid() = user_id);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_user_id ON mind_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_created_at ON mind_maps(created_at DESC);

-- 7. Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mind_maps_updated_at
    BEFORE UPDATE ON mind_maps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
