const {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} = require("firebase/firestore");

class ConfigManager {
  _providersCache;
  _userConfigCache;

  constructor(authService) {
    this.db = authService.db;
  }

  async getProviders() {
    try {
      if (this._providersCache) {
        return Promise.resolve(this._providersCache);
      }

      const providersCollection = collection(this.db, "providers");
      const providersSnapshot = await getDocs(providersCollection);
      this._providersCache = providersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return this._providersCache;
    } catch (error) {
      throw new Error("Failed to fetch providers");
    }
  }

  async getConfig(userId) {
    try {
      if (this._userConfigCache) {
        return Promise.resolve(this._userConfigCache);
      }

      const userConfigRef = doc(this.db, "users", userId);
      const userConfigSnap = await getDoc(userConfigRef);

      if (!userConfigSnap.exists()) {
        // Initialize default config
        const defaultConfig = {
          macros: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await this.saveConfig(userId, defaultConfig);
        return defaultConfig;
      }

      this._userConfigCache = userConfigSnap.data();
      return this._userConfigCache;
    } catch (error) {
      console.error("Error fetching config:", error);
      return null;
    }
  }

  async saveMacros(userId, macros) {
    try {
      const userConfigRef = doc(this.db, "users", userId);
      await setDoc(userConfigRef, { macros }, { merge: true });
      this._userConfigCache.macros = macros;
    } catch (error) {
      console.error("Error saving config:", error);
      throw new Error("Failed to save configuration");
    }
  }
}

module.exports = ConfigManager;
