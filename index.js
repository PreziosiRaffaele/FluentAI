const { app, BrowserWindow, ipcMain } = require('electron');
const ConfigManager = require('./config/ConfigManager');
const AIService = require('./services/AIService');
const MacroService = require('./services/MacroService');

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

    configWindow.loadFile('config.html');
});

// IPC handlers
ipcMain.handle('get-config', () => configManager.getConfig());

ipcMain.handle('save-config', async (event, newConfig) => {
    configManager.saveConfig(newConfig);
    aiService.initializeProviders(newConfig.providers);
    macroService.registerMacros(newConfig.macros);
});

app.on('will-quit', () => macroService.unregisterAll());