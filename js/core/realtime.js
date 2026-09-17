// ===== Firebase Realtime Database =====
const RealtimeDB = {
    db: null,
    isReady: false,
    ref: null,
    listeners: [],

    init() {
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase юқланмаган');
            return false;
        }
        try {
            // Firestore аллақачон инициализация қилинган
            this.db = firebase.database();
            this.isReady = true;
            console.log('✅ Realtime Database уланди');
            return true;
        } catch (e) {
            console.error('❌ Realtime DB:', e.message);
            return false;
        }
    },

    // ===== Ўйин сессиясини олиш =====
    async getCurrentSession() {
        if (!this.isReady) return null;
        try {
            const snap = await this.db.ref('world/sessions/current').once('value');
            return snap.val();
        } catch (e) { return null; }
    },

    // ===== Ўйинчини сессияга қўшиш =====
    async joinSession(sessionId, user) {
        if (!this.isReady || !user) return;
        try {
            const ref = this.db.ref('world/sessions/' + sessionId + '/players/' + user.id);
            await ref.set({
                telegramId: user.id,
                username: user.username || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                score: 0,
                alive: true,
                joinedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ Сессияга қўшилди:', sessionId);
        } catch (e) { console.error('❌ joinSession:', e.message); }
    },

    // ===== Ўйинчи баллини янгилаш =====
    async updateScore(sessionId, userId, score) {
        if (!this.isReady || !userId) return;
        try {
            await this.db.ref('world/sessions/' + sessionId + '/players/' + userId).update({
                score: score,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (e) { console.error('❌ updateScore:', e.message); }
    },

    // ===== Сессияни кузатиш (real-time) =====
    subscribeSession(sessionId, callback) {
        if (!this.isReady) return null;
        const ref = this.db.ref('world/sessions/' + sessionId);
        const handler = ref.on('value', snap => {
            callback(snap.val());
        });
        this.listeners.push({ ref, handler });
        return () => ref.off('value', handler);
    },

    // ===== Фаол сессияларни олиш =====
    async getActiveSessions() {
        if (!this.isReady) return [];
        try {
            const snap = await this.db.ref('world/sessions').orderByChild('active').equalTo(true).once('value');
            const data = snap.val() || {};
            return Object.values(data);
        } catch (e) { return []; }
    },

    // ===== Ҳамма listener'ларни тозалаш =====
    cleanup() {
        this.listeners.forEach(l => {
            if (l.ref && l.handler) l.ref.off('value', l.handler);
        });
        this.listeners = [];
    }
};

console.log('✅ realtime.js юкланди');
