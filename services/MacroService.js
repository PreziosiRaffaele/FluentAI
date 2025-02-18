const { globalShortcut, clipboard } = require('electron');

class MacroService {
    constructor(aiService) {
        this.aiService = aiService;
    }

    registerMacros (macros) {
        globalShortcut.unregisterAll();

        macros.forEach(macro => {
            const success = globalShortcut.register(macro.shortcut, () =>
                this.handleMacroExecution(macro));

            if (!success) {
                console.log(`Registration failed for shortcut: ${macro.shortcut}`);
            }
        });
    }

    async handleMacroExecution (macro) {
        try {
            const text = clipboard.readText();
            clipboard.writeText('Processing...');
            const processedText = await this.aiService.processText(text, macro);
            clipboard.writeText(processedText);
        } catch (error) {
            console.error('Error:', error);
            clipboard.writeText(error.message);
        }
    }

    unregisterAll () {
        globalShortcut.unregisterAll();
    }
}

module.exports = MacroService;
