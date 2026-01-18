import { getApiSettings } from '../utils/storage';

export const generateMindMapFromText = async (text, fileType = 'txt') => {
    const { apiKey, baseUrl, modelName, systemPrompt, pdfSystemPrompt } = getApiSettings();

    if (!apiKey) {
        throw new Error('API Key is missing. Please configure it in Settings.');
    }

    // Choose the appropriate prompt based on file type
    const promptToUse = fileType === 'pdf'
        ? (pdfSystemPrompt || systemPrompt || 'Analyze this document and return a JSON mind map.')
        : (systemPrompt || 'Analyze this meeting transcript and return a JSON mind map.');

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
