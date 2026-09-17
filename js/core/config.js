// ===== CobraCo - Асосий созламалар =====
const CONFIG = {
    VERSION: '2.2.0',
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
    FOOD_INITIAL: 200,
    FOOD_MIN: 100,
    FOOD_SPAWN_BATCH: 50,
    TOP5_UPDATE_INTERVAL: 10000,
    MAX_TROPHY_CHANGE: 30,

    // ⚠️ ЯНГИ: Динамик карта
    SHRINK_INTERVAL: 60000,      // Ҳар 60 сония (1 дақиқа)
    SHRINK_PERCENT: 0.20,        // 20% кичраяди
    MIN_MAP_SIZE: 100,           // Минимал 100×100
    MAP_SHRINK_ENABLED: true     // Ёқилган
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

// ===== ЎЙИН РЕЖИМЛАРИ (овқат ×10) =====
const GAME_MODES = [
    {
        id: 'classic',
        name: 'Классик',
        emoji: '🎯',
        desc: '15 ўйинчи, 3 ҳаёт',
        color: '#4ade80',
        mapSize: 300,
        bots: 15,
        gameTime: 180,
        respawns: 3,
        foodCount: 2500,        // 250 × 10
        worldCycle: 0
    },
    {
        id: 'world',
        name: 'Дунё',
        emoji: '🌍',
        desc: '1000+ ўйинчи, 200 бот',
        color: '#22d3ee',
        mapSize: 1500,
        bots: 200,
        gameTime: 600,
        respawns: 3,
        foodCount: 6000,        // 600 × 10
        worldCycle: 600
    },
    {
        id: 'tournament',
        name: 'Турнир',
        emoji: '🏆',
        desc: '32 ўйинчи, 1/16, финал',
        color: '#fbbf24',
        mapSize: 500,
        bots: 0,
        gameTime: 300,
        respawns: 1,
        foodCount: 2000,        // 200 × 10
        worldCycle: 0
    },
    {
        id: 'group',
        name: 'Гуруҳ',
        emoji: '👥',
        desc: 'Дўстлар билан',
        color: '#a855f7',
        mapSize: 400,
        bots: 0,
        gameTime: 300,
        respawns: 3,
        foodCount: 2000,
        worldCycle: 0
    },
    {
        id: 'zombie',
        name: 'Зомби',
        emoji: '🧟',
        desc: '50+ секин бот',
        color: '#84cc16',
        mapSize: 500,
        bots: 50,
        gameTime: 300,
        respawns: 1,
        foodCount: 3500,        // 350 × 10
        worldCycle: 0,
        special: 'zombie'
    },
    {
        id: 'hunger',
        name: 'Очлик ўйини',
        emoji: '🍽️',
        desc: '24 ўйинчи, 1 ғолиб',
        color: '#f97316',
        mapSize: 600,
        bots: 20,
        gameTime: 300,
        respawns: 1,
        foodCount: 4000,        // 400 × 10
        worldCycle: 0,
        special: 'hunger'
    },
    {
        id: 'hunt',
        name: 'Ов',
        emoji: '🎯',
        desc: 'Сиз катта, 20 кичик',
        color: '#ec4899',
        mapSize: 800,
        bots: 20,
        gameTime: 300,
        respawns: 1,
        foodCount: 3000,        // 300 × 10
        worldCycle: 0,
        special: 'hunt'
    },
    {
        id: 'speed',
        name: 'Тезлик',
        emoji: '⚡',
        desc: '2х тезлик, кичик карта',
        color: '#fbbf24',
        mapSize: 150,
        bots: 5,
        gameTime: 120,
        respawns: 3,
        foodCount: 4000,        // 400 × 10
        worldCycle: 0,
        special: 'speed'
    },
    {
        id: 'night',
        name: 'Тун',
        emoji: '🌙',
        desc: 'Қоронғу, яқин атроф',
        color: '#a855f7',
        mapSize: 500,
        bots: 10,
        gameTime: 300,
        respawns: 3,
        foodCount: 3000,        // 300 × 10
        worldCycle: 0,
        special: 'night'
    }
];

// ===== ЗОНАЛАР =====
const ZONES = [
    { id:'classic', name:'Классик', desc:'Катта майдон', emoji:'🐍', color:'#4ade80', unlockScore:0, speedMultiplier:1.0 }
];

// ===== ХАРИТА ЎЛЧАМЛАРИ =====
const MAP_SIZES = {
    '100':   { cols:100,   rows:100,   name:'Минимал' },
    '150':   { cols:150,   rows:150,   name:'Жуда кичик' },
    '200':   { cols:200,   rows:200,   name:'Кичик' },
    '300':   { cols:300,   rows:300,   name:'Ўрта' },
    '400':   { cols:400,   rows:400,   name:'Ўрта+' },
    '500':   { cols:500,   rows:500,   name:'Катта' },
    '600':   { cols:600,   rows:600,   name:'Катта+' },
    '800':   { cols:800,   rows:800,   name:'Жуда катта' },
    '1000':  { cols:1000,  rows:1000,  name:'Улкан' },
    '1500':  { cols:1500,  rows:1500,  name:'Дунё' }
};

// ===== ГЛОБАЛ ҲОЛАТ =====
const GameState = {
    user: null,
    mode: null,
    settings: { bots:3, gameTime:180, mapSize:300 }
};

console.log('✅ config.js юкланди');
console.log('  🎮 Режимлар:', GAME_MODES.length);
console.log('  🍎 Овқатлар: ×10 кўпайтирилди');
console.log('  🗺️ Динамик карта: ҳар дақиқада 20% кичраяди');
