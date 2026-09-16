// ===== CobraCo - Кириш нуқтаси =====
console.log('🐍 CobraCo ишга тушди');

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

window.addEventListener('DOMContentLoaded', async () => {
    // 1. Firebase
    FirebaseDB.init();

    // 2. Telegram
    const user = TelegramAuth.init();
    GameState.user = user;

    // 3. Созламалар
    GameState.settings = Storage.getSettings();

    // 4. UI инициализация
    Game.init();
    ZonesUI.init();
    SettingsUI.init();
    RatingUI.init();
    RegionsUI.init();
    ChampionshipUI.init();
    SkinsUI.init();
    GroupsUI.init();

    // 5. Фойдаланувчи маълумотлари
    document.getElementById('userName').textContent = TelegramAuth.getDisplayName();
    document.getElementById('userId').textContent = user.id > 0 ? 'ID: ' + user.id : '';

    // 6. Регион борми?
    const hasRegion = Regions.hasRegion();

    if (hasRegion && user.id > 0) {
        await FirebaseDB.saveUser(user);

        // Кубоклар
        const trophies = await FirebaseDB.getTrophies();
        Storage.saveTrophies(trophies);
        Game.playerTrophies = trophies;
        TrophiesUI.updateHeader(trophies);

        // Кристаллар
        const crystals = await FirebaseDB.getCrystals();
        Crystals.saveTotal(crystals);
        ChampionshipUI.updateCrystals();

        // Менюга
        showUserRegion();
        setTimeout(() => showScreen('zonesScreen'), 600);

        // Чемпионат текшируви (15 дақиқада бир)
        if (Championship.shouldCheck()) {
            setTimeout(() => Championship.checkAllLeaderboards(), 2000);
        }
    } else if (!hasRegion) {
        setTimeout(() => showScreen('regionScreen'), 600);
    } else {
        setTimeout(() => showScreen('regionScreen'), 600);
    }

    document.getElementById('changeRegionBtn')?.addEventListener('click', () => {
        RegionsUI.open();
    });

    document.getElementById('bestScore').textContent = Storage.getTotalBest();
    // Илон preview ни ишга тушириш (менюда кўринганда)
    setTimeout(() => {
        if (typeof SkinPreview !== 'undefined' && !SkinPreview.animationId) {
            SkinPreview.initAll();
        }
    }, 800);

    console.log('✅ Ҳамма нарса тайёр');
});

function showUserRegion() {
    const el = document.getElementById('userRegion');
    if (!el) return;
    const region = Regions.getRegion();
    if (!region) { el.textContent = ''; return; }
    const flag = Regions.getCountryFlag(region.countryCode);
    el.innerHTML = `${flag} ${region.region}`;
}





