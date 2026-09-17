// ===== Турнир UI =====
const TournamentUI = {
    tournamentId: null,
    tournamentData: null,
    unsubscribe: null,

    init() {
        document.getElementById('tournamentBackBtn')?.addEventListener('click', () => this.back());
        document.getElementById('tournamentJoinBtn')?.addEventListener('click', () => this.joinTournament());
    },

    async open() {
        showScreen('tournamentScreen');
        await this.load();
    },

    back() {
        if (this.unsubscribe) this.unsubscribe();
        showScreen('modesScreen');
    },

    async load() {
        const t = await Tournament.getCurrent();

        if (!t) {
            this.showEmpty();
            return;
        }

        this.tournamentId = t.id;
        this.tournamentData = t;
        this.render(t);

        // Real-time янгиланиш
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = RealtimeDB.subscribeSession('tournaments/' + t.id, (data) => {
            if (data) {
                this.tournamentData = data;
                this.render(data);
            }
        });
    },

    showEmpty() {
        document.getElementById('tournamentEmpty').style.display = 'block';
        document.getElementById('tournamentBracket').style.display = 'none';
    },

    render(t) {
        document.getElementById('tournamentEmpty').style.display = 'none';
        document.getElementById('tournamentBracket').style.display = 'block';

        const players = t.players || {};
        const playerCount = Object.keys(players).length;

        // Статистика
        document.getElementById('tourneyPlayers').textContent = playerCount + ' / ' + Tournament.SIZE;
        document.getElementById('tourneyRound').textContent = Tournament.getRoundName(t.currentRound || 1, 5);
        document.getElementById('tourneyStatus').textContent = t.active ? '🟢 Фаол' : '🔴 Тугаган';

        // Ўйинчи борми?
        const myId = TelegramAuth.user ? TelegramAuth.user.id : 0;
        const amIn = players[myId];

        const joinBtn = document.getElementById('tournamentJoinBtn');
        if (amIn) {
            joinBtn.textContent = '✅ Сиз турнирдасиз';
            joinBtn.disabled = true;
            joinBtn.style.opacity = '0.6';
        } else if (playerCount >= Tournament.SIZE) {
            joinBtn.textContent = '❌ Турнир тўлди';
            joinBtn.disabled = true;
        } else {
            joinBtn.textContent = '➕ Турнирга қўшилиш';
            joinBtn.disabled = false;
        }

        // Жадвал
        this.renderBracket(t);
    },

    renderBracket(t) {
        const el = document.getElementById('bracketContent');
        if (!el) return;

        const rounds = t.rounds || {};
        el.innerHTML = '';

        for (let r = 1; r <= 5; r++) {
            const round = rounds[r];
            if (!round) continue;

            const section = document.createElement('div');
            section.className = 'bracket-round';

            const header = document.createElement('h3');
            header.textContent = Tournament.getRoundName(r, 5);
            section.appendChild(header);

            const matches = round.matches || [];
            const list = document.createElement('div');
            list.className = 'bracket-matches';

            matches.forEach(m => {
                const match = document.createElement('div');
                match.className = 'bracket-match' + (m.status === 'done' ? ' done' : '');

                const p1 = t.players[m.player1] || { firstName: '?' };
                const p2 = t.players[m.player2] || { firstName: '?' };
                const n1 = p1.username ? '@' + p1.username : (p1.firstName || '?');
                const n2 = p2.username ? '@' + p2.username : (p2.firstName || '?');

                const w1 = m.winner === m.player1;
                const w2 = m.winner === m.player2;

                match.innerHTML = `
                    <div class="bracket-player ${w1 ? 'winner' : ''}">${n1}</div>
                    <div class="bracket-vs">vs</div>
                    <div class="bracket-player ${w2 ? 'winner' : ''}">${n2}</div>
                `;
                list.appendChild(match);
            });

            section.appendChild(list);
            el.appendChild(section);
        }
    },

    async joinTournament() {
        const user = TelegramAuth.user;
        if (!user || !user.id) {
            alert('Telegram ID керак!');
            return;
        }

        let t = await Tournament.getCurrent();
        if (!t) {
            t = await Tournament.createTournament();
        }

        const ok = await Tournament.join(t.id, user);
        if (ok) {
            alert('✅ Турнирга қўшилдингиз!');
            await this.load();

            // 32 та тўлдими?
            const players = Object.keys(t.players || {}).length;
            if (players + 1 >= Tournament.SIZE) {
                await Tournament.generateBracket(t.id);
            }
        }
    }
};

console.log('✅ tournamentUI.js юкланди');
