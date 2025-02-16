const { app, globalShortcut, clipboard } = require('electron')
const OpenAI = require('openai')
const path = require("path");
const fs = require("fs");

const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const client = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
});

const systemPrompt = `You are a professional editor. Follow these rules:
1. Correct grammar and punctuation
2. Improve clarity and readability
3. Maintain the original tone and intent
4. Keep the same format (lists stay lists, etc.)
5. Don't add explanations or comments`;


/**
 * Corrects the given text using the OpenAI API.
 *
 * @async
 * @param {string} text The text to correct.
 * @returns {string} The corrected text. If an error occurs, the original text is returned.
 */
async function correctText (text) {
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: `Please correct the following text. Return only the revised version without additional comments: ${text}`,
                }
            ],
        });

        return response?.choices[0]?.message?.content?.trim();
    } catch (error) {
        console.error('Errore:', error);
        return text;
    }
}

app.whenReady().then(() => {
    const ret = globalShortcut.register('Cmd+Option+Space', async () => {
        try {
            const text = clipboard.readText();
            clipboard.writeText('Processing...');
            const correctedText = await correctText(text);
            clipboard.writeText(correctedText);
        } catch (error) {
            console.error('Errore:', error);
            clipboard.writeText(error.message);
        }
    });

    if (!ret) {
        console.log('registration failed');
    }
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})