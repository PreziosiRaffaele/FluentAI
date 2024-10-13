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


/**
 * Corrects the given text using the GPT-3.5-turbo model.
 *
 * @async
 * @param {*} text The text to correct.
 * @returns {unknown} The corrected text. If an error occurs, the original text is returned.
 */
async function correctText (text) {
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant. Your role is to correct the user\'s text and improve clarity.',
                },
                {
                    role: 'user',
                    content: `Please correct the following text and return only the corrected version: ${text}`,
                },
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
 *
 * @async
 * @returns {*}
 */
async function correctAndPaste () {
    try {
        const copiedText = clipboard.readSync();
        if (copiedText) {
            const correctedText = await correctText(copiedText);
            clipboard.writeSync(correctedText);
            robot.typeString(correctedText);
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