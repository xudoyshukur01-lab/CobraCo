// ===== CobraCo - Асосий созламалар =====
const CONFIG = {
    VERSION: '1.0.0-stage3',
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

// ===== ЗОНАЛАР =====
const ZONES = [
    { id:'classic', name:'Классик', desc:'Катта майдон, ботлар билан', emoji:'🐍', color:'#4ade80', unlockScore:0, speedMultiplier:1.0 }
];

// ===== ХАРИТА ЎЛЧАМЛАРИ =====
const MAP_SIZES = {
    '200':  { cols:200,  rows:200,  name:'Кичик' },
    '500':  { cols:500,  rows:500,  name:'Ўрта' },
    '1000': { cols:1000, rows:1000, name:'Катта' }
};

// ===== ГЛОБАЛ ҲОЛАТ =====
const GameState = {
    user: null,
    settings: { bots:3, gameTime:180, mapSize:500 }
};

console.log('✅ config.js юкланди');
console.log('📦 Овқат турлари:', Object.keys(FOOD_TYPES).length);
