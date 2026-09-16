// ===== Созламалар UI =====
const SettingsUI = {
    init() {
        const s = Storage.getSettings();
        GameState.settings = s;

        // Харита
        document.querySelectorAll('#mapSelector .opt-btn').forEach(b => {
            if (parseInt(b.dataset.map) === s.mapSize) b.classList.add('active');
            else b.classList.remove('active');
            b.addEventListener('click', () => {
                document.querySelectorAll('#mapSelector .opt-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                GameState.settings.mapSize = parseInt(b.dataset.map);
                Storage.saveSettings(GameState.settings);
            });
        });

        // Ботлар
        document.querySelectorAll('#botsSelector .opt-btn').forEach(b => {
            if (parseInt(b.dataset.bots) === s.bots) b.classList.add('active');
            else b.classList.remove('active');
            b.addEventListener('click', () => {
                document.querySelectorAll('#botsSelector .opt-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                GameState.settings.bots = parseInt(b.dataset.bots);
                Storage.saveSettings(GameState.settings);
            });
        });

        // Вақт
        document.querySelectorAll('#timeSelector .opt-btn').forEach(b => {
            if (parseInt(b.dataset.time) === s.gameTime) b.classList.add('active');
            else b.classList.remove('active');
            b.addEventListener('click', () => {
                document.querySelectorAll('#timeSelector .opt-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                GameState.settings.gameTime = parseInt(b.dataset.time);
                Storage.saveSettings(GameState.settings);
            });
        });

        document.getElementById('settingsBtn')?.addEventListener('click', () => showScreen('settingsScreen'));
        document.getElementById('settingsBackBtn')?.addEventListener('click', () => showScreen('zonesScreen'));
    }
};

console.log('✅ settings.js юкланди');
