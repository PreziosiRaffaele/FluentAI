const path = require('path');
const fs = require('fs');

class ConfigManager {
    constructor(userDataPath) {
        this.configPath = path.join(userDataPath, 'config2.json');
        this.initializeConfig();
    }

    initializeConfig () {
        if (!fs.existsSync(this.configPath)) {
            fs.writeFileSync(this.configPath, JSON.stringify({ providers: [], macros: [] }));
        }
    }

    getConfig () {
        return JSON.parse(fs.readFileSync(this.configPath, "utf8"));
    }

    saveConfig (newConfig) {
        fs.writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2));
    }
}

module.exports = ConfigManager;
