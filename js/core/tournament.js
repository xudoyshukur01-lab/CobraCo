// ===== Турнир тизими =====
const Tournament = {
    SIZE: 32,                    // 32 ўйинчи
    START_INTERVAL: 3600,        // Ҳар соат
    ROUND_TIME: 300,             // Ҳар раунд 5 дақиқа
    REWARDS: {
        1: 500,   // 🥇 Ғолиб
        2: 250,   // 🥈 2-ўрин
        3: 100,   // 🥉 3-ўрин (ярим финал)
        4: 50     // 4-ўрин (ярим финал)
    },

    currentTournament: null,
    currentRound: null,
    currentMatch: null,

    // ===== Турнир яратиш =====
    async createTournament() {
        if (!RealtimeDB.isReady) {
            console.warn('⚠️ Realtime DB йўқ');
            return null;
        }

        const id = 'tourney_' + Date.now();
        const tournament = {
            id: id,
            size: this.SIZE,
            players: {},
            rounds: {},
            currentRound: 1,
            active: true,
            startTime: Date.now(),
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        try {
            await RealtimeDB.db.ref('tournaments/' + id).set(tournament);
            console.log('✅ Турнир яратилди:', id);
            return tournament;
        } catch (e) {
            console.error('❌ createTournament:', e.message);
            return null;
        }
    },

    // ===== Турнирга қўшилиш =====
    async join(tournamentId, user) {
        if (!RealtimeDB.isReady || !user) return false;
        try {
            const ref = RealtimeDB.db.ref('tournaments/' + tournamentId);
            const snap = await ref.once('value');
            const t = snap.val();
            if (!t) return false;
            if (!t.active) {
                alert('Турнир фаол эмас');
                return false;
            }
            const players = t.players || {};
            if (Object.keys(players).length >= this.SIZE) {
                alert('Турнир тўлди');
                return false;
            }

            await ref.child('players/' + user.id).set({
                telegramId: user.id,
                username: user.username || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });

            console.log('✅ Турнирга қўшилди:', tournamentId);
            return true;
        } catch (e) {
            console.error('❌ join:', e.message);
            return false;
        }
    },

    // ===== Жадвални яратиш =====
    async generateBracket(tournamentId) {
        if (!RealtimeDB.isReady) return;
        try {
            const ref = RealtimeDB.db.ref('tournaments/' + tournamentId);
            const snap = await ref.once('value');
            const t = snap.val();
            if (!t) return;

            const playerIds = Object.keys(t.players || {});
            if (playerIds.length < this.SIZE) {
                console.warn('⚠️ Ўйинчилар кам:', playerIds.length);
                return;
            }

            // Тасодифий аралаштириш
            for (let i = playerIds.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
            }

            // 1/16 финал — 16 ўйин
            const matches = [];
            for (let i = 0; i < 16; i++) {
                matches.push({
                    id: 'r1_m' + i,
                    round: 1,
                    player1: playerIds[i * 2],
                    player2: playerIds[i * 2 + 1],
                    winner: null,
                    status: 'pending'
                });
            }

            await ref.child('rounds/1').set({ matches: matches });
            console.log('✅ 1/16 финал жадвали яратилди');
        } catch (e) {
            console.error('❌ generateBracket:', e.message);
        }
    },

    // ===== Жорий турнирни олиш =====
    async getCurrent() {
        if (!RealtimeDB.isReady) return null;
        try {
            const snap = await RealtimeDB.db.ref('tournaments').orderByChild('active').equalTo(true).limitToLast(1).once('value');
            const data = snap.val() || {};
            const arr = Object.values(data);
            return arr.length > 0 ? arr[0] : null;
        } catch (e) { return null; }
    },

    // ===== Ўйинчи ўйнаши мумкинми? =====
    async canPlay(tournamentId, userId) {
        if (!RealtimeDB.isReady) return false;
        try {
            const ref = RealtimeDB.db.ref('tournaments/' + tournamentId);
            const snap = await ref.once('value');
            const t = snap.val();
            if (!t) return false;

            const currentRound = t.currentRound || 1;
            const round = t.rounds && t.rounds[currentRound];
            if (!round) return false;

            for (const match of round.matches) {
                if (match.player1 === userId || match.player2 === userId) {
                    if (match.status === 'pending') {
                        return { match: match, round: currentRound };
                    }
                }
            }
            return false;
        } catch (e) { return false; }
    },

    // ===== Ўйин натижасини ёзиш =====
    async submitResult(tournamentId, matchId, round, winnerId) {
        if (!RealtimeDB.isReady) return;
        try {
            const ref = RealtimeDB.db.ref('tournaments/' + tournamentId + '/rounds/' + round + '/matches');
            const snap = await ref.once('value');
            const matches = snap.val() || [];

            for (const m of matches) {
                if (m.id === matchId) {
                    m.winner = winnerId;
                    m.status = 'done';
                    break;
                }
            }

            await ref.set(matches);

            // Барча ўйинлар тугадими?
            const allDone = matches.every(m => m.status === 'done');
            if (allDone) {
                await this.nextRound(tournamentId, round);
            }
        } catch (e) {
            console.error('❌ submitResult:', e.message);
        }
    },

    // ===== Кейинги раунд =====
    async nextRound(tournamentId, currentRound) {
        if (!RealtimeDB.isReady) return;
        try {
            const ref = RealtimeDB.db.ref('tournaments/' + tournamentId);
            const snap = await ref.once('value');
            const t = snap.val();

            const prevRound = t.rounds[currentRound];
            const winners = prevRound.matches.map(m => m.winner).filter(w => w);

            if (winners.length === 1) {
                // Финал тугади — ғолиб
                await ref.update({
                    active: false,
                    winner: winners[0],
                    endTime: Date.now()
                });
                console.log('🏆 Турнир тугади! Ғолиб:', winners[0]);
                return;
            }

            // Янги раунд
            const nextRoundNum = currentRound + 1;
            const newMatches = [];
            for (let i = 0; i < winners.length; i += 2) {
                newMatches.push({
                    id: 'r' + nextRoundNum + '_m' + (i / 2),
                    round: nextRoundNum,
                    player1: winners[i],
                    player2: winners[i + 1] || null,
                    winner: null,
                    status: 'pending'
                });
            }

            await ref.child('rounds/' + nextRoundNum).set({ matches: newMatches });
            await ref.update({ currentRound: nextRoundNum });

            console.log('✅ Раунд', nextRoundNum, 'бошланди');
        } catch (e) {
            console.error('❌ nextRound:', e.message);
        }
    },

    // ===== Раунд номи =====
    getRoundName(round, totalRounds) {
        const names = {
            1: '1/16 финал',
            2: '1/8 финал',
            3: '1/4 финал',
            4: '1/2 финал',
            5: 'Финал'
        };
        return names[round] || 'Раунд ' + round;
    }
};

console.log('✅ tournament.js юкланди');
