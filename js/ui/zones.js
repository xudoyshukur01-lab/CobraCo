// ===== Меню UI =====
const ZonesUI = {
    init() {
        // Кубок карточкаси — босилганда рейтингга
        document.getElementById('trophyCard')?.addEventListener('click', () => {
            if (typeof RatingUI !== 'undefined') RatingUI.open();
        });

        // Кристалл карточкаси — чемпионатга
        document.getElementById('crystalCard')?.addEventListener('click', () => {
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

        // Ўйинни бошлаш
        document.getElementById('modesBtn')?.addEventListener('click', () => {
            if (typeof ModesUI !== 'undefined') ModesUI.open();
        });

        this.updateTrophyDisplay();
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
