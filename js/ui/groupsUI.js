// ===== Гуруҳ UI =====
const GroupsUI = {
    currentGroupId: null,
    currentGroupData: null,
    unsubscribe: null,

    init() {
        document.getElementById('groupsBtn')?.addEventListener('click', () => this.open());
        document.getElementById('groupsBackBtn')?.addEventListener('click', () => this.back());
        document.getElementById('createGroupBtn')?.addEventListener('click', () => this.showCreateDialog());
        document.getElementById('joinGroupBtn')?.addEventListener('click', () => this.showJoinDialog());
        document.getElementById('groupStartBtn')?.addEventListener('click', () => this.startGroupGame());
        document.getElementById('groupLeaveBtn')?.addEventListener('click', () => this.leaveGroup());
        document.getElementById('groupShareBtn')?.addEventListener('click', () => this.shareGroup());
        document.getElementById('groupCopyBtn')?.addEventListener('click', () => this.copyCode());
        document.getElementById('confirmCreateBtn')?.addEventListener('click', () => this.createGroup());
        document.getElementById('confirmJoinBtn')?.addEventListener('click', () => this.joinGroup());
        document.getElementById('cancelCreateBtn')?.addEventListener('click', () => this.closeModal('createModal'));
        document.getElementById('cancelJoinBtn')?.addEventListener('click', () => this.closeModal('joinModal'));
    },

    open() {
        showScreen('groupsScreen');
        const current = Groups.getCurrent();
        if (current) {
            this.loadGroup(current);
        } else {
            this.showGroupMenu();
        }
    },

    back() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        showScreen('zonesScreen');
    },

    showGroupMenu() {
        document.getElementById('groupMenu').style.display = 'block';
        document.getElementById('groupRoom').style.display = 'none';
    },

    showGroupRoom() {
        document.getElementById('groupMenu').style.display = 'none';
        document.getElementById('groupRoom').style.display = 'block';
    },

    showCreateDialog() {
        document.getElementById('createModal').classList.add('active');
    },

    showJoinDialog() {
        document.getElementById('joinModal').classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    },

    async createGroup() {
        const id = Groups.generateId();
        const user = TelegramAuth.user;
        if (!user || !user.id) {
            alert('Telegram ID керак!');
            return;
        }

        try {
            await FirebaseDB.createGroup(id, user);
            Groups.saveCurrent(id);
            this.closeModal('createModal');
            this.loadGroup(id);

            // Автоматик улашиш диалоги
            setTimeout(() => this.shareGroup(), 800);
        } catch (e) {
            alert('Хато: ' + e.message);
        }
    },

    async joinGroup() {
        const input = document.getElementById('joinCodeInput');
        const code = Groups.formatGroupCode(input.value);
        if (code.length !== 6) {
            alert('Код 6 та белгидан иборат бўлиши керак!');
            return;
        }

        const user = TelegramAuth.user;
        if (!user || !user.id) {
            alert('Telegram ID керак!');
            return;
        }

        try {
            const group = await FirebaseDB.getGroup(code);
            if (!group) {
                alert('Гуруҳ топилмади!');
                return;
            }
            await FirebaseDB.joinGroup(code, user);
            Groups.saveCurrent(code);
            this.closeModal('joinModal');
            this.loadGroup(code);
            alert('✅ Гуруҳга қўшилдингиз!');
        } catch (e) {
            alert('Хато: ' + e.message);
        }
    },

    async loadGroup(groupId) {
        this.currentGroupId = groupId;
        this.showGroupRoom();

        const codeEl = document.getElementById('groupCodeDisplay');
        if (codeEl) codeEl.textContent = groupId;

        this.updateMembersList();
        this.updateGroupRating();

        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = FirebaseDB.subscribeGroup(groupId, (group) => {
            if (!group) {
                alert('Гуруҳ ўчирилди');
                Groups.clearCurrent();
                this.showGroupMenu();
                return;
            }
            this.currentGroupData = group;
            this.updateMembersList();
            this.updateGroupRating();
        });
    },

    updateMembersList() {
        const list = document.getElementById('groupMembers');
        if (!list || !this.currentGroupData) return;
        const members = this.currentGroupData.members || {};
        const arr = Object.values(members).sort((a, b) => (b.score || 0) - (a.score || 0));

        list.innerHTML = '';
        if (arr.length === 0) {
            list.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;">Аъзолар йўқ</div>';
            return;
        }

        arr.forEach((m, i) => {
            const row = document.createElement('div');
            row.className = 'group-member-row';
            const name = m.username ? '@' + m.username : (m.firstName || 'X');
            const isMe = TelegramAuth.user && m.telegramId === TelegramAuth.user.id;
            const icons = ['🥇','🥈','🥉'];
            row.innerHTML = `
                <div class="member-rank">${icons[i] || (i + 1)}</div>
                <div class="member-name">${name}${isMe ? ' <small style="color:#4ade80">(сиз)</small>' : ''}</div>
                <div class="member-score">${m.score || 0}</div>
            `;
            if (isMe) row.classList.add('me');
            list.appendChild(row);
        });
    },

    async updateGroupRating() {
        const el = document.getElementById('groupRatingList');
        if (!el || !this.currentGroupId) return;
        try {
            const data = await FirebaseDB.getGroupLeaderboard(this.currentGroupId, 10);
            el.innerHTML = '';
            if (data.length === 0) {
                el.innerHTML = '<div style="color:#64748b;text-align:center;padding:15px;font-size:13px;">Ҳали ўйин ўйналмаган</div>';
                return;
            }
            data.forEach((d, i) => {
                const row = document.createElement('div');
                row.className = 'group-rating-row';
                const name = d.username ? '@' + d.username : (d.firstName || 'X');
                row.innerHTML = `
                    <div class="gr-rank">${i + 1}</div>
                    <div class="gr-name">${name}</div>
                    <div class="gr-score">${d.score}</div>
                `;
                el.appendChild(row);
            });
        } catch (e) { console.error(e); }
    },

    // ===== УЛАШИШ =====
    shareGroup() {
        if (!this.currentGroupId) return;

        const code = this.currentGroupId;
        const botUsername = 'cobraco_bot';  // ⚠️ Ўзгартиринг
        const deepLink = `https://t.me/${botUsername}?start=group_${code}`;

        const shareText = `🎮 CobraCo — Дўстлар билан ўйнаймиз!\n\n` +
                         `Гуруҳ коди: ${code}\n\n` +
                         `Қўшилиш:\n` +
                         `1. @${botUsername} ни очинг\n` +
                         `2. 👥 Гуруҳ → Кодни киритинг\n` +
                         `3. Код: ${code}\n\n` +
                         `Ёки тўғридан-тўғри: ${deepLink}`;

        // Telegram WebApp share
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;

            // Telegram'нинг ўз share функцияси
            if (tg.openTelegramLink) {
                // Расмий усул — Telegram share
                const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent('🎮 CobraCo ўйинига қўшилинг! Гуруҳ коди: ' + code)}`;
                tg.openTelegramLink(shareUrl);
                console.log('✅ Telegram share очилди');
                return;
            }
        }

        // Fallback — кўчириш
        this.copyToClipboard(shareText);
        alert('📋 Матн нусхаланди!\n\nДўстларингизга юборинг:\n\n' + shareText);
    },

    // ===== КОД НУСХАЛАШ =====
    copyCode() {
        if (!this.currentGroupId) return;
        this.copyToClipboard(this.currentGroupId);
        alert('📋 Код нусхаланди: ' + this.currentGroupId);
    },

    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('✅ Нусхаланди:', text);
            }).catch(err => {
                console.error('❌ Нусхалаш хато:', err);
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    },

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            console.log('✅ Нусхаланди (fallback)');
        } catch (e) {
            console.error('❌ Нусхалаш хато:', e);
        }
        document.body.removeChild(textarea);
    },

    startGroupGame() {
        if (!this.currentGroupId) return;
        Game.startGroup(this.currentGroupId);
    },

    async leaveGroup() {
        if (!confirm('Гуруҳдан чиқмоқчимисиз?')) return;
        const user = TelegramAuth.user;
        if (this.currentGroupId && user) {
            await FirebaseDB.leaveGroup(this.currentGroupId, user.id);
        }
        Groups.clearCurrent();
        if (this.unsubscribe) this.unsubscribe();
        this.showGroupMenu();
    }
};

console.log('✅ groupsUI.js юкланди (улашиш)');
