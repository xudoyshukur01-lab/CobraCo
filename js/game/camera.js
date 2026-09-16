// ===== Камера =====
class Camera {
    constructor(w, h, grid) {
        this.width = w;
        this.height = h;
        this.grid = grid;
        this.x = 0;
        this.y = 0;
        this.smooth = 0.2;
    }

    follow(tx, ty) {
        const tX = tx - (this.width / this.grid) / 2;
        const tY = ty - (this.height / this.grid) / 2;
        this.x += (tX - this.x) * this.smooth;
        this.y += (tY - this.y) * this.smooth;
    }

    snapTo(tx, ty) {
        this.x = tx - (this.width / this.grid) / 2;
        this.y = ty - (this.height / this.grid) / 2;
    }

    worldToScreen(wx, wy) {
        return {
            x: (wx - this.x) * this.grid,
            y: (wy - this.y) * this.grid
        };
    }

    isVisible(wx, wy) {
        const m = 2;
        return wx >= this.x - m &&
               wx <= this.x + this.width / this.grid + m &&
               wy >= this.y - m &&
               wy <= this.y + this.height / this.grid + m;
    }

    updateSize(w, h) {
        this.width = w;
        this.height = h;
    }
}

console.log('✅ camera.js юкланди');
