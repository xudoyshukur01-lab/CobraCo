// ===== Дунё режими логикаси =====
const WorldMode = {
    CYCLE_DURATION: 600,        // 10 дақиқа
    JOIN_LIMIT: 180,            // Охирги 3 дақиқада кириш мумкин эмас
    MAX_PLAYERS: 200,           // ⚠️ 200 ўйинчи лимити
    MAP_SIZE: 1500,             // Карта ўлчами
    BOT_MIN: 20,                // Минимал ботлар
    BOT_MAX: 200,               // Максимал ботлар

    currentSession: null,

    // ===== Ўйинчилар сонини ҳисоблаш =====
    getPlayerCount() {
        if (!RealtimeDB.isReady || !this.currentSession) return 1;
        const players = this.currentSession.players || {};
        return Object.keys(players).length;
    },

    // ===== Ботлар сонини ҳисоблаш =====
    // 200 - реал ўйинчилар = ботлар
    calculateBots(playerCount) {
        const bots = Math.max(
            this.BOT_MIN,
            Math.min(this.BOT_MAX, this.MAX_PLAYERS - playerCount)
        );
        console.log('🤖 Ботлар:', bots, '| Ўйинчилар:', playerCount, '| Жами:', bots + playerCount);
        return bots;
    },

    // ===== Сессия бошлаш =====
    async start(user) {
        if (!RealtimeDB.isReady) {
            console.warn('⚠️ Realtime DB йўқ — локал режим');
            return this.startLocal(user);
        }

        let session = await RealtimeDB.getCurrentSession();

        if (!session || !session.active) {
            session = await this.createSession();
        }

        const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
        const remaining = this.CYCLE_DURATION - elapsed;

        if (remaining < this.JOIN_LIMIT) {
            alert('⏰ Кеч қолдингиз!\n\nКейинги ўйин ' + Math.ceil(remaining) + ' сониядан кейин бошланади.');
            return this.waitForNextSession(user);
        }

        // Ўйинчилар сонини текшириш
        const playerCount = Object.keys(session.players || {}).length;
        if (playerCount >= this.MAX_PLAYERS) {
            alert('❌ Ўйин тўлди! (200/200)\n\nКейинги ўйинни кутинг.');
            return this.waitForNextSession(user);
        }

        await RealtimeDB.joinSession(session.id, user);
        this.currentSession = session;

        this.launchGame(session, remaining);
    },

    async createSession() {
        const id = 'world_' + Date.now();
        return {
            id: id,
            startTime: Date.now(),
            active: true,
            players: {}
        };
    },

    waitForNextSession(user) {
        const checkInterval = setInterval(async () => {
            const session = await RealtimeDB.getCurrentSession();
            if (!session || !session.active) {
                clearInterval(checkInterval);
                this.start(user);
            }
        }, 5000);
    },

    launchGame(session, remainingTime) {
        console.log('🌍 Дунё ўйини:', session.id, '| Вақт:', remainingTime, 'с');

        if (typeof Game !== 'undefined') {
            Game.startWorld(session, remainingTime);
        }
    },

    startLocal(user) {
        console.log('🌍 Дунё режими (локал)');
        if (typeof Game !== 'undefined') {
            Game.startWorld({ id: 'local_' + Date.now(), players: {} }, this.CYCLE_DURATION);
        }
    }
};

console.log('✅ worldMode.js юкланди (200 лимит)');
