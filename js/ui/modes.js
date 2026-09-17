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

            card.addEventListener('click', () => this.selectMode(mode));
            list.appendChild(card);
        });
    },

    selectMode(mode) {
        console.log('🎮 Режим танланди:', mode.id);
        GameState.mode = mode;

        // Гуруҳ — алоҳида экран
        if (mode.id === 'group') {
            if (typeof GroupsUI !== 'undefined') GroupsUI.open();
            return;
        }

        // Классик — созламалар билан
        if (mode.id === 'classic') {
            showScreen('settingsScreen');
            return;
        }

        // Дунё ва Турнир — дарҳол бошлаш
        if (typeof Game !== 'undefined') {
            Game.startMode(mode);
        }
    }
};

console.log('✅ modes.js юкланди');




