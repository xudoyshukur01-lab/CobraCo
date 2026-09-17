// ===== Чемпионат UI (кубок бўйича) =====
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
            { el: globalList, scope: 'global' },
            { el: countryList, scope: 'country' },
            { el: regionList, scope: 'region' }
        ];

        const rewards = {
            global:  [100, 80, 60, 40, 20],
            country: [50, 40, 30, 20, 10],
            region:  [30, 25, 20, 15, 10]
        };

        for (const s of scopes) {
            if (!s.el) continue;
            try {
                const data = await FirebaseDB.getLeaderboard(s.scope, 5);
                s.el.innerHTML = '';
                if (!data || data.length === 0) {
                    s.el.innerHTML = '<div style="color:#64748b;font-size:13px;text-align:center;padding:10px;">Ҳали натижа йўқ</div>';
                    continue;
                }
                const icons = ['🥇','🥈','🥉','4️⃣','5️⃣'];
                data.forEach((d, i) => {
                    const name = d.username ? '@' + d.username : (d.firstName || 'X');
                    const trophies = d.trophies || 0;
                    const reward = rewards[s.scope][i] || 0;
                    const row = document.createElement('div');
                    row.className = 'champion-row';
                    row.innerHTML = `
                        <div class="champion-rank">${icons[i]}</div>
                        <div class="champion-name">${name}</div>
                        <div class="champion-score">🏆 ${trophies}</div>
                        <div class="champion-reward">+${reward} 💎</div>
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

console.log('✅ championshipUI.js юкланди (кубок бўйича)');
