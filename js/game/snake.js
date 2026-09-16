// ===== Илон объекти =====
class Snake {
    constructor(opts) {
        opts = opts || {};
        this.id = opts.id || 'player';
        this.isPlayer = opts.isPlayer || false;
        this.color = opts.color || '#4ade80';
        this.name = opts.name || 'Илон';
        this.worldCols = opts.worldCols || 500;
        this.worldRows = opts.worldRows || 500;
        this.shieldUntil = 0;
        this.speedBoostUntil = 0;
        this.reset(opts.startX, opts.startY, opts.length || 5);
    }

    reset(x, y, len) {
        if (x === undefined) x = Math.floor(this.worldCols / 2);
        if (y === undefined) y = Math.floor(this.worldRows / 2);
        if (len === undefined) len = 5;
        this.body = [];
        for (let i = 0; i < len; i++) this.body.push({ x: x - i, y: y });
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.alive = true;
        this.paralyzed = false;
        this.paralyzeUntil = 0;
        this.growPending = 0;
        this.shieldUntil = 0;
        this.speedBoostUntil = 0;
        this.score = 0;  // ⚠️ ЯНГИ: ўлжа балли учун
    }

    setDirection(dir) {
        const dirs = { up:{x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
        const d = dirs[dir];
        if (!d) return;
        if (d.x === -this.direction.x && d.y === -this.direction.y) return;
        this.nextDirection = d;
    }

    move() {
        if (!this.alive) return null;
        if (this.paralyzed && Date.now() < this.paralyzeUntil) return this.body[0];
        this.paralyzed = false;
        this.direction = this.nextDirection;
        let head = { x: this.body[0].x + this.direction.x, y: this.body[0].y + this.direction.y };
        if (head.x < 0) head.x = this.worldCols - 1;
        if (head.x >= this.worldCols) head.x = 0;
        if (head.y < 0) head.y = this.worldRows - 1;
        if (head.y >= this.worldRows) head.y = 0;
        return head;
    }

    applyMove(head) {
        this.body.unshift(head);
        if (this.growPending > 0) this.growPending--;
        else this.body.pop();
    }

    grow(a) {
        if (a < 0) {
            const cut = Math.min(Math.abs(a), this.body.length - CONFIG.MIN_SNAKE_LENGTH);
            for (let i = 0; i < cut; i++) this.body.pop();
        } else {
            this.growPending += a;
        }
    }

    checkSelfCollision(head) {
        if (Date.now() < this.shieldUntil) return false;
        for (let i = 1; i < this.body.length; i++)
            if (this.body[i].x === head.x && this.body[i].y === head.y) return true;
        return false;
    }

    getHead() { return this.body[0]; }
    getLength() { return this.body.length; }
    cutFrom(i) { const r = this.body.slice(i); this.body = this.body.slice(0, i); return r; }
    paralyze(ms) { this.paralyzed = true; this.paralyzeUntil = Date.now() + ms; }
    hasShield() { return Date.now() < this.shieldUntil; }
    hasSpeedBoost() { return Date.now() < this.speedBoostUntil; }
    applyShield(ms) { this.shieldUntil = Date.now() + ms; }
    applySpeedBoost(ms) { this.speedBoostUntil = Date.now() + ms; }
}

console.log('✅ snake.js юкланди (score майдони)');
