// ===== Меню UI =====
const ZonesUI = {
    init() {
        document.getElementById('trophyCard')?.addEventListener('click', () => {
            if (typeof RatingUI !== 'undefined') RatingUI.open();
        });
        document.getElementById('crystalCard')?.addEventListener('click', () => {
            if (typeof ChampionshipUI !== 'undefined') ChampionshipUI.open();
        });
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            showScreen('settingsScreen');
        });
        document.getElementById('groupsBtn')?.addEventListener('click', () => {
            if (typeof GroupsUI !== 'undefined') GroupsUI.open();
        });
        document.getElementById('championshipBtn')?.addEventListener('click', () => {
            if (typeof ChampionshipUI !== 'undefined') ChampionshipUI.open();
        });
        document.getElementById('modesBtn')?.addEventListener('click', () => {
            if (typeof ModesUI !== 'undefined') ModesUI.open();
        });

        this.render();
        this.updateTrophyDisplay();
    },

    render() {
        // Бу функция энди бўш — меню статик
        this.updateTrophyDisplay();
    },

    updateTrophyDisplay() {
        const trophies = Storage.getTrophies();
        const icon = document.getElementById('trophyIcon');
        const count = document.getElementById('trophyCount');
        const name = document.getElementById('trophyRank');

        let rankIcon = '🥉', rankName = 'Бронза';
        if (trophies >= 10000) { rankIcon = '👑'; rankName = 'Афсонавий'; }
        else if (trophies >= 5000) { rankIcon = '💎'; rankName = 'Олмос'; }
        else if (trophies >= 2000) { rankIcon = '🥇'; rankName = 'Олтин'; }
        else if (trophies >= 500) { rankIcon = '🥈'; rankName = 'Кумуш'; }

        if (icon) icon.textContent = rankIcon;
        if (count) count.textContent = trophies;
        if (name) name.textContent = rankName;
    }
};

console.log('✅ zones.js юкланди');
