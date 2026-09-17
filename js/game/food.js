// ===== Овқат =====
class FoodManager {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.items = [];
        this.maxItems = 15000;
        this.targetCount = 3000;
    }

    spawn(count) {
        for (let i = 0; i < count; i++) {
            if (this.items.length >= this.maxItems) break;
            this.items.push(this.createFood());
        }
    }

    createFood() {
        const type = pickRandomFoodType();
        return {
            x: Math.floor(Math.random() * this.cols),
            y: Math.floor(Math.random() * this.rows),
            type: type,
            createdAt: Date.now()
        };
    }

    spawnType(x, y, typeId) {
        if (this.items.length >= this.maxItems) return;
        const type = FOOD_TYPES[typeId] || FOOD_TYPES.normal;
        this.items.push({ x, y, type, createdAt: Date.now() });
    }

    refill(count) {
        const needed = Math.min(count, this.maxItems - this.items.length);
        if (needed <= 0) return;
        for (let i = 0; i < needed; i++) {
            this.items.push(this.createFood());
        }
    }

    refillToTarget() {
        const needed = this.targetCount - this.items.length;
        if (needed > 0) this.refill(needed);
    }

    checkEat(head) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].x === head.x && this.items[i].y === head.y) {
                const eaten = this.items.splice(i, 1)[0];
                // ⚠️ Ейилган заҳоти — янги овқат
                this.items.push(this.createFood());
                return eaten;
            }
        }
        return null;
    }

    clear() { this.items = []; }
}

console.log('✅ food.js юкланди (автоматик тўлдириш)');
