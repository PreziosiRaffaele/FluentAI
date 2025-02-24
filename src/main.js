const { app, BrowserWindow, ipcMain } = require("electron");
const ConfigManager = require("./js/ConfigManager");
const AIService = require("./js/AIService");
const MacroService = require("./js/MacroService");
const AuthService = require("./js/AuthService");
const path = require("path");

const authService = new AuthService();
const aiService = new AIService();
const macroService = new MacroService(aiService);
const configManager = new ConfigManager(authService);

let mainWindow = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  await mainWindow.loadFile(path.join(__dirname, "html", "login.html"));
}

async function initializeServices(config) {
  const providers = await configManager.getProviders();
  aiService.initializeProviders(providers);
  macroService.registerMacros(config.macros);
  return providers;
}

app.whenReady().then(createWindow);

// IPC handlers
ipcMain.handle("get-config", async () => {
  const user = authService.getCurrentUser();
  return await configManager.getConfig(user.uid);
});

// Add new IPC handler for providers
ipcMain.handle("get-providers", async () => {
  return await configManager.getProviders();
});

// Update the save-agents handler
ipcMain.handle("save-agents", async (event, newConfig) => {
  const user = authService.getCurrentUser();
  await configManager.saveConfig(user.uid, newConfig);
  await initializeServices(newConfig);
});

// Update the login handler
ipcMain.handle("login", async (event, { email, password }) => {
  try {
    const user = await authService.login(email, password);
    if (user) {
      const config = await configManager.getConfig(user.uid);
      await initializeServices(config);
      await mainWindow.loadFile(path.join(__dirname, "html", "config.html"));
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("signup", async (event, { email, password }) => {
  try {
    await authService.signup(email, password);
    return {
      success: true,
      message: "Account created! Please verify your email and login.",
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.on("will-quit", () => {
  macroService.unregisterAll();
});
