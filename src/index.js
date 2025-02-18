const { app, BrowserWindow, ipcMain } = require('electron');
const ConfigManager = require('./js/ConfigManager');
const AIService = require('./js/AIService');
const MacroService = require('./js/MacroService');
const path = require('path');

// Initialize services
const configManager = new ConfigManager(app.getPath('userData'));
const aiService = new AIService();
const macroService = new MacroService(aiService);

app.whenReady().then(async () => {
    const config = configManager.getConfig();
    aiService.initializeProviders(config.providers);
    macroService.registerMacros(config.macros);

    const configWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    configWindow.loadFile(path.join(__dirname, 'html', 'config.html'));
});

// IPC handlers
ipcMain.handle('get-config', () => configManager.getConfig());

ipcMain.handle('save-config', async (event, newConfig) => {
    configManager.saveConfig(newConfig);
    aiService.initializeProviders(newConfig.providers);
    macroService.registerMacros(newConfig.macros);
});

app.on('will-quit', () => macroService.unregisterAll());