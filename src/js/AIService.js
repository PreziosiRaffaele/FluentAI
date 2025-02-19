const OpenAI = require('openai');

class AIService {
    constructor() {
        this.clients = new Map();
    }

    initializeProviders (providers) {
        providers.forEach(provider => {
            if (provider.name === 'Open AI') {
                this.clients.set(provider.name, new OpenAI({
                    apiKey: provider.apiKey,
                }));
            } else if (provider.name === 'DeepSeek') {
                this.clients.set(provider.name, new OpenAI({
                    apiKey: provider.apiKey,
                    baseURL: 'https://api.deepseek.com/v1'
                }));
            }
        });
    }

    async processText (text, macro) {
        const client = this.clients.get(macro.provider);
        if (!client) {
            throw new Error(`Provider ${macro.provider} not initialized`);
        }

        const response = await client.chat.completions.create({
            model: macro.model,
            temperature: parseFloat(macro.temperature),
            messages: [
                { role: 'system', content: macro.systemPrompt },
                { role: 'user', content: `${macro.userPrompt} ${text}` }
            ],
        });

        return response?.choices[0]?.message?.content?.trim();
    }
}

module.exports = AIService;
