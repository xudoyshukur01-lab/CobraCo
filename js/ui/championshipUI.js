// ===== Чемпионат UI =====
const ChampionshipUI = {
    init() {
        document.getElementById('championshipBtn')?.addEventListener('click', () => this.open());
        document.getElementById('championshipBackBtn')?.addEventListener('click', () => showScreen('zonesScreen'));
    },

    async open() {
        showScreen('championshipScreen');
        await this.load();
    },

    async load() {
        const globalList = document.getElementById('globalTop3');
        const countryList = document.getElementById('countryTop3');
        const regionList = document.getElementById('regionTop3');

        if (globalList) globalList.innerHTML = '<div class="rating-loading">Юкланмоқда...</div>';
        if (countryList) countryList.innerHTML = '<div class="rating-loading">Юкланмоқда...</div>';
        if (regionList) regionList.innerHTML = '<div class="rating-loading">Юкланмоқда...</div>';

        const scopes = [
            { el: globalList, scope: 'global', title: '🌍 Дунё' },
            { el: countryList, scope: 'country', title: '🏳️ Мамлакат' },
            { el: regionList, scope: 'region', title: '📍 Вилоят' }
        ];

        for (const s of scopes) {
            if (!s.el) continue;
            try {
                const data = await FirebaseDB.getLeaderboard(s.scope, 3);
                s.el.innerHTML = '';
                if (!data || data.length === 0) {
                    s.el.innerHTML = '<div style="color:#64748b;font-size:13px;text-align:center;padding:10px;">Ҳали натижа йўқ</div>';
                    continue;
                }
                const icons = ['🥇','🥈','🥉'];
                const rewards = [100, 50, 25];
                data.forEach((d, i) => {
                    const name = d.username ? '@' + d.username : (d.firstName || 'X');
                    const row = document.createElement('div');
                    row.className = 'champion-row';
                    row.innerHTML = `
                        <div class="champion-rank">${icons[i]}</div>
                        <div class="champion-name">${name}</div>
                        <div class="champion-score">${d.score}</div>
                        <div class="champion-reward">+${rewards[i]} 💎</div>
                    `;
                    s.el.appendChild(row);
                });
            } catch (e) {
                s.el.innerHTML = '<div style="color:#ef4444;font-size:13px;">Хато</div>';
            }
        }
    },

    updateCrystals() {
        const el = document.getElementById('crystalsCount');
        if (el) el.textContent = Crystals.format(Crystals.getTotal());
    }
};

console.log('✅ championshipUI.js юкланди');
