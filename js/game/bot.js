// ===== Ақлли бот AI =====
class BotController {
    constructor(snake, game, difficulty) {
        this.snake = snake;
        this.game = game;
        this.difficulty = difficulty || 'medium';
        this.thinkInterval = this.getThinkInterval();
        this.lastThink = 0;
        this.aggression = this.getAggression();
        this.intelligence = this.getIntelligence();
    }

    // ===== Даражага қараб параметрлар =====
    getThinkInterval() {
        const intervals = {
            'easy':      200,
            'medium':    170,
            'hard':      140,
            'expert':    115,
            'legendary': 95
        };
        return intervals[this.difficulty] || 170;
    }

    getAggression() {
        const agg = {
            'easy':      0.1,   // Кам ҳужум
            'medium':    0.3,
            'hard':      0.5,
            'expert':    0.7,
            'legendary': 0.9    // Кўп ҳужум
        };
        return agg[this.difficulty] || 0.3;
    }

    getIntelligence() {
        const int = {
            'easy':      0.3,   // Кам ақл
            'medium':    0.5,
            'hard':      0.7,
            'expert':    0.85,
            'legendary': 0.95   // Тўлиқ ақл
        };
        return int[this.difficulty] || 0.5;
    }

    // ===== Ҳар frame =====
    update(now) {
        if (now - this.lastThink < this.thinkInterval) return;
        this.lastThink = now;
        if (!this.snake.alive || this.snake.paralyzed) return;

        const head = this.snake.getHead();
        const dirs = [
            { name:'up',    v:{x:0,y:-1} },
            { name:'down',  v:{x:0,y:1} },
            { name:'left',  v:{x:-1,y:0} },
            { name:'right', v:{x:1,y:0} }
        ];

        // ===== ТАҲЛИЛ: рейтинг баллари =====
        let bestDir = null;
        let bestScore = -Infinity;

        for (const d of dirs) {
            // Орқага қайтишни тақиқлаш
            if (d.v.x === -this.snake.direction.x && d.v.y === -this.snake.direction.y) continue;

            let nx = head.x + d.v.x;
            let ny = head.y + d.v.y;
            // Wraparound
            if (nx < 0) nx = this.snake.worldCols - 1;
            if (nx >= this.snake.worldCols) nx = 0;
            if (ny < 0) ny = this.snake.worldRows - 1;
            if (ny >= this.snake.worldRows) ny = 0;

            let score = 0;

            // ===== 1. ХАВФСИЗЛИК =====
            // Ўз танасидан қочиш
            for (let i = 1; i < this.snake.body.length; i++) {
                const seg = this.snake.body[i];
                const dist = Math.abs(nx - seg.x) + Math.abs(ny - seg.y);
                if (dist < 3) score -= (3 - dist) * 30;
                if (dist === 0) score -= 100000;
            }

            // ===== 2. ОВҚАТГА ИНТИЛИШ =====
            const foods = this.game.food.items;
            let bestFood = null;
            let bestFoodScore = 0;
            for (let i = 0; i < foods.length; i++) {
                const food = foods[i];
                const dist = Math.abs(nx - food.x) + Math.abs(ny - food.y);

                // Заҳарлидан қоч
                if (food.type.id === 'poison') {
                    if (dist < 4) score -= (4 - dist) * 40;
                    continue;
                }

                // Овқат қийматига қараб
                const value = food.type.score || 1;
                const distScore = (50 - dist) * value * 0.5;
                if (distScore > bestFoodScore) {
                    bestFoodScore = distScore;
                    bestFood = food;
                }
            }
            score += bestFoodScore;

            // ===== 3. РАҚИБЛАР =====
            for (const other of this.game.snakes) {
                if (other === this.snake || !other.alive) continue;

                const oHead = other.getHead();
                const distO = Math.abs(nx - oHead.x) + Math.abs(ny - oHead.y);

                const myLen = this.snake.getLength();
                const otherLen = other.getLength();

                // ===== 3.1. Каттароқдан қоч =====
                if (otherLen >= myLen) {
                    // Бошга яқин бўлса — қоч
                    if (distO < 6) {
                        score -= (6 - distO) * 40 * (1 - this.aggression);
                    }
                    // Рақибнинг танасидан қоч
                    for (let i = 0; i < other.body.length; i++) {
                        const seg = other.body[i];
                        const d2 = Math.abs(nx - seg.x) + Math.abs(ny - seg.y);
                        if (d2 < 2) score -= (2 - d2) * 60;
                        if (d2 === 0) score -= 100000;
                    }
                }
                // ===== 3.2. Кичикроқни овла =====
                else {
                    // Ҳужум — aggression га қараб
                    if (distO < 10) {
                        score += (10 - distO) * 10 * this.aggression;
                    }

                    // Рақибнинг олдига бориб тўқнашув
                    if (distO < 5 && this.intelligence > 0.5) {
                        score += (5 - distO) * 15 * this.aggression;
                    }
                }
            }

            // ===== 4. ДЕВОРГА ЯҚИНЛИК =====
            // (Wraparound бўлгани учун бу муҳим эмас)

            // ===== 5. ТАСОДИФИЙЛИК =====
            // Intelligence кам бўлса — кўп тасодифийлик
            score += (Math.random() - 0.5) * 20 * (1 - this.intelligence);

            // ===== 6. АҚЛЛИ РЕЖА =====
            // Агар intelligence юқори бўлса — режа тузади
            if (this.intelligence > 0.7) {
                // Рақибнинг келажакдаги ҳолатини ҳисоблаш
                for (const other of this.game.snakes) {
                    if (other === this.snake || !other.alive) continue;
                    const oHead = other.getHead();
                    // Рақиб ҳаракатланадиган йўналиш
                    const futureX = oHead.x + other.direction.x * 2;
                    const futureY = oHead.y + other.direction.y * 2;
                    // Агар биз шу жойга борсак — ҳужум
                    const futureDist = Math.abs(nx - futureX) + Math.abs(ny - futureY);
                    if (futureDist < 4) {
                        score += 20 * this.aggression;
                    }
                }
            }

            // Энг яхши йўналишни танлаш
            if (score > bestScore) {
                bestScore = score;
                bestDir = d.name;
            }
        }

        if (bestDir) this.snake.setDirection(bestDir);
    }
}

// ===== Бот даражасини аниқлаш =====
function getBotDifficulty(playerTrophies) {
    if (playerTrophies >= 5000) return 'legendary';
    if (playerTrophies >= 2000) return 'expert';
    if (playerTrophies >= 500)  return 'hard';
    if (playerTrophies >= 100)  return 'medium';
    return 'easy';
}

// ===== Бот исмлари (даражага қараб) =====
const BOT_NAMES = {
    easy:       ['Янги бот', 'Кичик бот', 'Секин бот', 'Ёш илон'],
    medium:     ['Кобра', 'Питон', 'Гюрза', 'Удав'],
    hard:       ['Аждар', 'Мамба', 'Тайпан', 'Випера'],
    expert:     ['Қора Аждар', 'Оловли Питон', 'Заҳарли Мамба'],
    legendary:  ['👑 Қора Шоҳ', '👑 Афсонавий', '👑 Улкан Аждар']
};

console.log('✅ bot.js юкланди (ақлли ботлар)');
