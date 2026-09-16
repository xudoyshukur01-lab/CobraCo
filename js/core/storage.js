// ===== localStorage билан ишлаш =====
const Storage = {
    KEY_USER: 'cobraco_user',
    KEY_BEST: 'cobraco_best_',
    KEY_SETTINGS: 'cobraco_settings_v3',
    KEY_TROPHIES: 'cobraco_trophies',
    KEY_SKIN: 'cobraco_skin',

    // ===== Фойдаланувчи =====
    saveUser(u) {
        try {
            localStorage.setItem(this.KEY_USER, JSON.stringify(u));
            return true;
        } catch (e) { console.error('❌ saveUser:', e); return false; }
    },
    getUser() {
        try {
            const r = localStorage.getItem(this.KEY_USER);
            return r ? JSON.parse(r) : null;
        } catch (e) { return null; }
    },

    // ===== Рекорд (балл) =====
    getBest(zoneId) {
        return parseInt(localStorage.getItem(this.KEY_BEST + zoneId) || '0');
    },
    setBest(zoneId, score) {
        if (score > this.getBest(zoneId)) {
            localStorage.setItem(this.KEY_BEST + zoneId, score);
            return true;
        }
        return false;
    },
    getTotalBest() {
        let max = 0;
        if (typeof ZONES !== 'undefined') {
            ZONES.forEach(z => {
                const b = this.getBest(z.id);
                if (b > max) max = b;
            });
        }
        return max;
    },

    // ===== Созламалар =====
    saveSettings(s) {
        try {
            localStorage.setItem(this.KEY_SETTINGS, JSON.stringify(s));
            return true;
        } catch (e) { return false; }
    },
    getSettings() {
        try {
            const r = localStorage.getItem(this.KEY_SETTINGS);
            return r ? JSON.parse(r) : { bots: 3, gameTime: 180, mapSize: 500 };
        } catch (e) {
            return { bots: 3, gameTime: 180, mapSize: 500 };
        }
    },

    // ===== Кубоклар =====
    saveTrophies(t) {
        try {
            localStorage.setItem(this.KEY_TROPHIES, String(t));
            return true;
        } catch (e) { return false; }
    },
    getTrophies() {
        return parseInt(localStorage.getItem(this.KEY_TROPHIES) || '0');
    },

    // ===== Скин =====
    saveSkin(id) {
        try {
            localStorage.setItem(this.KEY_SKIN, id);
            return true;
        } catch (e) { return false; }
    },
    getSkin() {
        return localStorage.getItem(this.KEY_SKIN) || 'green';
    },

    // ===== Ҳамма нарсани тозалаш =====
    clearAll() {
        localStorage.clear();
        console.log('🗑️ localStorage тозаланди');
    }
};

console.log('✅ storage.js юкланди');
