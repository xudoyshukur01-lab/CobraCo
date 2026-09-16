// ===== Регион тизими =====
const Regions = {
    // Давлатлар ва вилоятлар
    COUNTRIES: {
        'UZ': {
            name: 'Ўзбекистон',
            flag: '🇺🇿',
            regions: [
                'Тошкент шаҳри',
                'Тошкент вилояти',
                'Самарқанд',
                'Бухоро',
                'Андижон',
                'Фарғона',
                'Наманган',
                'Қашқадарё',
                'Сурхондарё',
                'Жиззах',
                'Сирдарё',
                'Навоий',
                'Хоразм',
                'Қорақалпоғистон'
            ]
        },
        'KZ': { name: 'Қозоғистон', flag: '🇰🇿', regions: ['Алматы', 'Астана', 'Шимкент'] },
        'KG': { name: 'Қирғизистон', flag: '🇰🇬', regions: ['Бишкек', 'Ош'] },
        'TJ': { name: 'Тожикистон', flag: '🇹🇯', regions: ['Душанбе', 'Хужанд'] },
        'TM': { name: 'Туркманистон', flag: '🇹🇲', regions: ['Ашхобод'] },
        'TR': { name: 'Туркия', flag: '🇹🇷', regions: ['Истанбул', 'Анкара', 'Измир'] },
        'RU': { name: 'Россия', flag: '🇷🇺', regions: ['Москва', 'Санкт-Петербург'] },
        'US': { name: 'АҚШ', flag: '🇺🇸', regions: ['New York', 'Los Angeles', 'Chicago'] }
    },

    // ===== Сақлаш =====
    KEY_REGION: 'cobraco_region',

    saveRegion(countryCode, region) {
        const data = { countryCode, region, savedAt: Date.now() };
        localStorage.setItem(this.KEY_REGION, JSON.stringify(data));
    },

    getRegion() {
        const raw = localStorage.getItem(this.KEY_REGION);
        return raw ? JSON.parse(raw) : null;
    },

    // ===== Кўрсатиш =====
    getCountryName(code) {
        return this.COUNTRIES[code]?.name || 'Номаълум';
    },

    getCountryFlag(code) {
        return this.COUNTRIES[code]?.flag || '🌍';
    },

    getRegionsList(code) {
        return this.COUNTRIES[code]?.regions || [];
    },

    // ===== Рейтинг идентификатори =====
    // Firebase'да collection номи
    getLeaderboardId(scope, countryCode, region) {
        switch (scope) {
            case 'global':
                return 'global';
            case 'country':
                return 'country_' + (countryCode || 'XX');
            case 'region':
                return 'region_' + (countryCode || 'XX') + '_' + (region || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
            default:
                return 'global';
        }
    },

    // ===== Фойдаланувчида регион борми =====
    hasRegion() {
        return this.getRegion() !== null;
    }
};

console.log('✅ regions.js юкланди');
