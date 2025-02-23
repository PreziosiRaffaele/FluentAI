const { doc, getDoc, setDoc, collection, getDocs } = require('firebase/firestore');

class ConfigManager {
    constructor(authService) {
        this.db = authService.db;
    }

    async getProviders () {
        try {
            const providersCollection = collection(this.db, 'providers');
            const providersSnapshot = await getDocs(providersCollection);
            return providersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching providers:', error);
            return [];
        }
    }

    async getConfig (userId) {
        try {
            const userConfigRef = doc(this.db, 'users', userId);
            const userConfigSnap = await getDoc(userConfigRef);

            if (!userConfigSnap.exists()) {
                // Initialize default config
                const defaultConfig = {
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
