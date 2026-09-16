// ===== Telegram WebApp билан ишлаш =====
const TelegramAuth = {
    user: null,
    isReal: false,

    init() {
        const tg = window.Telegram?.WebApp;

        if (tg) {
            console.log('✅ Telegram WebApp топилди');
            tg.ready();
            tg.expand();

            // Тема
            if (tg.colorScheme === 'dark') {
                document.body.style.background = 'linear-gradient(135deg, #0f172a, #1e293b)';
            }

            const u = tg.initDataUnsafe?.user;
            if (u) {
                this.user = {
                    id: u.id,
                    username: u.username || '',
                    firstName: u.first_name || '',
                    lastName: u.last_name || '',
                    languageCode: u.language_code || 'uz',
                    isPremium: u.is_premium || false
                };
                this.isReal = true;
                console.log('✅ Telegram фойдаланувчи:', this.user);
                return this.user;
            }
        }

        // Браузерда тест режими
        console.warn('⚠️  Telegram WebApp топилмади — тест режими');
        this.user = {
            id: 0,
            username: 'test_user',
            firstName: 'Тест',
            lastName: 'Фойдаланувчи',
            languageCode: 'uz',
            isPremium: false
        };
        this.isReal = false;
        return this.user;
    },

    // Кўрсатиш учун ном
    getDisplayName() {
        if (!this.user) return 'Фойдаланувчи';
        if (this.user.username) return '@' + this.user.username;
        const full = `${this.user.firstName} ${this.user.lastName}`.trim();
        return full || 'Фойдаланувчи';
    },

    // Тўлиқ исм
    getFullName() {
        if (!this.user) return 'Фойдаланувчи';
        const full = `${this.user.firstName} ${this.user.lastName}`.trim();
        return full || this.user.username || 'Фойдаланувчи';
    },

    // ID борми (ҳақиқий ўйинчи)
    hasRealId() {
        return this.user && this.user.id > 0;
    }
};

console.log('✅ telegram.js юкланди');
