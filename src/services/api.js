import { getApiSettings } from '../utils/storage';
import { REPAIR_FORMAT_PROMPT } from '../utils/prompts';

export const generateMindMapFromText = async (text, fileType = 'txt') => {
    const { apiKey, baseUrl, modelName, systemPrompt, pdfSystemPrompt, outputLanguage } = getApiSettings();

    if (!apiKey) {
        throw new Error('API Key is missing. Please configure it in Settings.');
    }

    // Choose the appropriate prompt based on file type
    let basePrompt = fileType === 'pdf'
        ? (pdfSystemPrompt || systemPrompt || 'Analyze this document and return a JSON mind map.')
        : (systemPrompt || 'Analyze this meeting transcript and return a JSON mind map.');

    // Append language instruction
    const langInstruction = outputLanguage === 'en'
        ? '\n\nIMPORTANT: Output all content in English.'
        : '\n\nIMPORTANT: 请使用中文输出所有内容。';

    const promptToUse = basePrompt + langInstruction;

    try {
        // Smart URL construction: check if user already included the endpoint
        let url = baseUrl.replace(/\/$/, '');
        if (!url.endsWith('/chat/completions')) {
            url = `${url}/chat/completions`;
        }

        // Build the message content based on file type
        let userContent;
        if (fileType === 'pdf') {
            // For PDF: text contains base64 data, send as file
            userContent = [
                {
                    type: 'file',
                    file: {
                        filename: 'document.pdf',
                        file_data: `data:application/pdf;base64,${text}`
                    }
                },
                {
                    type: 'text',
                    text: 'Please analyze this PDF document and generate a mind map structure.'
                }
            ];
        } else {
            // For text files: send as plain text
            userContent = text;
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
                    { role: 'user', content: userContent },
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

// Generate paper reading notes (returns markdown)
export const generatePaperReading = async (text, fileType = 'pdf') => {
    const { apiKey, baseUrl, paperReadingModelName, paperReadingPrompt } = getApiSettings();

    if (!apiKey) {
        throw new Error('API Key is missing. Please configure it in Settings.');
    }

    const promptToUse = paperReadingPrompt || 'Analyze this academic paper and provide detailed notes in markdown format.';

    try {
        // Smart URL construction
        let url = baseUrl.replace(/\/$/, '');
        if (!url.endsWith('/chat/completions')) {
            url = `${url}/chat/completions`;
        }

        // Build the message content based on file type
        let userContent;
        if (fileType === 'pdf') {
            userContent = [
                {
                    type: 'file',
                    file: {
                        filename: 'paper.pdf',
                        file_data: `data:application/pdf;base64,${text}`
                    }
                },
                {
                    type: 'text',
                    text: '请分析这篇学术论文并按照框架生成详细的阅读笔记。'
                }
            ];
        } else {
            userContent = text;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: paperReadingModelName || 'gemini-2.5-pro-thinking',
                messages: [
                    { role: 'system', content: promptToUse },
                    { role: 'user', content: userContent },
                ],
                temperature: 0.3,
            }),
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textBody = await response.text();
            console.error('API Error: Received non-JSON response', textBody);
            throw new Error(`API returned non-JSON response (Status ${response.status}). Check your Base URL.`);
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Return raw markdown content
        return content;
    } catch (error) {
        console.error('Error generating paper reading notes:', error);
        throw error;
    }
};

// Helper to clean up markdown regex-based (FALLBACK ONLY)
// This is used as a last resort when LLM repair fails or times out
const cleanupMarkdown = (text) => {
    if (!text) return text;

    let result = text;

    // Normalize line endings to \n
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Fix: Convert single-line code blocks to inline code
    // Handles: ```language\ncontent\n``` or ``` \n content \n ```
    // The regex is more flexible to handle various spacing patterns
    result = result.replace(/```[ \t]*[\w-]*[ \t]*\n\s*([^\n]+?)\s*\n\s*```/g, (match, content) => {
        const trimmed = content.trim();
        // Only convert if content looks like a single word/short phrase (not actual code)
        if (trimmed.length < 100 && !trimmed.includes(';') && !trimmed.includes('{') && !trimmed.includes('(')) {
            return `\`${trimmed}\``;
        }
        return match; // Keep as code block if it looks like actual code
    });

    return result;
};

// Repair markdown and LaTeX formatting
export const repairPaperNotes = async (content) => {
    const { apiKey, baseUrl, modelName } = getApiSettings();

    if (!apiKey) {
        throw new Error('API Key is missing.');
    }

    // Normalize line endings first
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    try {
        let url = baseUrl.replace(/\/$/, '');
        if (!url.endsWith('/chat/completions')) {
            url = `${url}/chat/completions`;
        }

        // Create a controller for timeout (3 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: modelName || 'gpt-4o',
                messages: [
                    { role: 'system', content: REPAIR_FORMAT_PROMPT },
                    { role: 'user', content: normalizedContent }, // Send original content to LLM
                ],
                temperature: 0.1,
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // LLM request failed, use regex fallback on ORIGINAL content
            console.warn('Repair request failed, using regex fallback.');
            return cleanupMarkdown(normalizedContent);
        }

        const data = await response.json();
        const repairedContent = data.choices[0].message.content;

        // Clean up potential markdown wrapper if the model wraps the output
        let finalContent = repairedContent
            .replace(/^```markdown\n/, '')
            .replace(/^```\n/, '')
            .replace(/\n```$/, '');

        // Always apply regex cleanup as final pass (belt and suspenders)
        return cleanupMarkdown(finalContent);

    } catch (error) {
        // LLM timed out or errored, use regex fallback on ORIGINAL content
        console.error('Error repairing paper notes (using regex fallback):', error);
        return cleanupMarkdown(normalizedContent);
    }
};
