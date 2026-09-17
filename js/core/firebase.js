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
                console.log('✅ Янги фойдаланувчи');
            } else {
                const update = { lastPlayedAt: firebase.firestore.FieldValue.serverTimestamp() };
                if (region) { update.countryCode = region.countryCode; update.region = region.region; }
                await ref.update(update);
            }
        } catch (e) { console.error('❌ saveUser:', e.message); }
    },

    // ===== Кубоклар =====
    async getTrophies() {
        if (!this.isReady || !this.user) return 0;
        try {
            const doc = await this.db.collection('users').doc(String(this.user.id)).get();
            return doc.exists ? (doc.data().trophies || 0) : 0;
        } catch (e) { return 0; }
    },

    async updateTrophies(newTotal) {
        if (!this.isReady || !this.user) return;
        try {
            await this.db.collection('users').doc(String(this.user.id)).update({
                trophies: newTotal
            });
            console.log('🏆 Кубоклар янгиланди:', newTotal);
        } catch (e) { console.error('❌ updateTrophies:', e.message); }
    },

    // ===== Кристаллар =====
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
        } catch (e) { console.error('❌ addCrystals:', e.message); }
    },

    // ===== Рейтингга қўшиш (кубок бўйича) =====
    // ===== БОТ КУБОКЛАРИ =====
    // Ботлар ҳам кубок йиғади, Firebase'да сақланади
    async getBotTrophy(botId) {
        if (!this.isReady) return 0;
        try {
            const doc = await this.db.collection('bots').doc(String(botId)).get();
            if (!doc.exists) return 0;
            const data = doc.data();
            return data.trophies || 0;
        } catch (e) { return 0; }
    },

    async updateBotTrophy(botId, newTotal, botData) {
        if (!this.isReady) return;
        try {
            await this.db.collection('bots').doc(String(botId)).set({
                botId: botId,
                name: botData?.name || 'Бот',
                trophies: newTotal,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('🤖 Бот кубоки сақланди:', botId, newTotal);
        } catch (e) { console.error('❌ updateBotTrophy:', e.message); }
    },

    // Барча ботларни олиш (рейтингга қўшиш учун)
    async getBotsLeaderboard(scope, limit = 50) {
        if (!this.isReady) return [];
        try {
            const snap = await this.db.collection('bots')
                .orderBy('trophies', 'desc')
                .limit(limit)
                .get();
            const bots = [];
            snap.docs.forEach(doc => {
                const d = doc.data();
                bots.push({
                    isBot: true,
                    botId: d.botId,
                    name: d.name || '🤖 Бот',
                    trophies: d.trophies || 0,
                    username: 'bot_' + d.botId,
                    firstName: d.name || 'Бот'
                });
            });
            return bots;
        } catch (e) { console.error('❌ getBotsLeaderboard:', e.message); return []; }
    },

    // Ботларни рейтингга қўшиш
    async addBotsToLeaderboard(scope) {
        if (!this.isReady) return;
        try {
            const bots = await this.getBotsLeaderboard('global', 100);
            const region = Regions.getRegion();
            if (!region) return;

            const docId = Regions.getLeaderboardId(scope, region.countryCode, region.region);
            const ref = this.db.collection('leaderboard').doc(docId).collection('scores');

            for (const bot of bots) {
                await ref.doc('bot_' + bot.botId).set({
                    telegramId: 0,
                    isBot: true,
                    botId: bot.botId,
                    username: '',
                    firstName: bot.name,
                    lastName: '',
                    trophies: bot.trophies,
                    countryCode: region.countryCode,
                    region: region.region,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            console.log('🤖 Ботлар рейтингга қўшилди:', bots.length);
        } catch (e) { console.error('❌ addBotsToLeaderboard:', e.message); }
    },

    // Рейтингни олиш — ботлар билан
    async getFullLeaderboard(scope, limit = 100) {
        if (!this.isReady) return [];
        const region = Regions.getRegion();
        if (!region) return [];

        const docId = Regions.getLeaderboardId(scope, region.countryCode, region.region);

        try {
            const snap = await this.db.collection('leaderboard').doc(docId)
                .collection('scores')
                .orderBy('trophies', 'desc')
                .limit(limit)
                .get();

            return snap.docs.map(doc => {
                const d = doc.data();
                return {
                    ...d,
                    displayName: d.isBot ? (d.firstName || '🤖 Бот') :
                                 (d.username ? '@' + d.username : (d.firstName + ' ' + (d.lastName || '')).trim())
                };
            });
        } catch (e) {
            console.error('❌ getFullLeaderboard:', e.message);
            return [];
        }
    },
    async addToLeaderboard(scope, trophies) {
        if (!this.isReady || !this.user) return;
        const region = Regions.getRegion();
        if (!region) return;
        const docId = Regions.getLeaderboardId(scope, region.countryCode, region.region);
        try {
            await this.db.collection('leaderboard').doc(docId)
                .collection('scores').doc(String(this.user.id)).set({
                    telegramId: this.user.id,
                    username: this.user.username || '',
                    firstName: this.user.firstName || '',
                    lastName: this.user.lastName || '',
                    trophies: trophies,
                    countryCode: region.countryCode,
                    region: region.region,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            console.log('🏆 Рейтингга қўшилди:', docId, trophies);
        } catch (e) { console.error('❌ addToLeaderboard:', e.message); }
    },

    // ===== Рейтингни олиш (кубок бўйича) =====
    async getLeaderboard(scope, limit = 100) {
        return await this.getFullLeaderboard(scope, limit);
    },

    // ===== Балл сақлаш (эски мослик учун) =====
    async saveScore(zoneId, score) {
        if (!this.isReady || !this.user) return;
        const ref = this.db.collection('users').doc(String(this.user.id));
        try {
            const doc = await ref.get();
            if (doc.exists) {
                const data = doc.data();
                const bestScores = data.bestScores || {};
                const oldBest = bestScores[zoneId] || 0;
                if (score > oldBest) {
                    bestScores[zoneId] = score;
                }
                await ref.update({
                    bestScores: bestScores,
                    totalGames: (data.totalGames || 0) + 1
                });
            }
        } catch (e) { console.error('❌ saveScore:', e.message); }
    },

    // ===== ГУРУҲЛАР (ўзгаришсиз) =====
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

console.log('✅ firebase.js юкланди (кубок рейтинги)');

