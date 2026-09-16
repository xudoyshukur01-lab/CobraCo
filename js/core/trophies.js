// ===== Кубок тизими =====
const Trophies = {
    RANKS: [
        { min: 0,     max: 500,   icon: '🥉', name: 'Бронза',      color: '#cd7f32' },
        { min: 500,   max: 2000,  icon: '🥈', name: 'Кумуш',       color: '#c0c0c0' },
        { min: 2000,  max: 5000,  icon: '🥇', name: 'Олтин',       color: '#fbbf24' },
        { min: 5000,  max: 10000, icon: '💎', name: 'Олмос',       color: '#22d3ee' },
        { min: 10000, max: Infinity, icon: '👑', name: 'Афсонавий', color: '#a855f7' }
    ],

    getRank(trophies) {
        const t = Math.max(0, trophies);
        for (const r of this.RANKS) {
            if (t >= r.min && t < r.max) return r;
        }
        return this.RANKS[this.RANKS.length - 1];
    },

    calculateChanges(players) {
        if (!players || players.length < 1) return {};
        const MAX_CHANGE = CONFIG.MAX_TROPHY_CHANGE || 30;

        const totalScore = players.reduce((s, p) => s + p.score, 0);
        const avg = totalScore / players.length;
        const maxScore = Math.max(...players.map(p => p.score));
        const minScore = Math.min(...players.map(p => p.score));
        const range = maxScore - minScore || 1;

        const rawChanges = players.map(p => ({
            player: p,
            raw: ((p.score - avg) / range) * MAX_CHANGE
        }));

        let roundedSum = 0;
        rawChanges.forEach(c => { c.rounded = Math.round(c.raw); roundedSum += c.rounded; });

        if (roundedSum !== 0) {
            let target = null;
            for (const c of rawChanges) {
                if (!target || c.rounded > target.rounded) target = c;
            }
            if (target) target.rounded -= roundedSum;
        }

        const result = {};
        for (const c of rawChanges) {
            const p = c.player;
            let change = c.rounded;
            if (p.isBot) { result[p.id] = change; continue; }
            const newTotal = (p.trophies || 0) + change;
            if (newTotal < 0) change = -(p.trophies || 0);
            result[p.id] = change;
        }
        return result;
    },

    formatChange(change) {
        if (change > 0) return '+' + change;
        if (change < 0) return String(change);
        return '0';
    },
    getChangeClass(change) {
        if (change > 0) return 'positive';
        if (change < 0) return 'negative';
        return 'zero';
    }
};

const TrophiesUI = {
    updateHeader(trophies) {
        const rank = Trophies.getRank(trophies);
        const icon = document.getElementById('trophyIcon');
        const count = document.getElementById('trophyCount');
        const name = document.getElementById('trophyRank');
        if (icon) icon.textContent = rank.icon;
        if (count) count.textContent = trophies;
        if (name) { name.textContent = rank.name; name.style.color = rank.color; }
    }
};

console.log('✅ trophies.js юкланди');
