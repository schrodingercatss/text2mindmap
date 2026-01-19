import { DEFAULT_PAPER_READING_PROMPT } from './prompts';
import { supabase } from '../lib/supabase';
import { encryptData, decryptData } from './crypto';

const STORAGE_KEYS = {
  API_SETTINGS: 'mindmap_api_settings',
  MIND_MAPS: 'mindmap_saved_maps',
  SETTINGS_CACHE: 'mindmap_settings_cache',
};

// Settings cache for synchronous access
let settingsCache = null;

// ============================================
// Default Settings
// ============================================

const getDefaultSettings = () => ({
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  modelName: 'gemini-3-flash-preview',
  paperReadingModelName: 'gemini-2.5-pro-thinking',
  iconColorPreference: 'random',
  outputLanguage: 'zh',
  paperReadingPrompt: DEFAULT_PAPER_READING_PROMPT,
  systemPrompt: `You are an expert at analyzing meeting transcripts and structuring them into a visual mind map and process flow.

Your goal is to extract key topics, discussions, and action items and organize them into a specific JSON structure.

CRITICAL INSTRUCTIONS:
1. **Chronological Order**: Organize the main sections (Nodes) in the order they were discussed in the meeting.
2. **Detailed Content**: Do NOT use short keywords. Use complete sentences or detailed phrases to capture the full context and nuance of the discussion.
3. **Rich Structure**: Use the \"rich-card\" structure for complex topics that involve multiple sub-points, comparisons, or lists.

The output must be a JSON object with three keys: \"title\", \"mindMap\" and \"processFlow\".

1. \"title\": A concise, descriptive title for the content. Extract from the document/transcript if available, otherwise summarize one.

2. \"mindMap\": An array where each item represents a main section (Node).
   - \"theme\": Choose from 'orange', 'green', 'pink', 'cyan', 'blue'.
   - \"title\": The main topic of the section.
   - \"items\": An array of content items. Each item can be either a simple string OR a \"rich-card\" object.
   
   [Rich Card Structure]: Use this for complex topics with sub-points or comparisons.
   {
     \"type\": \"rich-card\",
     \"title\": \"Card Title (Optional)\",
     \"content\": \"Main description (Optional)\",
     \"subSections\": [
       {
         \"title\": \"Column/Sub-topic 1\",
         \"points\": [\"Detail A\", \"Detail B\"]
       },
       {
         \"title\": \"Column/Sub-topic 2\",
         \"points\": [\"Detail C\", \"Detail D\"]
       }
     ]
   }

   [Simple String]: Use \"Title: Content\" format for simple key-value pairs.

3. \"processFlow\": An array of steps representing the timeline or key process discussed.
   - \"title\": Short title of the step.
   - \"desc\": Brief description.
   - \"color\": Hex color code (e.g., #87CEFA, #FFB6C1, #90EE90).

Example JSON:
{
  \"title\": \"Q1 Product Planning Meeting\",
  \"mindMap\": [
    {
      \"theme\": \"orange\",
      \"title\": \"Project Goals\",
      \"items\": [
        \"Objective: Increase efficiency\",
        {
          \"type\": \"rich-card\",
          \"title\": \"Dataset Strategy\",
          \"subSections\": [
            { \"title\": \"Sources\", \"points\": [\"HuggingFace\", \"Common Crawl\"] },
            { \"title\": \"Validation\", \"points\": [\"Manual Review\", \"Automated Scripts\"] }
          ]
        }
      ]
    }
  ],
  \"processFlow\": [
    { \"title\": \"Kickoff\", \"desc\": \"Initial meeting\", \"color\": \"#87CEFA\" }
  ]
}

Analyze the text and return ONLY the raw JSON.`,
  pdfSystemPrompt: `You are an expert at analyzing documents and structuring them into a visual mind map and process flow.

Your goal is to extract key concepts, chapters, sections, and important details from the document and organize them into a specific JSON structure.

CRITICAL INSTRUCTIONS:
1. **Logical Structure**: Organize the content following the document's natural structure (chapters, sections, key points).
2. **Comprehensive Coverage**: Extract all significant information, not just summaries.
3. **Rich Structure**: Use the \"rich-card\" structure for complex topics with multiple sub-points.

The output must be a JSON object with three keys: \"title\", \"mindMap\" and \"processFlow\".

1. \"title\": A concise, descriptive title for the document. Extract from the document if available, otherwise summarize one.

2. \"mindMap\": An array where each item represents a main section (Node).
   - \"theme\": Choose from 'orange', 'green', 'pink', 'cyan', 'blue'.
   - \"title\": The main topic of the section.
   - \"items\": An array of content items. Each item can be either a simple string OR a \"rich-card\" object.
   
   [Rich Card Structure]: Use this for complex topics with sub-points or comparisons.
   {
     \"type\": \"rich-card\",
     \"title\": \"Card Title (Optional)\",
     \"content\": \"Main description (Optional)\",
     \"subSections\": [
       {
         \"title\": \"Column/Sub-topic 1\",
         \"points\": [\"Detail A\", \"Detail B\"]
       },
       {
         \"title\": \"Column/Sub-topic 2\",
         \"points\": [\"Detail C\", \"Detail D\"]
       }
     ]
   }

   [Simple String]: Use \"Title: Content\" format for simple key-value pairs.

3. \"processFlow\": An array of steps representing the document's key workflow or logical sequence.
   - \"title\": Short title of the step.
   - \"desc\": Brief description.
   - \"color\": Hex color code (e.g., #87CEFA, #FFB6C1, #90EE90).

Example JSON:
{
  \"title\": \"Machine Learning Fundamentals\",
  \"mindMap\": [
    {
      \"theme\": \"blue\",
      \"title\": \"Chapter 1: Introduction\",
      \"items\": [
        \"Overview: This document covers...\",
        {
          \"type\": \"rich-card\",
          \"title\": \"Key Definitions\",
          \"subSections\": [
            { \"title\": \"Term A\", \"points\": [\"Definition 1\", \"Example 1\"] },
            { \"title\": \"Term B\", \"points\": [\"Definition 2\", \"Example 2\"] }
          ]
        }
      ]
    }
  ],
  \"processFlow\": [
    { \"title\": \"Step 1\", \"desc\": \"Initial phase\", \"color\": \"#87CEFA\" }
  ]
}

Analyze the document and return ONLY the raw JSON.`
});

// ============================================
// Check if user is authenticated
// ============================================

const isAuthenticated = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
};

const getCurrentUser = async () => {
  try {
    console.log('getCurrentUser - fetching...');
    const { data: { user }, error } = await supabase.auth.getUser();
    if (user) {
      console.log('getCurrentUser - result:', user?.id || 'null');
      return user;
    }
    if (error) {
      console.warn('getCurrentUser - initial fetch failed:', error.message);
    }

    const session = await refreshSessionIfNeeded();
    if (!session) {
      console.log('getCurrentUser - result: null');
      return null;
    }

    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    console.log('getCurrentUser - result:', refreshedUser?.id || 'null');
    return refreshedUser;
  } catch (err) {
    console.error('getCurrentUser - error:', err);
    return null;
  }
};

const refreshSessionIfNeeded = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    const expiresAtMs = session?.expires_at ? session.expires_at * 1000 : null;
    const isExpired = expiresAtMs !== null && expiresAtMs <= Date.now() + 30000;

    if (session && !isExpired) {
      return session;
    }

    if (error) {
      console.warn('refreshSessionIfNeeded - getSession error:', error.message);
    }

    const { data, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('refreshSessionIfNeeded - refresh failed:', refreshError.message);
      return null;
    }

    return data.session ?? null;
  } catch (err) {
    console.error('refreshSessionIfNeeded - error:', err);
    return null;
  }
};

// ============================================
// API Settings - Hybrid (localStorage cache + Supabase)
// ============================================

// Synchronous getter (uses cache or localStorage)
export const getApiSettings = () => {
  // First try cache
  if (settingsCache) {
    return settingsCache;
  }

  // Then try localStorage cache
  const cached = localStorage.getItem(STORAGE_KEYS.SETTINGS_CACHE);
  if (cached) {
    try {
      settingsCache = JSON.parse(cached);
      return settingsCache;
    } catch {
      // Invalid cache, continue
    }
  }

  // Finally return defaults
  return getDefaultSettings();
};

// Async loader - call this on app init to populate cache from Supabase
export const loadApiSettings = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Not logged in, use localStorage or defaults
      const local = localStorage.getItem(STORAGE_KEYS.API_SETTINGS);
      if (local) {
        settingsCache = JSON.parse(local);
        return settingsCache;
      }
      return getDefaultSettings();
    }

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      return getDefaultSettings();
    }

    if (!data) {
      return getDefaultSettings();
    }

    // Map database fields to expected format
    const settings = {
      apiKey: decryptData(data.api_key) || '',
      baseUrl: data.base_url || 'https://api.openai.com/v1',
      modelName: data.model_name || 'gemini-3-flash-preview',
      paperReadingModelName: data.paper_reading_model_name || 'gemini-2.5-pro-thinking',
      systemPrompt: data.system_prompt || getDefaultSettings().systemPrompt,
      pdfSystemPrompt: data.pdf_system_prompt || getDefaultSettings().pdfSystemPrompt,
      paperReadingPrompt: data.paper_reading_prompt || DEFAULT_PAPER_READING_PROMPT,
      outputLanguage: data.output_language || 'zh',
      iconColorPreference: data.icon_color_preference || 'random',
    };

    // Cache it
    settingsCache = settings;
    localStorage.setItem(STORAGE_KEYS.SETTINGS_CACHE, JSON.stringify(settings));

    return settings;
  } catch (err) {
    console.error('Error in loadApiSettings:', err);
    return getDefaultSettings();
  }
};

// Save settings (to Supabase if logged in, otherwise localStorage)
export const saveApiSettings = async (settings) => {
  // Always update cache
  settingsCache = settings;
  localStorage.setItem(STORAGE_KEYS.SETTINGS_CACHE, JSON.stringify(settings));

  try {
    const user = await getCurrentUser();
    if (!user) {
      // Not logged in, save to localStorage only
      localStorage.setItem(STORAGE_KEYS.API_SETTINGS, JSON.stringify(settings));
      return settings;
    }

    // Save to Supabase
    const dbData = {
      user_id: user.id,
      api_key: encryptData(settings.apiKey),
      base_url: settings.baseUrl,
      model_name: settings.modelName,
      paper_reading_model_name: settings.paperReadingModelName,
      system_prompt: settings.systemPrompt,
      pdf_system_prompt: settings.pdfSystemPrompt,
      paper_reading_prompt: settings.paperReadingPrompt,
      output_language: settings.outputLanguage,
      icon_color_preference: settings.iconColorPreference,
    };

    const { error } = await supabase
      .from('user_settings')
      .upsert(dbData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving settings to Supabase:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      // Still saved to cache/localStorage
    }

    return settings;
  } catch (err) {
    console.error('Error in saveApiSettings:', err);
    return settings;
  }
};

// ============================================
// Mind Maps - Supabase first, localStorage fallback
// ============================================

const COLORS = ['blue', 'green', 'orange', 'purple', 'pink', 'cyan', 'emerald', 'indigo'];

export const saveMindMap = async (mindMap) => {
  const settings = getApiSettings();
  let iconColor = 'green';
  if (settings.iconColorPreference === 'random') {
    iconColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  } else if (settings.iconColorPreference) {
    iconColor = settings.iconColorPreference;
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      // Not logged in, use localStorage
      const maps = JSON.parse(localStorage.getItem(STORAGE_KEYS.MIND_MAPS) || '[]');
      const newMap = {
        ...mindMap,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        iconColor: iconColor
      };
      maps.push(newMap);
      localStorage.setItem(STORAGE_KEYS.MIND_MAPS, JSON.stringify(maps));
      return newMap;
    }

    // Save to Supabase
    const dbData = {
      user_id: user.id,
      title: mindMap.title,
      original_filename: mindMap.originalFilename,
      data: mindMap.data,
      process_steps: mindMap.processSteps,
      paper_notes: mindMap.paperNotes,
      mode: mindMap.mode,
      model_name: mindMap.modelName,
      file_type: mindMap.fileType,
      icon_color: iconColor,
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
    };
  } catch (err) {
    console.error('Error in saveMindMap:', err);
    throw err;
  }
};

export const getMindMaps = async (userId = null) => {
  try {
    // Use provided userId or fetch from supabase
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const user = await getCurrentUser();
      effectiveUserId = user?.id;
    }
    console.log('getMindMaps - Using user:', effectiveUserId || 'null');

    if (!effectiveUserId) {
      // Not logged in, use localStorage
      const maps = localStorage.getItem(STORAGE_KEYS.MIND_MAPS);
      return maps ? JSON.parse(maps) : [];
    }

    const session = await refreshSessionIfNeeded();
    console.log('getMindMaps - Session:', session ? 'valid' : 'null');
    if (!session) {
      console.warn('No valid session for authenticated user, skipping local fallback');
      return [];
    }

    const runQueryWithTimeout = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('getMindMaps - Aborting due to timeout');
        controller.abort();
      }, 10000);

      try {
        return await supabase
          .from('mind_maps')
          .select('*')
          .eq('user_id', effectiveUserId)
          .order('created_at', { ascending: false })
          .abortSignal(controller.signal);
      } catch (queryError) {
        if (queryError.name === 'AbortError') {
          console.error('Query aborted due to timeout');
        } else {
          console.error('Query error:', queryError);
        }
        return { data: null, error: queryError };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const isAuthError = (error) => {
      const status = Number(error?.status);
      return status === 401 || status === 403;
    };

    let { data, error } = await runQueryWithTimeout();
    if (error && isAuthError(error)) {
      console.warn('Auth error fetching mind maps, attempting session refresh');
      const refreshed = await supabase.auth.refreshSession();
      if (!refreshed.error) {
        const retry = await runQueryWithTimeout();
        data = retry.data;
        error = retry.error;
      }
    }

    console.log('getMindMaps - Result:', { count: data?.length, error: error?.message });

    if (error) {
      console.error('Error fetching mind maps:', error);
      return [];
    }

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
    }));
  } catch (err) {
    console.error('Error in getMindMaps:', err);
    return [];
  }
};

export const getMindMapById = async (id) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Not logged in, use localStorage
      const maps = JSON.parse(localStorage.getItem(STORAGE_KEYS.MIND_MAPS) || '[]');
      return maps.find(m => m.id === id) || null;
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
    };
  } catch (err) {
    console.error('Error in getMindMapById:', err);
    return null;
  }
};

export const deleteMindMap = async (id) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Not logged in, use localStorage
      const maps = JSON.parse(localStorage.getItem(STORAGE_KEYS.MIND_MAPS) || '[]');
      const newMaps = maps.filter(m => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.MIND_MAPS, JSON.stringify(newMaps));
      return true;
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

export const updateMindMap = async (id, updates) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Not logged in, use localStorage
      const maps = JSON.parse(localStorage.getItem(STORAGE_KEYS.MIND_MAPS) || '[]');
      const index = maps.findIndex(m => m.id === id);
      if (index !== -1) {
        maps[index] = { ...maps[index], ...updates };
        localStorage.setItem(STORAGE_KEYS.MIND_MAPS, JSON.stringify(maps));
        return maps[index];
      }
      return null;
    }

    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.data !== undefined) dbUpdates.data = updates.data;
    if (updates.processSteps !== undefined) dbUpdates.process_steps = updates.processSteps;
    if (updates.paperNotes !== undefined) dbUpdates.paper_notes = updates.paperNotes;

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
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Error in updateMindMap:', err);
    throw err;
  }
};

// ============================================
// Clear cache on logout
// ============================================

export const clearSettingsCache = () => {
  settingsCache = null;
  localStorage.removeItem(STORAGE_KEYS.SETTINGS_CACHE);
};
