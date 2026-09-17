// ===== Режим танлаш UI =====
const ModesUI = {
    init() {
        document.getElementById('modesBtn')?.addEventListener('click', () => this.open());
        document.getElementById('modesBackBtn')?.addEventListener('click', () => showScreen('zonesScreen'));
    },

    open() {
        showScreen('modesScreen');
        this.render();
    },

    render() {
        const list = document.getElementById('modesList');
        if (!list) return;
        list.innerHTML = '';

        GAME_MODES.forEach(mode => {
            const card = document.createElement('div');
            card.className = 'mode-card';
            card.style.borderColor = mode.color + '80';

            const best = Storage.getBest(mode.id);

            card.innerHTML = `
                <div class="mode-icon" style="background:${mode.color}20;border-color:${mode.color};">${mode.emoji}</div>
                <div class="mode-info">
                    <h3>${mode.name}</h3>
                    <p>${mode.desc}</p>
                    <p class="mode-best">🗺️ ${mode.mapSize}×${mode.mapSize} · 🍎 ${mode.foodCount} · Рекорд: ${best}</p>
                </div>
                <div class="mode-badge" style="background:${mode.color};">▶</div>
            `;

            card.addEventListener('click', () => {
                console.log('🎮 Режим танланди:', mode.id);
                this.selectMode(mode);
            });
            list.appendChild(card);
        });
    },

    selectMode(mode) {
        GameState.mode = mode;

        // Гуруҳ — алоҳида экран
        if (mode.id === 'group') {
            if (typeof GroupsUI !== 'undefined') GroupsUI.open();
            return;
        }

        // Турнир — турнир экранига
        if (mode.id === 'tournament') {
            if (typeof TournamentUI !== 'undefined') TournamentUI.open();
            return;
        }

        // Дунё — WorldMode орқали
        if (mode.id === 'world') {
            if (typeof WorldMode !== 'undefined' && TelegramAuth.user) {
                WorldMode.start(TelegramAuth.user);
            } else if (typeof Game !== 'undefined') {
                Game.startMode(mode);
            }
            return;
        }

        // ⚠️ КЛАССИК ва бошқа режимлар — дарҳол ўйинга
        console.log('🚀 Ўйин бошланмоқда:', mode.id);

        // Default созламалар
        GameState.settings.bots = mode.bots || 15;
        GameState.settings.gameTime = mode.gameTime || 180;
        GameState.settings.mapSize = mode.mapSize || 300;

        if (typeof Game !== 'undefined' && Game.startMode) {
            Game.startMode(mode);
        } else {
            console.error('❌ Game.startMode топилмади');
            alert('Хато: Game.startMode топилмади');
        }
    }
};

console.log('✅ modes.js юкланди (тузатилган)');
