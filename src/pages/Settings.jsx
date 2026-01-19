import React, { useState, useEffect } from 'react';
import { saveApiSettings, getApiSettings } from '../utils/storage';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
    const navigate = useNavigate();
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [modelName, setModelName] = useState('');
    const [paperReadingModelName, setPaperReadingModelName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [iconColorPreference, setIconColorPreference] = useState('random');
    const [outputLanguage, setOutputLanguage] = useState('zh');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getApiSettings();
            setApiKey(settings.apiKey);
            setBaseUrl(settings.baseUrl);
            setModelName(settings.modelName);
            setPaperReadingModelName(settings.paperReadingModelName || 'gemini-2.5-pro-thinking');
            setSystemPrompt(settings.systemPrompt || '');
            setIconColorPreference(settings.iconColorPreference || 'random');
            setOutputLanguage(settings.outputLanguage || 'zh');
        };
        loadSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();

        if (!baseUrl.trim()) {
            setMessage('Error: Base URL cannot be empty.');
            return;
        }

        if (!baseUrl.startsWith('http')) {
            setMessage('Error: Base URL must start with http:// or https://');
            return;
        }

        await saveApiSettings({ apiKey, baseUrl, modelName, paperReadingModelName, systemPrompt, iconColorPreference, outputLanguage });
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-8"
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                    <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <SettingsIcon className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">API Configuration</h1>
                            <p className="text-slate-500 text-sm">Configure your LLM provider settings</p>
                        </div>
                    </div>

                    {message && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-xl mb-6 flex items-center gap-2 border border-green-100">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">API Base URL</label>
                                    <input
                                        type="text"
                                        value={baseUrl}
                                        onChange={(e) => setBaseUrl(e.target.value)}
                                        placeholder="https://api.openai.com/v1"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-slate-50 focus:bg-white"
                                    />
                                    <p className="mt-2 text-xs text-slate-400">The base URL for the API. Usually ends with <b>/v1</b>.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">API Key</label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-slate-50 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mind Map Model</label>
                                    <input
                                        type="text"
                                        value={modelName}
                                        onChange={(e) => setModelName(e.target.value)}
                                        placeholder="gpt-4o, gemini-3-flash-preview, etc."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-slate-50 focus:bg-white"
                                    />
                                    <p className="mt-2 text-xs text-slate-400">Model for generating mind maps.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Paper Reading Model</label>
                                    <input
                                        type="text"
                                        value={paperReadingModelName}
                                        onChange={(e) => setPaperReadingModelName(e.target.value)}
                                        placeholder="gemini-2.5-pro-thinking, etc."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-slate-50 focus:bg-white"
                                    />
                                    <p className="mt-2 text-xs text-slate-400">Model for generating paper reading notes.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Card Icon Color</label>
                                    <select
                                        value={iconColorPreference}
                                        onChange={(e) => setIconColorPreference(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-slate-50 focus:bg-white"
                                    >
                                        <option value="random">Random (Surprise Me!)</option>
                                        <option value="blue">Blue</option>
                                        <option value="green">Green</option>
                                        <option value="orange">Orange</option>
                                        <option value="purple">Purple</option>
                                        <option value="pink">Pink</option>
                                        <option value="cyan">Cyan</option>
                                        <option value="emerald">Emerald</option>
                                        <option value="indigo">Indigo</option>
                                    </select>
                                    <p className="mt-2 text-xs text-slate-400">Select the default color for new mind map icons.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Output Language</label>
                                    <select
                                        value={outputLanguage}
                                        onChange={(e) => setOutputLanguage(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-slate-50 focus:bg-white"
                                    >
                                        <option value="zh">中文 (Chinese)</option>
                                        <option value="en">English</option>
                                    </select>
                                    <p className="mt-2 text-xs text-slate-400">Choose the language for generated content.</p>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">System Prompt</label>
                                    <textarea
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        placeholder="Enter custom system prompt..."
                                        rows={15}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-slate-50 focus:bg-white font-mono text-sm"
                                    />
                                    <div className="flex justify-between items-center mt-3">
                                        <p className="text-xs text-slate-400">Customize how the AI generates the mind map structure.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSystemPrompt(`You are an expert at analyzing meeting transcripts and structuring them into a visual mind map and process flow.

Your goal is to extract key topics, discussions, and action items and organize them into a specific JSON structure.

CRITICAL INSTRUCTIONS:
1. **Chronological Order**: Organize the main sections (Nodes) in the order they were discussed in the meeting.
2. **Detailed Content**: Do NOT use short keywords. Use complete sentences or detailed phrases to capture the full context and nuance of the discussion.
3. **Rich Structure**: Use the "rich-card" structure for complex topics that involve multiple sub-points, comparisons, or lists.

The output must be a JSON object with two keys: "mindMap" and "processFlow".

1. "mindMap": An array where each item represents a main section (Node).
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

2. "processFlow": An array of steps representing the timeline or key process discussed.
   - "title": Short title of the step.
   - "desc": Brief description.
   - "color": Hex color code (e.g., #87CEFA, #FFB6C1, #90EE90).

Example JSON:
{
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

Analyze the text and return ONLY the raw JSON.`);
                                            }}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors border border-slate-200 whitespace-nowrap ml-4"
                                        >
                                            Reset to Default Prompt
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                            >
                                <Save size={20} /> Save Configuration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
