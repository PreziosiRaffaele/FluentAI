const { app, globalShortcut, clipboard, BrowserWindow } = require('electron')
const OpenAI = require('openai')
const path = require("path");
const fs = require("fs");

const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config2.json');

// Initialize empty config if not exists
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ providers: [], macros: [] }));
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Create clients map for each provider
const clients = {};
config.providers.forEach(provider => {
    if (provider.name === 'Open AI') {
        clients[provider.name] = new OpenAI({
            apiKey: provider.apiKey,
        });
    }
    // Add other provider initializations here
});

/**
 * Processes text using the specified macro configuration
 */
async function processText (text, macro) {
    const client = clients[macro.provider];
    if (!client) throw new Error(`Provider ${macro.provider} not initialized`);

    const response = await client.chat.completions.create({
        model: macro.model,
        temperature: 0.2,
        messages: [
            {
                role: 'system',
                content: macro.systemPrompt,
            },
            {
                role: 'user',
                content: `${macro.userPrompt} ${text}`,
            }
        ],
    });

    return response?.choices[0]?.message?.content?.trim();
}

function registerMacros (macros) {
    console.log('Registering macros:', macros);
    globalShortcut.unregisterAll();
    macros.forEach(macro => {
        const ret = globalShortcut.register(macro.shortcut, async () => {
            try {
                const text = clipboard.readText();
                clipboard.writeText('Processing...');
                const processedText = await processText(text, macro);
                clipboard.writeText(processedText);
            } catch (error) {
                console.error('Error:', error);
                clipboard.writeText(error.message);
            }
        });

        if (!ret) {
            console.log(`Registration failed for shortcut: ${macro.shortcut}`);
        }
    });
}


app.whenReady().then(async () => {
    // Register all macro shortcuts
    registerMacros(config.macros);

    // Create configuration window
    let configWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    configWindow.loadFile('config.html');
});



// Handle IPC events for configuration
const { ipcMain } = require('electron');

ipcMain.handle('get-config', () => {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
});

ipcMain.handle('save-config', async (event, newConfig) => {
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    registerMacros(config.macros);
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});