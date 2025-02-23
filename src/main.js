const { app, BrowserWindow, ipcMain } = require('electron');
const ConfigManager = require('./js/ConfigManager');
const AIService = require('./js/AIService');
const MacroService = require('./js/MacroService');
const AuthService = require('./js/AuthService');
const path = require('path');

// Initialize services
const configManager = new ConfigManager(app.getPath('userData'));
const aiService = new AIService();
const macroService = new MacroService(aiService);
const authService = new AuthService();

let mainWindow = null;

async function createWindow () {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const isLoggedIn = authService.getCurrentUser();

    if (isLoggedIn) {
        const config = configManager.getConfig();
        aiService.initializeProviders(config.providers);
        macroService.registerMacros(config.macros);
        await mainWindow.loadFile(path.join(__dirname, 'html', 'config.html'));
    } else {
        await mainWindow.loadFile(path.join(__dirname, 'html', 'login.html'));
    }
}

app.whenReady().then(createWindow);

// IPC handlers
ipcMain.handle('get-config', () => configManager.getConfig());

ipcMain.handle('save-config', async (event, newConfig) => {
    configManager.saveConfig(newConfig);
    aiService.initializeProviders(newConfig.providers);
    macroService.registerMacros(newConfig.macros);
});

ipcMain.handle('login', async (event, { email, password }) => {
    try {
        const user = await authService.login(email, password);
        if (user) {
            const config = configManager.getConfig();
            aiService.initializeProviders(config.providers);
            macroService.registerMacros(config.macros);
            await mainWindow.loadFile(path.join(__dirname, 'html', 'config.html'));
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('signup', async (event, { email, password }) => {
    try {
        await authService.signup(email, password);
        return { success: true, message: 'Account created! Please verify your email and login.' };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

app.on('will-quit', () => {
    macroService.unregisterAll();
});