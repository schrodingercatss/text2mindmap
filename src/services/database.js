import { supabase } from '../lib/supabase';

// ============================================
// User Settings Operations
// ============================================

export const getApiSettings = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Return defaults if not logged in
            return getDefaultSettings();
        }

        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error fetching settings:', error);
            return getDefaultSettings();
        }

        if (!data) {
            return getDefaultSettings();
        }

        return {
            apiKey: data.api_key || '',
            baseUrl: data.base_url || 'https://api.openai.com/v1',
            modelName: data.model_name || 'gpt-4o',
            paperReadingModelName: data.paper_reading_model_name || 'gemini-2.5-pro-thinking',
            systemPrompt: data.system_prompt || '',
            paperReadingPrompt: data.paper_reading_prompt || '',
            outputLanguage: data.output_language || 'zh',
            iconColorPreference: data.icon_color_preference || 'random',
        };
    } catch (err) {
        console.error('Error in getApiSettings:', err);
        return getDefaultSettings();
    }
};

export const saveApiSettings = async (settings) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('User not authenticated');
            return null;
        }

        const settingsData = {
            user_id: user.id,
            api_key: settings.apiKey,
            base_url: settings.baseUrl,
            model_name: settings.modelName,
            paper_reading_model_name: settings.paperReadingModelName,
            system_prompt: settings.systemPrompt,
            paper_reading_prompt: settings.paperReadingPrompt,
            output_language: settings.outputLanguage,
            icon_color_preference: settings.iconColorPreference,
        };

        const { data, error } = await supabase
            .from('user_settings')
            .upsert(settingsData, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error('Error saving settings:', error);
            throw error;
        }

        return data;
    } catch (err) {
        console.error('Error in saveApiSettings:', err);
        throw err;
    }
};

// ============================================
// Mind Maps Operations
// ============================================

export const getMindMaps = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return [];
        }

        const { data, error } = await supabase
            .from('mind_maps')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching mind maps:', error);
            return [];
        }

        // Transform to match the expected format
        return data.map(map => ({
            id: map.id,
            title: map.title,
            originalFilename: map.original_filename,
            data: map.data,
            processSteps: map.process_steps,
            paperNotes: map.paper_notes,
            mode: map.mode,
            modelName: map.model_name,
            fileType: map.file_type,
            iconColor: map.icon_color,
            createdAt: map.created_at,
            updatedAt: map.updated_at,
        }));
    } catch (err) {
        console.error('Error in getMindMaps:', err);
        return [];
    }
};

export const getMindMapById = async (id) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return null;
        }

        const { data, error } = await supabase
            .from('mind_maps')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching mind map:', error);
            return null;
        }

        return {
            id: data.id,
            title: data.title,
            originalFilename: data.original_filename,
            data: data.data,
            processSteps: data.process_steps,
            paperNotes: data.paper_notes,
            mode: data.mode,
            modelName: data.model_name,
            fileType: data.file_type,
            iconColor: data.icon_color,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    } catch (err) {
        console.error('Error in getMindMapById:', err);
        return null;
    }
};

export const saveMindMap = async (mapData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const dbData = {
            user_id: user.id,
            title: mapData.title,
            original_filename: mapData.originalFilename,
            data: mapData.data,
            process_steps: mapData.processSteps,
            paper_notes: mapData.paperNotes,
            mode: mapData.mode,
            model_name: mapData.modelName,
            file_type: mapData.fileType,
            icon_color: mapData.iconColor || getRandomColor(),
        };

        const { data, error } = await supabase
            .from('mind_maps')
            .insert(dbData)
            .select()
            .single();

        if (error) {
            console.error('Error saving mind map:', error);
            throw error;
        }

        return {
            id: data.id,
            title: data.title,
            originalFilename: data.original_filename,
            data: data.data,
            processSteps: data.process_steps,
            paperNotes: data.paper_notes,
            mode: data.mode,
            modelName: data.model_name,
            fileType: data.file_type,
            iconColor: data.icon_color,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    } catch (err) {
        console.error('Error in saveMindMap:', err);
        throw err;
    }
};

export const updateMindMap = async (id, updates) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const dbUpdates = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.data !== undefined) dbUpdates.data = updates.data;
        if (updates.processSteps !== undefined) dbUpdates.process_steps = updates.processSteps;
        if (updates.paperNotes !== undefined) dbUpdates.paper_notes = updates.paperNotes;
        if (updates.mode !== undefined) dbUpdates.mode = updates.mode;

        const { data, error } = await supabase
            .from('mind_maps')
            .update(dbUpdates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating mind map:', error);
            throw error;
        }

        return {
            id: data.id,
            title: data.title,
            data: data.data,
            processSteps: data.process_steps,
            paperNotes: data.paper_notes,
            mode: data.mode,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    } catch (err) {
        console.error('Error in updateMindMap:', err);
        throw err;
    }
};

export const deleteMindMap = async (id) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('mind_maps')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting mind map:', error);
            throw error;
        }

        return true;
    } catch (err) {
        console.error('Error in deleteMindMap:', err);
        throw err;
    }
};

// ============================================
// Helper Functions
// ============================================

const getDefaultSettings = () => ({
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o',
    paperReadingModelName: 'gemini-2.5-pro-thinking',
    systemPrompt: '',
    paperReadingPrompt: '',
    outputLanguage: 'zh',
    iconColorPreference: 'random',
});

const getRandomColor = () => {
    const colors = ['blue', 'green', 'orange', 'purple', 'pink', 'cyan', 'emerald', 'indigo'];
    return colors[Math.floor(Math.random() * colors.length)];
};
