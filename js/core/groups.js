// ===== Гуруҳ тизими =====
const Groups = {
    KEY_CURRENT_GROUP: 'cobraco_current_group',

    // ===== Гуруҳ ID генерация =====
    generateId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let id = '';
        for (let i = 0; i < 6; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    },

    // ===== Жорий гуруҳни сақлаш =====
    saveCurrent(groupId) {
        localStorage.setItem(this.KEY_CURRENT_GROUP, groupId);
        console.log('✅ Гуруҳ сақланди:', groupId);
    },

    getCurrent() {
        return localStorage.getItem(this.KEY_CURRENT_GROUP);
    },

    clearCurrent() {
        localStorage.removeItem(this.KEY_CURRENT_GROUP);
    },

    // ===== Гуруҳ маълумотларини форматлаш =====
    formatGroupCode(code) {
        return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    },

    // ===== Вақт форматлаш =====
    formatTime(date) {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000);

        if (diff < 60) return 'ҳозир';
        if (diff < 3600) return Math.floor(diff / 60) + ' дақиқа олдин';
        if (diff < 86400) return Math.floor(diff / 3600) + ' соат олдин';
        return Math.floor(diff / 86400) + ' кун олдин';
    }
};

console.log('✅ groups.js юкланди');
