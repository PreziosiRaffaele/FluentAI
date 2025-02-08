import clipboard from 'clipboardy';
import OpenAI from 'openai';
import robot from 'robotjs';
import { GlobalKeyboardListener } from "node-global-key-listener";
import dotenv from 'dotenv';

dotenv.config();
const v = new GlobalKeyboardListener();
const client = new OpenAI({
    apiKey: process.env.API_KEY, // This is the default and can be omitted
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

/**
 * Corrects the text in the clipboard and pastes the corrected text.
 */
async function correctAndPaste () {
    try {
        const copiedText = clipboard.readSync();
        if (copiedText) {
            const correctedText = await correctText(copiedText);
            clipboard.writeSync(correctedText);
            if (process.platform === 'darwin') { // macOS
                robot.keyTap('v', 'command');
            } else {
                robot.keyTap('v', 'control'); // Windows and Linux
            }
        } else {
            console.log("No text found in clipboard.");
        }
    } catch (error) {
        console.error('Error during text correction:', error.message);
    }
}

v.addListener(function (e, down) {
    if (
        e.state == "DOWN" &&
        e.name == "SPACE" &&
        (down["LEFT META"] && down["LEFT ALT"])
    ) {
        correctAndPaste();
        return true;
    }
});