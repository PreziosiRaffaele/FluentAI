const { doc, getDoc, setDoc } = require('firebase/firestore');

class ConfigManager {
    constructor(authService) {
        this.db = authService.db;
    }

    async getConfig (userId) {
        try {
            const userConfigRef = doc(this.db, 'users', userId);
            const userConfigSnap = await getDoc(userConfigRef);

            if (!userConfigSnap.exists()) {
                // Initialize default config
                const defaultConfig = {
                    providers: [],
                    macros: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await this.saveConfig(userId, defaultConfig);
                return defaultConfig;
            }

            return userConfigSnap.data();
        } catch (error) {
            console.error('Error fetching config:', error);
            return null;
        }
    }

    async saveConfig (userId, newConfig) {
        try {
            const userConfigRef = doc(this.db, 'users', userId);

            // Add metadata to the config
            const configWithMetadata = {
                ...newConfig,
                updatedAt: new Date()
            };

            await setDoc(userConfigRef, configWithMetadata, { merge: true });

            return configWithMetadata;
        } catch (error) {
            console.error('Error saving config:', error);
            throw new Error('Failed to save configuration');
        }
    }
}

module.exports = ConfigManager;
