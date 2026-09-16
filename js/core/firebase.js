// ===== Firebase Firestore =====
const FirebaseDB = {
    db: null, user: null, isReady: false,

    init() {
        console.log('🔥 Firebase init...');
        if (typeof firebase === 'undefined') { return false; }
        const firebaseConfig = {
            apiKey: "AIzaSyAa4Fg8gTB7nskTj_k1cFn6LMiWR_21LwY",
            authDomain: "cobraco-7725b.firebaseapp.com",
            projectId: "cobraco-7725b",
            storageBucket: "cobraco-7725b.firebasestorage.app",
            messagingSenderId: "918580144501",
            appId: "1:918580144501:web:efdbf633f29c906a188b3c"
        };
        try {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            this.isReady = true;
            console.log('✅ Firebase уланди');
            return true;
        } catch (e) { console.error('❌ Firebase:', e.message); return false; }
    },

    // ===== Фойдаланувчи =====
    async saveUser(user) {
        if (!this.isReady || !user.id) return;
        this.user = user;
        const ref = this.db.collection('users').doc(String(user.id));
        try {
            const doc = await ref.get();
            const region = Regions.getRegion();
            if (!doc.exists) {
                await ref.set({
                    telegramId: user.id, username: user.username || '',
                    firstName: user.firstName || '', lastName: user.lastName || '',
                    trophies: 0, crystals: 0,
                    bestScores: { classic: 0 }, totalGames: 0,
                    countryCode: region?.countryCode || '', region: region?.region || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastPlayedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                const update = { lastPlayedAt: firebase.firestore.FieldValue.serverTimestamp() };
                if (region) { update.countryCode = region.countryCode; update.region = region.region; }
                await ref.update(update);
            }
        } catch (e) { console.error('❌ saveUser:', e.message); }
    },

    async getTrophies() {
        if (!this.isReady || !this.user) return 0;
        try {
            const doc = await this.db.collection('users').doc(String(this.user.id)).get();
            return doc.exists ? (doc.data().trophies || 0) : 0;
        } catch (e) { return 0; }
    },
    async updateTrophies(v) {
        if (!this.isReady || !this.user) return;
        try { await this.db.collection('users').doc(String(this.user.id)).update({ trophies: v }); }
        catch (e) { console.error(e.message); }
    },

    async getCrystals() {
        if (!this.isReady || !this.user) return 0;
        try {
            const doc = await this.db.collection('users').doc(String(this.user.id)).get();
            return doc.exists ? (doc.data().crystals || 0) : 0;
        } catch (e) { return 0; }
    },
    async addCrystals(amount) {
        if (!this.isReady || !this.user) return;
        try {
            await this.db.collection('users').doc(String(this.user.id)).update({
                crystals: firebase.firestore.FieldValue.increment(amount)
            });
        } catch (e) { console.error(e.message); }
    },

    // ===== Баллни сақлаш (барча рейтингларга) =====
    async saveScore(zoneId, score) {
        if (!this.isReady || !this.user) return;
        try {
            // Ҳар бир рейтингга қўшиш
            const scopes = ['global', 'country', 'region'];
            for (const scope of scopes) {
                await this.addToLeaderboard(scope, score);
            }

            // Фойдаланувчининг шахсий рекордини янгилаш
            const ref = this.db.collection('users').doc(String(this.user.id));
            const doc = await ref.get();
            if (doc.exists) {
                const data = doc.data();
                const bestScores = data.bestScores || {};
                const oldBest = bestScores[zoneId] || 0;
                if (score > oldBest) {
                    bestScores[zoneId] = score;
                    await ref.update({
                        bestScores: bestScores,
                        totalGames: (data.totalGames || 0) + 1
                    });
                } else {
                    await ref.update({
                        totalGames: (data.totalGames || 0) + 1
                    });
                }
            }
            console.log('✅ Балл сақланди:', score, '(барча рейтингларга)');
        } catch (e) {
            console.error('❌ saveScore:', e.message);
        }
    },
    async addToLeaderboard(scope, score) {
        if (!this.isReady || !this.user) return;
        const region = Regions.getRegion();
        if (!region) return;
        const docId = Regions.getLeaderboardId(scope, region.countryCode, region.region);
        try {
            await this.db.collection('leaderboard').doc(docId).collection('scores').add({
                telegramId: this.user.id, username: this.user.username || '',
                firstName: this.user.firstName || '', lastName: this.user.lastName || '',
                score: score, countryCode: region.countryCode, region: region.region,
                date: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) { console.error(e.message); }
    },

    async getLeaderboard(scope, limit = 100) {
        if (!this.isReady) return [];
        const region = Regions.getRegion();
        if (!region) return [];
        const docId = Regions.getLeaderboardId(scope, region.countryCode, region.region);
        try {
            const snap = await this.db.collection('leaderboard').doc(docId)
                .collection('scores').orderBy('score','desc').limit(limit * 3).get();
            const seen = new Map();
            snap.docs.forEach(doc => {
                const d = doc.data();
                const k = String(d.telegramId);
                if (!seen.has(k) || seen.get(k).score < d.score) seen.set(k, d);
            });
            return Array.from(seen.values()).sort((a,b) => b.score - a.score).slice(0, limit);
        } catch (e) { return []; }
    },

    // ===== ГУРУҲЛАР =====
    async createGroup(groupId, user) {
        if (!this.isReady) throw new Error('Firebase йўқ');
        const ref = this.db.collection('groups').doc(groupId);
        const members = {};
        members[String(user.id)] = {
            telegramId: user.id, username: user.username || '',
            firstName: user.firstName || '', lastName: user.lastName || '',
            score: 0, joinedAt: Date.now()
        };
        await ref.set({
            id: groupId, creator: user.id, members: members,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastPlayedAt: null
        });
    },

    async getGroup(groupId) {
        if (!this.isReady) return null;
        try {
            const doc = await this.db.collection('groups').doc(groupId).get();
            return doc.exists ? doc.data() : null;
        } catch (e) { return null; }
    },

    async joinGroup(groupId, user) {
        if (!this.isReady) throw new Error('Firebase йўқ');
        const ref = this.db.collection('groups').doc(groupId);
        const key = 'members.' + user.id;
        const update = {};
        update[key] = {
            telegramId: user.id, username: user.username || '',
            firstName: user.firstName || '', lastName: user.lastName || '',
            score: 0, joinedAt: Date.now()
        };
        await ref.update(update);
    },

    async leaveGroup(groupId, userId) {
        if (!this.isReady) return;
        const ref = this.db.collection('groups').doc(groupId);
        const key = 'members.' + userId;
        const update = {};
        update[key] = firebase.firestore.FieldValue.delete();
        await ref.update(update);
    },

    subscribeGroup(groupId, callback) {
        if (!this.isReady) return null;
        return this.db.collection('groups').doc(groupId).onSnapshot(doc => {
            callback(doc.exists ? doc.data() : null);
        });
    },

    async updateMemberScore(groupId, userId, score) {
        if (!this.isReady) return;
        const ref = this.db.collection('groups').doc(groupId);
        const key = 'members.' + userId + '.score';
        const update = {};
        update[key] = score;
        update['lastPlayedAt'] = firebase.firestore.FieldValue.serverTimestamp();
        await ref.update(update);
    },

    async getGroupLeaderboard(groupId, limit = 10) {
        if (!this.isReady) return [];
        try {
            const doc = await this.db.collection('groups').doc(groupId).get();
            if (!doc.exists) return [];
            const members = doc.data().members || {};
            return Object.values(members)
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .slice(0, limit);
        } catch (e) { return []; }
    }
};

console.log('✅ firebase.js юкланди');

