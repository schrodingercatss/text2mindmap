import { getApiSettings } from '../utils/storage';

export const generateMindMapFromText = async (text) => {
    const { apiKey, baseUrl, modelName, systemPrompt } = getApiSettings();

    if (!apiKey) {
        throw new Error('API Key is missing. Please configure it in Settings.');
    }

    // Use the system prompt from settings, or fall back to a default if somehow missing (though storage.js handles default)
    const promptToUse = systemPrompt || `You are an expert at analyzing meeting transcripts and structuring them into a visual mind map and process flow.

Your goal is to extract key topics, discussions, and action items and organize them into a specific JSON structure.

The output must be a JSON object with two keys: "mindMap" and "processFlow".

1. "mindMap": An array where each item represents a main section (Node).
   - "theme": Choose from 'orange', 'green', 'pink', 'cyan', 'blue'.
   - "title": The main topic of the section.
   - "items": An array of objects, each with a "content" field (string). Use "Title: Content" format for specific points.

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
        { "content": "Objective 1: Increase efficiency" },
        { "content": "Owner: John Doe" }
      ]
    }
  ],
  "processFlow": [
    { "title": "Kickoff", "desc": "Initial meeting", "color": "#87CEFA" },
    { "title": "Development", "desc": "Coding phase", "color": "#90EE90" }
  ]
}

Analyze the text and return ONLY the raw JSON.`;

    try {
        // Smart URL construction: check if user already included the endpoint
        let url = baseUrl.replace(/\/$/, '');
        if (!url.endsWith('/chat/completions')) {
            url = `${url}/chat/completions`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: modelName || 'gpt-4o',
                messages: [
                    { role: 'system', content: promptToUse },
                    { role: 'user', content: text },
                ],
                temperature: 0.2,
            }),
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textBody = await response.text();
            console.error('API Error: Received non-JSON response', textBody);
            throw new Error(`API returned non-JSON response (Status ${response.status}). Check your Base URL. Response preview: ${textBody.substring(0, 100)}...`);
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Clean up potential markdown code blocks if the model ignores the instruction
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanContent);
    } catch (error) {
        console.error('Error generating mind map:', error);
        throw error;
    }
};
