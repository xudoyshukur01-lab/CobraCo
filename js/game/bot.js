// ===== Бот AI =====
class BotController {
    constructor(snake, game) {
        this.snake = snake;
        this.game = game;
        this.thinkInterval = 100;
        this.lastThink = 0;
    }
    update(now) {
        if (now - this.lastThink < this.thinkInterval) return;
        this.lastThink = now;
        if (!this.snake.alive || this.snake.paralyzed) return;

        const head = this.snake.getHead();
        const dirs = [
            { name:'up', v:{x:0,y:-1} }, { name:'down', v:{x:0,y:1} },
            { name:'left', v:{x:-1,y:0} }, { name:'right', v:{x:1,y:0} }
        ];
        let bestDir = null, bestScore = -Infinity;

        for (const d of dirs) {
            if (d.v.x === -this.snake.direction.x && d.v.y === -this.snake.direction.y) continue;
            let nx = head.x + d.v.x, ny = head.y + d.v.y;
            if (nx < 0) nx = this.snake.worldCols - 1;
            if (nx >= this.snake.worldCols) nx = 0;
            if (ny < 0) ny = this.snake.worldRows - 1;
            if (ny >= this.snake.worldRows) ny = 0;
            let score = 0;

            const foods = this.game.food.items;
            let minDist = 9999;
            for (let i = 0; i < Math.min(foods.length, 40); i++) {
                if (foods[i].type.id === 'poison') continue;
                const dist = Math.abs(nx - foods[i].x) + Math.abs(ny - foods[i].y);
                if (dist < minDist) minDist = dist;
            }
            score -= minDist * 0.5;

            for (const f of foods) {
                if (f.type.id !== 'poison') continue;
                const dist = Math.abs(nx - f.x) + Math.abs(ny - f.y);
                if (dist < 5) score -= (5 - dist) * 10;
            }

            for (let i = 1; i < this.snake.body.length; i++) {
                const seg = this.snake.body[i];
                const d2 = Math.abs(nx - seg.x) + Math.abs(ny - seg.y);
                if (d2 < 3) score -= (3 - d2) * 20;
                if (d2 === 0) score -= 10000;
            }

            for (const other of this.game.snakes) {
                if (other === this.snake || !other.alive) continue;
                const oHead = other.getHead();
                const distO = Math.abs(nx - oHead.x) + Math.abs(ny - oHead.y);
                const myLen = this.snake.getLength(), otherLen = other.getLength();
                if (otherLen >= myLen) { if (distO < 5) score -= (5 - distO) * 15; }
                else { if (distO < 8) score += (8 - distO) * 2; }
                for (let i = 1; i < other.body.length; i++) {
                    const seg = other.body[i];
                    const d3 = Math.abs(nx - seg.x) + Math.abs(ny - seg.y);
                    if (d3 < 2) score -= (2 - d3) * 30;
                }
            }

            score += Math.random() * 2;
            if (score > bestScore) { bestScore = score; bestDir = d.name; }
        }
        if (bestDir) this.snake.setDirection(bestDir);
    }
}

console.log('✅ bot.js юкланди');
