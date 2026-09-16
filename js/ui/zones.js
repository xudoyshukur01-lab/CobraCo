// ===== Меню UI =====
const ZonesUI = {
    init() {
        // Кубок карточкаси — босилганда рейтингга
        document.getElementById('trophyCard')?.addEventListener('click', () => {
            console.log('🏆 Кубок босилди — рейтингга ўтиш');
            if (typeof RatingUI !== 'undefined') RatingUI.open();
        });

        // Кристалл карточкаси — босилганда чемпионатга (ёки келажакда дўконга)
        document.getElementById('crystalCard')?.addEventListener('click', () => {
            console.log('💎 Кристалл босилди — чемпионатга ўтиш');
            if (typeof ChampionshipUI !== 'undefined') ChampionshipUI.open();
        });

        // Созламалар
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            showScreen('settingsScreen');
        });

        // Гуруҳ
        document.getElementById('groupsBtn')?.addEventListener('click', () => {
            if (typeof GroupsUI !== 'undefined') GroupsUI.open();
        });

        // Чемпионат
        document.getElementById('championshipBtn')?.addEventListener('click', () => {
            if (typeof ChampionshipUI !== 'undefined') ChampionshipUI.open();
        });

        this.render();
        this.updateTrophyDisplay();
    },

    render() {
        const list = document.getElementById('zonesList');
        if (!list) return;
        list.innerHTML = '';
        const totalBest = Storage.getTotalBest();
        ZONES.forEach(zone => {
            const locked = totalBest < zone.unlockScore;
            const best = Storage.getBest(zone.id);
            const card = document.createElement('div');
            card.className = 'zone-card' + (locked ? ' locked' : '');
            card.innerHTML = `
                <div class="zone-info">
                    <h3>${zone.emoji} ${zone.name}</h3>
                    <p>${zone.desc}</p>
                    <p style="color:#fbbf24;font-size:11px;margin-top:3px;">Рекорд: ${best}</p>
                </div>
                <div class="zone-badge">${locked ? '🔒' : '▶'}</div>
            `;
            if (!locked) card.addEventListener('click', () => Game.start(zone));
            list.appendChild(card);
        });
    },

    updateTrophyDisplay() {
        const trophies = Storage.getTrophies();
        const icon = document.getElementById('trophyIcon');
        const count = document.getElementById('trophyCount');
        const name = document.getElementById('trophyRank');
        if (icon) icon.textContent = '🥉';
        if (count) count.textContent = trophies;
        if (name) name.textContent = 'Бронза';
    }
};

console.log('✅ zones.js юкланди');
