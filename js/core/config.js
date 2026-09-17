// ===== CobraCo - Асосий созламалар =====
const CONFIG = {
    VERSION: '2.0.0',
    GRID: 20,
    BASE_SPEED: 150,
    MIN_SPEED: 70,
    SPEED_STEP: 10,
    SPEED_EVERY: 50,
    SCORE_PER_FOOD: 10,
    MAX_RESPAWNS: 3,
    RESPAWN_DELAY: 2000,
    EQUAL_SNAKES_PARALYZE_TIME: 7000,
    EAT_PERCENT: 50,
    SPREAD_PERCENT: 50,
    MIN_SNAKE_LENGTH: 3,
    FOOD_INITIAL: 150,
    FOOD_MIN: 100,
    FOOD_SPAWN_BATCH: 20,
    TOP5_UPDATE_INTERVAL: 10000,
    MAX_TROPHY_CHANGE: 30
};

// ===== ОВҚАТ ТУРЛАРИ =====
const FOOD_TYPES = {
    normal: { id:'normal', emoji:'🍎', color:'#ef4444', score:1, grow:1, weight:50, label:'Оддий' },
    double: { id:'double', emoji:'🍏', color:'#22c55e', score:2, grow:2, weight:20, label:'×2' },
    triple: { id:'triple', emoji:'🍊', color:'#f97316', score:3, grow:3, weight:12, label:'×3' },
    quint:  { id:'quint',  emoji:'🍇', color:'#a855f7', score:5, grow:5, weight:5,  label:'×5' },
    bonus:  { id:'bonus',  emoji:'💎', color:'#22d3ee', score:5, grow:5, weight:4,  label:'+5' },
    poison: { id:'poison', emoji:'☠️', color:'#1e293b', score:-5, grow:-5, weight:5, label:'−5' },
    speed:  { id:'speed',  emoji:'⚡', color:'#fbbf24', score:2, grow:1, weight:2,  label:'Тезлик', effect:'speed', duration:5000 },
    shield: { id:'shield', emoji:'🛡', color:'#06b6d4', score:2, grow:1, weight:2,  label:'Ҳимоя', effect:'shield', duration:10000 }
};

function pickRandomFoodType() {
    const types = Object.values(FOOD_TYPES);
    const total = types.reduce((s, t) => s + t.weight, 0);
    let r = Math.random() * total;
    for (const t of types) { r -= t.weight; if (r <= 0) return t; }
    return FOOD_TYPES.normal;
}

// ===== ЎЙИН РЕЖИМЛАРИ =====
const GAME_MODES = [
    {
        id: 'classic',
        name: 'Классик',
        emoji: '🎯',
        desc: '15 ўйинчи, 3 ҳаёт, 2-5 дақиқа',
        color: '#4ade80',
        mapSize: 500,
        bots: 15,
        gameTime: 180,
        respawns: 3,
        worldCycle: 0,  // Йўқ
        minPlayers: 0,
        maxPlayers: 15
    },
    {
        id: 'world',
        name: 'Дунё',
        emoji: '🌍',
        desc: '1000+ ўйинчи, 200 бот, 10 дақиқа',
        color: '#22d3ee',
        mapSize: 5000,
        bots: 200,
        gameTime: 600,
        respawns: 3,
        worldCycle: 600,  // 10 дақиқа
        minPlayers: 0,
        maxPlayers: 9999
    },
    {
        id: 'tournament',
        name: 'Турнир',
        emoji: '🏆',
        desc: '32 ўйинчи, 1/16, 1/8, 1/4, 1/2, финал',
        color: '#fbbf24',
        mapSize: 1000,
        bots: 0,
        gameTime: 300,
        respawns: 1,
        worldCycle: 0,
        minPlayers: 32,
        maxPlayers: 32
    },
    {
        id: 'group',
        name: 'Гуруҳ',
        emoji: '👥',
        desc: 'Дўстлар билан, гуруҳ коди орқали',
        color: '#a855f7',
        mapSize: 1000,
        bots: 0,
        gameTime: 300,
        respawns: 3,
        worldCycle: 0,
        minPlayers: 2,
        maxPlayers: 20
    }
];

// ===== ЗОНАЛАР (эски мослик учун) =====
const ZONES = [
    { id:'classic', name:'Классик', desc:'Катта майдон, ботлар билан', emoji:'🐍', color:'#4ade80', unlockScore:0, speedMultiplier:1.0 }
];

// ===== ХАРИТА ЎЛЧАМЛАРИ =====
const MAP_SIZES = {
    '200':   { cols:200,   rows:200,   name:'Кичик' },
    '500':   { cols:500,   rows:500,   name:'Ўрта' },
    '1000':  { cols:1000,  rows:1000,  name:'Катта' },
    '5000':  { cols:5000,  rows:5000,  name:'Дунё' }
};

// ===== ГЛОБАЛ ҲОЛАТ =====
const GameState = {
    user: null,
    mode: null,         // Танланган режим
    settings: { bots:3, gameTime:180, mapSize:500 }
};

console.log('✅ config.js юкланди');
console.log('  🎮 Режимлар:', GAME_MODES.length);
console.log('  📦 Овқат турлари:', Object.keys(FOOD_TYPES).length);
