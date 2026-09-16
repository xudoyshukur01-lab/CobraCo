// ===== Чемпионат тизими =====
const Championship = {
    KEY_LAST_CHECK: 'cobraco_champ_last_check',
    CHECK_INTERVAL: 15 * 60 * 1000,  // 15 дақиқа
    MONTH_DAYS: 30,

    // ===== Ой бошини аниқлаш =====
    getCurrentMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },

    getCurrentMonthStart() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    },

    // ===== Сўнгги текширув вақти =====
    getLastCheck() {
        return parseInt(localStorage.getItem(this.KEY_LAST_CHECK) || '0');
    },

    setLastCheck(time) {
        localStorage.setItem(this.KEY_LAST_CHECK, String(time));
    },

    // ===== Вақт келдими? =====
    shouldCheck() {
        const last = this.getLastCheck();
        const now = Date.now();
        return (now - last) >= this.CHECK_INTERVAL;
    },

    // ===== Фойдаланувчининг ўрнини аниқлаш =====
    async getUserRank(scope) {
        if (!FirebaseDB.isReady || !TelegramAuth.user) return null;
        try {
            const data = await FirebaseDB.getLeaderboard(scope, 100);
            const myId = TelegramAuth.user.id;
            const idx = data.findIndex(d => d.telegramId === myId);
            return idx >= 0 ? { rank: idx + 1, data: data[idx], all: data } : null;
        } catch (e) { return null; }
    },

    // ===== Барча рейтингларни текшириш =====
    async checkAllLeaderboards() {
        if (!FirebaseDB.isReady || !TelegramAuth.user) return;

        console.log('🏆 Чемпионат текшируви...');

        const scopes = ['global', 'country', 'region'];
        const rewards = [];

        for (const scope of scopes) {
            const result = await this.getUserRank(scope);
            if (result && result.rank <= 3) {
                const reward = Crystals.getRewardForRank(result.rank);
                if (reward > 0) {
                    rewards.push({ scope, rank: result.rank, reward });
                }
            }
        }

        // Кристалларни бериш
        if (rewards.length > 0) {
            const totalReward = rewards.reduce((s, r) => s + r.reward, 0);
            console.log('💎 Кристаллар берилди:', rewards);

            // Firebase'га сақлаш
            if (FirebaseDB.isReady) {
                await FirebaseDB.addCrystals(totalReward);
            }
            Crystals.add(totalReward);

            // Хабар кўрсатиш
            this.showRewardMessage(rewards, totalReward);
        }

        this.setLastCheck(Date.now());
    },

    // ===== Хабар кўрсатиш =====
    showRewardMessage(rewards, total) {
        const messages = rewards.map(r => {
            const scopeName = r.scope === 'global' ? '🌍 Дунё' :
                              r.scope === 'country' ? '🏳️ Мамлакат' : '📍 Вилоят';
            return `${scopeName}: ${r.rank}-ўрин → +${r.reward} 💎`;
        });
        alert('🎉 ТАБРИКЛАЙМИЗ!\n\nСиз рейтингда топ-3 га кирдингиз!\n\n' + messages.join('\n') + '\n\nЖами: +' + total + ' 💎');
    }
};

console.log('✅ championship.js юкланди');
