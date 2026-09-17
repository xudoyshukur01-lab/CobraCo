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
            const cx = p.x + this.grid/2, cy = p.y + this.grid/2;
            const color = f.type ? f.type.color : '#ef4444';
            const emoji = f.type ? f.type.emoji : '🍎';
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, this.grid/2 - 3, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.font = (this.grid - 6) + 'px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(emoji, cx, cy + 1);
        });
    }

    // ===== ИЛОННИ 5 ҚИСМ БИЛАН ЧИЗИШ =====
    drawSnake(snake) {
        if (!snake.alive) return;
        const cam = this.camera;
        const body = snake.body;
        const L = body.length;

        // СКИН — ўйинчи учун танланган, ботлар учун оддий
        let skin;
        if (snake.isPlayer && typeof SKINS !== 'undefined') {
            skin = SKINS.getCurrent();
        } else {
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

        // ===== 1. ТАНА + ДУМ + ОЁҚЧАЛАР =====
        for (let i = L - 1; i >= 1; i--) {
            const seg = body[i];
            if (!cam.isVisible(seg.x, seg.y)) continue;
            const p = cam.worldToScreen(seg.x, seg.y);
            const cx = p.x + this.grid / 2;
            const cy = p.y + this.grid / 2;
            const size = this.grid / 2 - 1;

            const isTail = (i === L - 1);

            if (isTail) {
                this.drawSkinPart(skin, 4, cx, cy, size * 0.75, snake);
            } else {
                this.drawSkinPart(skin, 2, cx, cy, size * 0.95, snake);

                // Оёқчалар — ҳар 2-бўғинда
                if (i >= 3 && i % 2 === 1) {
                    this.drawLegs(skin, cx, cy, size, snake);
                }
                if (L >= 6 && i >= 5 && i % 2 === 0) {
                    this.drawLegs(skin, cx, cy, size, snake);
                }
            }
        }

        // ===== 2. БОШ + КЎЗЛАР =====
        const head = body[0];
        if (cam.isVisible(head.x, head.y)) {
            const p = cam.worldToScreen(head.x, head.y);
            const cx = p.x + this.grid / 2;
            const cy = p.y + this.grid / 2;
            const size = this.grid / 2 - 1;

            this.drawSkinPart(skin, 0, cx, cy, size, snake);
            this.drawEyes(skin, cx, cy, size, snake);
        }
    }

    drawSkinPart(skin, partIndex, cx, cy, size, snake) {
        const color = this.getPartColor(skin, partIndex, snake);
        const shape = this.getPartShape(skin, partIndex);

        if (partIndex === 0) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 12;
        }
        SKINS.drawShape(this.ctx, shape, cx, cy, size, color);
        this.ctx.shadowBlur = 0;
    }

    drawEyes(skin, cx, cy, size, snake) {
        const color = this.getPartColor(skin, 1, snake);
        const dir = snake.direction || { x: 1, y: 0 };
        SKINS.drawEye(this.ctx, cx, cy, size, color, dir);
    }

    drawLegs(skin, cx, cy, size, snake) {
        const color = this.getPartColor(skin, 3, snake);
        SKINS.drawLeg(this.ctx, cx, cy, size, color, -1);
        SKINS.drawLeg(this.ctx, cx, cy, size, color, +1);
    }

    getPartColor(skin, i, snake) {
        if (skin._customColor && skin.parts[i].colorId === '_custom') {
            return skin._customColor;
        }
        if (typeof SKINS === 'undefined') return '#4ade80';
        return SKINS.getPartColor(skin, i);
    }

    getPartShape(skin, i) {
        if (!skin.parts[i]) return 'round';
        if (typeof SKINS === 'undefined') return 'round';
        return SKINS.getPartShape(skin, i);
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

console.log('✅ renderer.js юкланди (5 қисмли скин)');

// ===== ДЖОЙСТИК ЧИЗИШ (renderer.js га қўшимча) =====
const _originalDrawMiniMap = Renderer.prototype.drawMiniMap;
Renderer.prototype.drawMiniMap = function(snakes, cols, rows, cam) {
    _originalDrawMiniMap.call(this, snakes, cols, rows, cam);

    // Джойстикни чизиш
    if (typeof Joystick !== 'undefined') {
        Joystick.render(this.ctx);
    }
};
