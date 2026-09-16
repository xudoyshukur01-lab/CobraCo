// ===== Тўқнашув қоидалари =====
const Collision = {
    checkSnakes(snakes, foodMgr) {
        const dead = [];
        for (let i = 0; i < snakes.length; i++) {
            const s = snakes[i];
            if (!s.alive) continue;
            const head = s.getHead();
            if (s.checkSelfCollision(head)) { this.killSnake(s, foodMgr); dead.push(s); continue; }
            for (let j = 0; j < snakes.length; j++) {
                if (i === j) continue;
                const other = snakes[j];
                if (!other.alive) continue;
                this.checkHeadCollision(s, head, other, foodMgr);
            }
        }
        return dead;
    },

    checkHeadCollision(snake, head, other, foodMgr) {
        const oHead = other.getHead();

        // ===== 1. БОШ-БОШГА =====
        if (head.x === oHead.x && head.y === oHead.y) {
            const lA = snake.getLength();
            const lB = other.getLength();

            if (lA === lB) {
                // Тенг — иккаласи 50% сочилиб, фалаж
                this.killBothEqual(snake, other, foodMgr);
            } else if (lA > lB) {
                // snake каттароқ — other ўлади
                if (!other.hasShield || !other.hasShield()) {
                    // Ўлжа баллини олиш
                    const preyScore = this.getScoreOf(other);
                    const bonusGrow = Math.floor(preyScore / CONFIG.SCORE_PER_FOOD);

                    this.killSnake(other, foodMgr);

                    // Асосий ўсиш (50%)
                    const baseGrow = Math.floor(lB / 2);
                    // Бонус (ўлжа балли)
                    const totalGrow = baseGrow + bonusGrow;

                    snake.grow(totalGrow);
                    console.log('🍽️ Ўлжа ейилди:', other.name,
                                '| Балл:', preyScore,
                                '| Бонус бўғин:', bonusGrow,
                                '| Жами ўсиш:', totalGrow);
                }
            } else {
                // other каттароқ — snake ўлади
                if (!snake.hasShield || !snake.hasShield()) {
                    const preyScore = this.getScoreOf(snake);
                    const bonusGrow = Math.floor(preyScore / CONFIG.SCORE_PER_FOOD);

                    this.killSnake(snake, foodMgr);

                    const baseGrow = Math.floor(lA / 2);
                    const totalGrow = baseGrow + bonusGrow;

                    other.grow(totalGrow);
                    console.log('🍽️ Ўлжа ейилди:', snake.name,
                                '| Балл:', preyScore,
                                '| Бонус бўғин:', bonusGrow);
                }
            }
            return;
        }

        // ===== 2. БОШ-ТАНАГА =====
        for (let k = 1; k < other.body.length; k++) {
            const seg = other.body[k];
            if (head.x === seg.x && head.y === seg.y) {
                const tailPart = other.body.slice(k);
                if (tailPart.length === 0) continue;

                const lA = snake.getLength();
                const lB = other.getLength();

                if (lA >= lB) {
                    // snake каттароқ — танани ейди
                    if (other.hasShield && other.hasShield()) return;

                    // 50% ейиш
                    const eatCount = Math.max(1, Math.floor(tailPart.length * CONFIG.EAT_PERCENT / 100));
                    const spreadCount = tailPart.length - eatCount;

                    // Ўлжа баллини олиш (пропорционал)
                    const preyScore = this.getScoreOf(other);
                    const bonusGrow = Math.floor(preyScore / CONFIG.SCORE_PER_FOOD);

                    // Жами ўсиш
                    const totalGrow = eatCount + bonusGrow;

                    snake.grow(totalGrow);
                    other.cutFrom(k);

                    // Тарқатиш
                    for (let n = 0; n < spreadCount; n++) foodMgr.spawn(1);

                    // Агар ўлжа жуда қисқарса — ўлади
                    if (other.getLength() < CONFIG.MIN_SNAKE_LENGTH) {
                        this.killSnake(other, foodMgr);
                    }

                    console.log('🦷 Тана ейилди:', other.name,
                                '| Балл:', preyScore,
                                '| Бонус:', bonusGrow,
                                '| Жами:', totalGrow);
                } else {
                    // snake кичикроқ — ўзи ўлади
                    if (!snake.hasShield || !snake.hasShield()) {
                        this.killSnake(snake, foodMgr);
                    }
                }
                return;
            }
        }
    },

    // ===== Ўлжа баллини олиш =====
    getScoreOf(snake) {
        // Ўйинчи учун — Game.score
        if (snake.isPlayer && typeof Game !== 'undefined') {
            return Game.score || 0;
        }
        // Ботлар учун — тахминий балл (узунликдан)
        // Ҳар бўғин = 1 овқат = 10 балл
        return (snake.getLength() - 5) * CONFIG.SCORE_PER_FOOD;
    },

    killSnake(snake, foodMgr) {
        if (!snake.alive) return;
        snake.alive = false;
        snake.body.forEach((seg, i) => {
            if (i % 2 === 0) foodMgr.spawnType(seg.x, seg.y, 'normal');
        });
    },

    killBothEqual(a, b, foodMgr) {
        a.body.forEach((seg, i) => { if (i % 2 === 0) foodMgr.spawnType(seg.x, seg.y, 'normal'); });
        b.body.forEach((seg, i) => { if (i % 2 === 0) foodMgr.spawnType(seg.x, seg.y, 'normal'); });
        a.alive = false;
        b.alive = false;
        a.paralyze(CONFIG.EQUAL_SNAKES_PARALYZE_TIME);
        b.paralyze(CONFIG.EQUAL_SNAKES_PARALYZE_TIME);
    }
};

console.log('✅ collision.js юкланди (ўлжа балли)');
