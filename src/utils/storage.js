import { DEFAULT_PAPER_READING_PROMPT } from './prompts';

const STORAGE_KEYS = {
  API_SETTINGS: 'mindmap_api_settings',
  MIND_MAPS: 'mindmap_saved_maps',
};

export const saveApiSettings = (settings) => {
  localStorage.setItem(STORAGE_KEYS.API_SETTINGS, JSON.stringify(settings));
};

export const getApiSettings = () => {
  const settings = localStorage.getItem(STORAGE_KEYS.API_SETTINGS);
  return settings ? JSON.parse(settings) : {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gemini-3-flash-preview',
    paperReadingModelName: 'gemini-2.5-pro-thinking',
    iconColorPreference: 'random',
    outputLanguage: 'zh', // 'zh' for Chinese, 'en' for English
    paperReadingPrompt: DEFAULT_PAPER_READING_PROMPT,
    systemPrompt: `You are an expert at analyzing meeting transcripts and structuring them into a visual mind map and process flow.

Your goal is to extract key topics, discussions, and action items and organize them into a specific JSON structure.

CRITICAL INSTRUCTIONS:
1. **Chronological Order**: Organize the main sections (Nodes) in the order they were discussed in the meeting.
2. **Detailed Content**: Do NOT use short keywords. Use complete sentences or detailed phrases to capture the full context and nuance of the discussion.
3. **Rich Structure**: Use the "rich-card" structure for complex topics that involve multiple sub-points, comparisons, or lists.

The output must be a JSON object with three keys: "title", "mindMap" and "processFlow".

1. "title": A concise, descriptive title for the content. Extract from the document/transcript if available, otherwise summarize one.

2. "mindMap": An array where each item represents a main section (Node).
   - "theme": Choose from 'orange', 'green', 'pink', 'cyan', 'blue'.
   - "title": The main topic of the section.
   - "items": An array of content items. Each item can be either a simple string OR a "rich-card" object.
   
   [Rich Card Structure]: Use this for complex topics with sub-points or comparisons.
   {
     "type": "rich-card",
     "title": "Card Title (Optional)",
     "content": "Main description (Optional)",
     "subSections": [
       {
         "title": "Column/Sub-topic 1",
         "points": ["Detail A", "Detail B"]
       },
       {
         "title": "Column/Sub-topic 2",
         "points": ["Detail C", "Detail D"]
       }
     ]
   }

   [Simple String]: Use "Title: Content" format for simple key-value pairs.

3. "processFlow": An array of steps representing the timeline or key process discussed.
   - "title": Short title of the step.
   - "desc": Brief description.
   - "color": Hex color code (e.g., #87CEFA, #FFB6C1, #90EE90).

Example JSON:
{
  "title": "Q1 Product Planning Meeting",
  "mindMap": [
    {
      "theme": "orange",
      "title": "Project Goals",
      "items": [
        "Objective: Increase efficiency",
        {
          "type": "rich-card",
          "title": "Dataset Strategy",
          "subSections": [
            { "title": "Sources", "points": ["HuggingFace", "Common Crawl"] },
            { "title": "Validation", "points": ["Manual Review", "Automated Scripts"] }
          ]
        }
      ]
    }
  ],
  "processFlow": [
    { "title": "Kickoff", "desc": "Initial meeting", "color": "#87CEFA" }
  ]
}

Analyze the text and return ONLY the raw JSON.`,
    pdfSystemPrompt: `You are an expert at analyzing documents and structuring them into a visual mind map and process flow.

Your goal is to extract key concepts, chapters, sections, and important details from the document and organize them into a specific JSON structure.

CRITICAL INSTRUCTIONS:
1. **Logical Structure**: Organize the content following the document's natural structure (chapters, sections, key points).
2. **Comprehensive Coverage**: Extract all significant information, not just summaries.
3. **Rich Structure**: Use the "rich-card" structure for complex topics with multiple sub-points.

The output must be a JSON object with three keys: "title", "mindMap" and "processFlow".

1. "title": A concise, descriptive title for the document. Extract from the document if available, otherwise summarize one.

2. "mindMap": An array where each item represents a main section (Node).
   - "theme": Choose from 'orange', 'green', 'pink', 'cyan', 'blue'.
   - "title": The main topic of the section.
   - "items": An array of content items. Each item can be either a simple string OR a "rich-card" object.
   
   [Rich Card Structure]: Use this for complex topics with sub-points or comparisons.
   {
     "type": "rich-card",
     "title": "Card Title (Optional)",
     "content": "Main description (Optional)",
     "subSections": [
       {
         "title": "Column/Sub-topic 1",
         "points": ["Detail A", "Detail B"]
       },
       {
         "title": "Column/Sub-topic 2",
         "points": ["Detail C", "Detail D"]
       }
     ]
   }

   [Simple String]: Use "Title: Content" format for simple key-value pairs.

3. "processFlow": An array of steps representing the document's key workflow or logical sequence.
   - "title": Short title of the step.
   - "desc": Brief description.
   - "color": Hex color code (e.g., #87CEFA, #FFB6C1, #90EE90).

Example JSON:
{
  "title": "Machine Learning Fundamentals",
  "mindMap": [
    {
      "theme": "blue",
      "title": "Chapter 1: Introduction",
      "items": [
        "Overview: This document covers...",
        {
          "type": "rich-card",
          "title": "Key Definitions",
          "subSections": [
            { "title": "Term A", "points": ["Definition 1", "Example 1"] },
            { "title": "Term B", "points": ["Definition 2", "Example 2"] }
          ]
        }
      ]
    }
  ],
  "processFlow": [
    { "title": "Step 1", "desc": "Initial phase", "color": "#87CEFA" }
  ]
}

Analyze the document and return ONLY the raw JSON.`
  };
};

const COLORS = ['blue', 'green', 'orange', 'purple', 'pink', 'cyan', 'emerald', 'indigo'];

export const saveMindMap = (mindMap) => {
  const maps = getMindMaps();
  const settings = getApiSettings();

  let iconColor = 'green'; // Default fallback
  if (settings.iconColorPreference === 'random') {
    iconColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  } else if (settings.iconColorPreference) {
    iconColor = settings.iconColorPreference;
  }

  const newMap = {
    ...mindMap,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    iconColor: iconColor
  };
  maps.push(newMap);
  localStorage.setItem(STORAGE_KEYS.MIND_MAPS, JSON.stringify(maps));
  return newMap;
};

export const getMindMaps = () => {
  const maps = localStorage.getItem(STORAGE_KEYS.MIND_MAPS);
  return maps ? JSON.parse(maps) : [];
};

export const getMindMapById = (id) => {
  const maps = getMindMaps();
  return maps.find((m) => m.id === id);
};

export const deleteMindMap = (id) => {
  const maps = getMindMaps();
  const newMaps = maps.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.MIND_MAPS, JSON.stringify(newMaps));
};

export const updateMindMap = (id, updates) => {
  const maps = getMindMaps();
  const index = maps.findIndex((m) => m.id === id);
  if (index !== -1) {
    maps[index] = { ...maps[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.MIND_MAPS, JSON.stringify(maps));
    return maps[index];
  }
  return null;
};
