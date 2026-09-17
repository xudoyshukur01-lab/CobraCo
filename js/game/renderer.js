// ===== Чизиш — 5 қисмли скин =====
class Renderer {
    constructor(canvas, miniMap, camera) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.miniMap = miniMap;
        this.mctx = miniMap ? miniMap.getContext('2d') : null;
        this.camera = camera;
    }
    get grid() { return CONFIG.GRID; }

    clear() {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGridLines(cols, rows) {
        const cam = this.camera;
        const sX = Math.max(0, Math.floor(cam.x) - 1);
        const sY = Math.max(0, Math.floor(cam.y) - 1);
        const eX = Math.min(cols, Math.ceil(cam.x + this.canvas.width / this.grid) + 1);
        const eY = Math.min(rows, Math.ceil(cam.y + this.canvas.height / this.grid) + 1);
        this.ctx.strokeStyle = 'rgba(74,222,128,0.05)';
        this.ctx.lineWidth = 1;
        for (let x = sX; x <= eX; x++) {
            const sx = (x - cam.x) * this.grid;
            this.ctx.beginPath(); this.ctx.moveTo(sx, 0); this.ctx.lineTo(sx, this.canvas.height); this.ctx.stroke();
        }
        for (let y = sY; y <= eY; y++) {
            const sy = (y - cam.y) * this.grid;
            this.ctx.beginPath(); this.ctx.moveTo(0, sy); this.ctx.lineTo(this.canvas.width, sy); this.ctx.stroke();
        }
    }

    drawFood(items) {
        const cam = this.camera;
        items.forEach(f => {
            if (!cam.isVisible(f.x, f.y)) return;
            const p = cam.worldToScreen(f.x, f.y);
            const cx = p.x + this.grid / 2, cy = p.y + this.grid / 2;
            const color = f.type ? f.type.color : '#ef4444';
            const emoji = f.type ? f.type.emoji : '🍎';
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, this.grid/2 - 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.font = (this.grid - 6) + 'px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(emoji, cx, cy + 1);
        });
    }

    // ===== ИЛОННИ ЧИЗИШ (кўзлар + оёқчалар ҳар доим) =====
    drawSnake(snake) {
        if (!snake.alive) return;
        const cam = this.camera;
        const body = snake.body;
        const L = body.length;

        // Скин — ўйинчи учун танланган, ботлар учун оддий ранг
        let skin;
        if (snake.isPlayer && typeof SKINS !== 'undefined') {
            skin = SKINS.getCurrent();
        } else {
            // Ботлар учун оддий скин (snake.color дан)
            const c = snake.color;
            skin = {
                parts: [
                    { colorId: '_custom', shapeId: 'round' },
                    { colorId: 'white', shapeId: 'circle' },
                    { colorId: '_custom', shapeId: 'round' },
                    { colorId: '_custom', shapeId: 'dot' },
                    { colorId: '_custom', shapeId: 'triangle' }
                ],
                _customColor: c
            };
        }

        // ===== 1. ТАНА ВА ДУМ (орқадан бошинчи) =====
        // i = L-1 (дум) ... i = 1 (кўзлардан ташқари)
        for (let i = L - 1; i >= 1; i--) {
            const seg = body[i];
            if (!cam.isVisible(seg.x, seg.y)) continue;
            const p = cam.worldToScreen(seg.x, seg.y);
            const cx = p.x + this.grid / 2;
            const cy = p.y + this.grid / 2;
            const size = this.grid / 2 - 1;

            const isTail = (i === L - 1);

            if (isTail) {
                // ДУМ
                this.drawSkinPart(skin, 4, cx, cy, size * 0.75, snake);
            } else {
                // ТАНА
                this.drawSkinPart(skin, 2, cx, cy, size * 0.95, snake);

                // ОЁҚЧАЛАР — ҳар 2-бўғинда (танада)
                // 3-индексдан бошлаб, ҳар 2 та
                if (i >= 3 && i % 2 === 1) {
                    this.drawLegs(skin, cx, cy, size, snake);
                }
                // Қўшимча: агар илон узун бўлса (5+), 5-индексдан ҳам
                if (L >= 6 && i >= 5 && i % 2 === 0) {
                    this.drawLegs(skin, cx, cy, size, snake);
                }
            }
        }

        // ===== 2. БОШ (i = 0) =====
        const head = body[0];
        if (cam.isVisible(head.x, head.y)) {
            const p = cam.worldToScreen(head.x, head.y);
            const cx = p.x + this.grid / 2;
            const cy = p.y + this.grid / 2;
            const size = this.grid / 2 - 1;

            // Бош
            this.drawSkinPart(skin, 0, cx, cy, size, snake);

            // КЎЗЛАР — ҳар доим бош устида
            this.drawEyes(skin, cx, cy, size, snake);
        }
    }

    // ===== Скин қисмини чизиш =====
    drawSkinPart(skin, partIndex, cx, cy, size, snake) {
        const color = this.getPartColor(skin, partIndex, snake);
        const shape = this.getPartShape(skin, partIndex);

        if (partIndex === 0) {
            // Бош — glow
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 12;
        }

        SKINS.drawShape(this.ctx, shape, cx, cy, size, color);
        this.ctx.shadowBlur = 0;
    }

    // ===== КЎЗЛАР =====
    drawEyes(skin, cx, cy, size, snake) {
        const color = this.getPartColor(skin, 1, snake);
        const dir = snake.direction || { x: 1, y: 0 };
        SKINS.drawEye(this.ctx, cx, cy, size, color, dir);
    }

    // ===== ОЁҚЧАЛАР =====
    drawLegs(skin, cx, cy, size, snake) {
        const color = this.getPartColor(skin, 3, snake);
        SKINS.drawLeg(this.ctx, cx, cy, size, color, -1);
        SKINS.drawLeg(this.ctx, cx, cy, size, color, +1);
    }

    // ===== Ранг олиш =====
    getPartColor(skin, i, snake) {
        // Custom ранг (ботлар учун)
        if (skin._customColor && skin.parts[i].colorId === '_custom') {
            return skin._customColor;
        }
        return SKINS.getPartColor(skin, i);
    }

    getPartShape(skin, i) {
        if (!skin.parts[i]) return 'round';
        return SKINS.getPartShape(skin, i);
    }

    roundRect(x, y, w, h, r) {
        const c = this.ctx;
        c.beginPath();
        c.moveTo(x + r, y);
        c.arcTo(x + w, y, x + w, y + h, r);
        c.arcTo(x + w, y + h, x, y + h, r);
        c.arcTo(x, y + h, x, y, r);
        c.arcTo(x, y, x + w, y, r);
        c.closePath();
    }

    hexToRgba(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    drawMiniMap(snakes, cols, rows, cam) {
        if (!this.mctx) return;
        const size = this.miniMap.width;
        this.mctx.fillStyle = 'rgba(15,23,42,0.9)';
        this.mctx.fillRect(0, 0, size, size);
        const sX = size / cols, sY = size / rows;
        snakes.forEach(s => {
            if (!s.alive) return;
            let color = s.color;
            if (s.isPlayer && typeof SKINS !== 'undefined') {
                color = SKINS.getPartColor(SKINS.getCurrent(), 0);
            }
            this.mctx.fillStyle = color;
            s.body.forEach(seg => {
                this.mctx.fillRect(seg.x * sX, seg.y * sY, Math.max(1, sX * 3), Math.max(1, sY * 3));
            });
        });
        this.mctx.strokeStyle = '#4ade80';
        this.mctx.lineWidth = 1;
        this.mctx.strokeRect(cam.x * sX, cam.y * sY, (cam.width / CONFIG.GRID) * sX, (cam.height / CONFIG.GRID) * sY);
    }
}

console.log('✅ renderer.js юкланди (кўзлар + оёқчалар)');

// ===== ТУН РЕЖИМИ УЧУН ҚЎШИМЧА =====
const _originalClearNight = Renderer.prototype.clear;
Renderer.prototype.clear = function() {
    _originalClearNight.call(this);
    // Тун режимида қўшимча қоронғулик қатлами
    if (typeof Game !== 'undefined' && Game.nightMode) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Ўйинчи атрофида ёруғлик доираси
        if (Game.snake && Game.snake.alive) {
            const cam = this.camera;
            const head = Game.snake.getHead();
            const p = cam.worldToScreen(head.x, head.y);
            const cx = p.x + this.grid / 2;
            const cy = p.y + this.grid / 2;
            const radius = 150;

            // Радиал градиент
            const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');

            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
        }
    }
};
