// ===== Кристаллар тизими =====
const Crystals = {
    KEY_CRYSTALS: 'cobraco_crystals',

    // Топ-3 учун кристаллар
    REWARDS: {
        1: 100,  // 🥇
        2: 50,   // 🥈
        3: 25    // 🥉
    },

    // ===== Сақлаш =====
    getTotal() {
        return parseInt(localStorage.getItem(this.KEY_CRYSTALS) || '0');
    },

    saveTotal(amount) {
        localStorage.setItem(this.KEY_CRYSTALS, String(amount));
        console.log('💎 Кристаллар сақланди:', amount);
    },

    add(amount) {
        const current = this.getTotal();
        this.saveTotal(current + amount);
        return current + amount;
    },

    // ===== Топ-3 учун кристалл ҳисоблаш =====
    getRewardForRank(rank) {
        return this.REWARDS[rank] || 0;
    },

    // ===== Форматлаш =====
    format(amount) {
        if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
        if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
        return String(amount);
    }
};

console.log('✅ crystals.js юкланди');
