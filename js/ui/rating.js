// ===== Рейтинг UI (кубок бўйича + ботлар) =====
const RatingUI = {
    currentScope: 'global',
    loading: false,

    init() {
        document.getElementById('ratingBtn')?.addEventListener('click', () => this.open());
        document.getElementById('ratingBackBtn')?.addEventListener('click', () => showScreen('zonesScreen'));

        document.querySelectorAll('.tab-btn').forEach(t => {
            t.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                this.currentScope = t.dataset.scope;
                this.load();
            });
        });
    },

    async open() {
        showScreen('ratingScreen');
        this.updateTabs();
        await this.load();
    },

    updateTabs() {
        const region = Regions.getRegion();
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(t => {
            const scope = t.dataset.scope;
            if (scope === 'global') {
                t.textContent = '🌍 Дунё';
            } else if (scope === 'country') {
                const flag = Regions.getCountryFlag(region?.countryCode);
                const name = Regions.getCountryName(region?.countryCode);
                t.textContent = flag + ' ' + name;
            } else if (scope === 'region') {
                t.textContent = '📍 ' + (region?.region || 'Вилоят');
            }
        });
    },

    async load() {
        const list = document.getElementById('ratingList');
        if (!list) return;
        list.innerHTML = '<div class="rating-loading">Юкланмоқда...</div>';
        if (this.loading) return;
        this.loading = true;

        try {
            // Ботларни ҳам қўшиш
            if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isReady) {
                await FirebaseDB.addBotsToLeaderboard(this.currentScope);
            }

            const data = await FirebaseDB.getFullLeaderboard(this.currentScope, 100);
            list.innerHTML = '';

            if (!data || data.length === 0) {
                list.innerHTML = '<div class="rating-loading">Ҳали натижалар йўқ<br><small>Биринчи бўлиб ўйнанг!</small></div>';
                this.loading = false;
                return;
            }

            const myId = TelegramAuth.user ? TelegramAuth.user.id : 0;

            data.forEach((d, i) => {
                const rank = i + 1;
                const isMe = !d.isBot && d.telegramId === myId;
                const isBot = d.isBot === true;

                let name;
                if (isBot) {
                    name = '🤖 ' + (d.firstName || 'Бот');
                } else {
                    name = d.username ? '@' + d.username : (d.firstName + ' ' + (d.lastName || '')).trim();
                }

                const trophies = d.trophies || 0;
                const rankInfo = Trophies.getRank(trophies);

                const row = document.createElement('div');
                row.className = 'rating-row' + (isMe ? ' me' : '') + (isBot ? ' bot' : '') + (rank <= 3 ? ' top' + rank : '');
                row.innerHTML = `
                    <div class="rating-rank">${rank}</div>
                    <div class="rating-info">
                        <div class="rating-name">${name}${isMe ? ' <small style="color:#4ade80">(сиз)</small>' : ''}</div>
                        <div class="rating-trophies">${rankInfo.icon} ${rankInfo.name}</div>
                    </div>
                    <div class="rating-trophy">🏆 ${trophies}</div>
                `;
                list.appendChild(row);
            });
        } catch (e) {
            console.error(e);
            list.innerHTML = '<div class="rating-loading">Хато юз берди</div>';
        }
        this.loading = false;
    }
};

console.log('✅ rating.js юкланди (ботлар билан)');
