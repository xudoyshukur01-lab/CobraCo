// ===== Овқат =====
class FoodManager {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.items = [];
        this.maxItems = 500;
    }
    spawn(count) {
        for (let i = 0; i < count; i++) {
            if (this.items.length >= this.maxItems) break;
            const type = pickRandomFoodType();
            this.items.push({
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows),
                type: type,
                createdAt: Date.now()
            });
        }
    }
    spawnType(x, y, typeId) {
        if (this.items.length >= this.maxItems) return;
        const type = FOOD_TYPES[typeId] || FOOD_TYPES.normal;
        this.items.push({ x, y, type, createdAt: Date.now() });
    }
    checkEat(head) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].x === head.x && this.items[i].y === head.y) {
                return this.items.splice(i, 1)[0];
            }
        }
        return null;
    }
    clear() { this.items = []; }
}

console.log('✅ food.js юкланди');
