// ===== Дунё режими логикаси =====
const WorldMode = {
    CYCLE_DURATION: 600,        // 10 дақиқа (секунд)
    JOIN_LIMIT: 180,            // Охирги 3 дақиқада кириш мумкин эмас
    MAX_BOTS: 200,              // Максимал ботлар
    MIN_BOTS: 20,               // Минимал ботлар
    MAP_SIZE: 5000,             // Карта ўлчами

    currentSession: null,
    sessionInterval: null,
    updateInterval: null,

    // ===== Сессия бошлаш/қўшилиш =====
    async start(user) {
        if (!RealtimeDB.isReady) {
            console.warn('⚠️ Realtime DB йўқ — локал режим');
            return this.startLocal(user);
        }

        // Жорий сессияни олиш
        let session = await RealtimeDB.getCurrentSession();

        if (!session || !session.active) {
            // Янги сессия яратиш
            session = await this.createSession();
        }

        // Вақт текшируви
        const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
        const remaining = this.CYCLE_DURATION - elapsed;

        if (remaining < this.JOIN_LIMIT) {
            // Кеч қолди — кейинги сессияни кутиш
            alert('⏰ Кеч қолдингиз!\n\nКейинги ўйин ' + Math.ceil(remaining) + ' сониядан кейин бошланади.');
            return this.waitForNextSession(user);
        }

        // Сессияга қўшилиш
        await RealtimeDB.joinSession(session.id, user);
        this.currentSession = session;

        // Ўйинни бошлаш
        this.launchGame(session, remaining);
    },

    // ===== Янги сессия яратиш =====
    async createSession() {
        const id = 'world_' + Date.now();
        const session = {
            id: id,
            startTime: Date.now(),
            active: true,
            players: {},
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        // Firebase'га ёзиш — кейинроқ
        // Ҳозирча локал
        return session;
    },

    // ===== Кейинги сессияни кутиш =====
    waitForNextSession(user) {
        const checkInterval = setInterval(async () => {
            const session = await RealtimeDB.getCurrentSession();
            if (!session || !session.active) {
                clearInterval(checkInterval);
                this.start(user);
            }
        }, 5000);
    },

    // ===== Ўйинни бошлаш =====
    launchGame(session, remainingTime) {
        console.log('🌍 Дунё ўйини бошланди:', session.id, '| Вақт:', remainingTime, 'сек');

        // Ўйинни ишга тушириш
        if (typeof Game !== 'undefined') {
            Game.startWorld(session, remainingTime);
        }
    },

    // ===== Локал режим (Firebase йўқ бўлса) =====
    startLocal(user) {
        console.log('🌍 Дунё режими (локал)');
        if (typeof Game !== 'undefined') {
            Game.startWorld({ id: 'local_' + Date.now() }, this.CYCLE_DURATION);
        }
    },

    // ===== Ботлар сонини ҳисоблаш =====
    calculateBots(playerCount) {
        // Ўйинчилар сонига қараб ботлар
        const botsNeeded = Math.max(
            this.MIN_BOTS,
            this.MAX_BOTS - playerCount * 5
        );
        return Math.min(this.MAX_BOTS, botsNeeded);
    },

    // ===== Сессияни тозалаш =====
    cleanup() {
        if (this.sessionInterval) clearInterval(this.sessionInterval);
        if (this.updateInterval) clearInterval(this.updateInterval);
        RealtimeDB.cleanup();
    }
};

console.log('✅ worldMode.js юкланди');
