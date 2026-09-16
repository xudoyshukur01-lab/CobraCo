// ===== Илон preview — 5 қисмли (иккала canvas) =====
const SkinPreview = {
    canvases: [],       // Ҳамма canvas лар
    contexts: [],
    animationId: null,
    snake: [],
    direction: { x: 1, y: 0 },
    lastMove: 0,
    moveInterval: 180,
    cellSize: 14,
    skin: null,

    // ===== Ҳамма canvas ларни топиш =====
    initAll() {
        this.canvases = [];
        this.contexts = [];

        // Ҳамма canvas ларни топиш
        const ids = ['skinPreviewCanvas', 'skinPreviewCanvasBig'];
        ids.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                // Ўлчамни мослаш
                canvas.width = 220;
                canvas.height = 70;

                this.canvases.push(canvas);
                this.contexts.push(canvas.getContext('2d'));
                console.log('✅ Preview canvas топилди:', id);
            }
        });

        if (this.canvases.length === 0) {
            console.warn('⚠️ Preview canvas топилмади');
            return;
        }

        // Ўлчамни ҳисоблаш
        this.cols = Math.floor(this.canvases[0].width / this.cellSize);
        this.rows = Math.floor(this.canvases[0].height / this.cellSize);

        this.skin = SKINS.getCurrent();
        this.resetSnake();
        this.start();
    },

    // Эски init (мослик учун)
    init() {
        this.initAll();
    },

    resetSnake() {
        const startX = 3;
        const startY = Math.floor(this.rows / 2);
        this.snake = [
            { x: startX,     y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY },
            { x: startX - 3, y: startY },
            { x: startX - 4, y: startY }
        ];
        this.direction = { x: 1, y: 0 };
    },

    updateSkin() {
        this.skin = SKINS.getCurrent();
    },

    start() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        const loop = (now) => {
            if (now - this.lastMove > this.moveInterval) {
                this.lastMove = now;
                this.update();
            }
            this.render();
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    },

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    update() {
        const head = this.snake[0];
        let newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        if (newHead.x >= this.cols - 1 || newHead.x < 1) {
            this.direction.x = -this.direction.x;
            newHead.x = head.x + this.direction.x;
        }

        this.snake.unshift(newHead);
        this.snake.pop();
    },

    // ===== ҲАР БИР CANVAS ГА ЧИЗИШ =====
    render() {
        this.contexts.forEach((ctx, idx) => {
            this.renderOne(ctx, this.canvases[idx]);
        });
    },

    renderOne(ctx, canvas) {
        const cs = this.cellSize;

        // Фон
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Тўр
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= this.cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cs, 0);
            ctx.lineTo(x * cs, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= this.rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cs);
            ctx.lineTo(canvas.width, y * cs);
            ctx.stroke();
        }

        const skin = this.skin || SKINS.getCurrent();

        // Ҳар бўғинни алоҳида чизиш
        this.snake.forEach((seg, i) => {
            const cx = seg.x * cs + cs / 2;
            const cy = seg.y * cs + cs / 2;
            const size = cs / 2 - 1;

            // 1. БОШ (i === 0)
            if (i === 0) {
                const color = SKINS.getPartColor(skin, 0);
                const shape = SKINS.getPartShape(skin, 0);
                ctx.shadowColor = color;
                ctx.shadowBlur = 10;
                SKINS.drawShape(ctx, shape, cx, cy, size, color);
                ctx.shadowBlur = 0;
            }
            // 2. КЎЗЛАР (i === 1)
            else if (i === 1) {
                const color = SKINS.getPartColor(skin, 1);
                const prevHead = this.snake[0];
                const dir = {
                    x: Math.sign(prevHead.x - seg.x) || this.direction.x,
                    y: Math.sign(prevHead.y - seg.y) || this.direction.y
                };
                const hx = prevHead.x * cs + cs / 2;
                const hy = prevHead.y * cs + cs / 2;
                SKINS.drawEye(ctx, hx, hy, size, color, dir);
            }
            // 3. ТАНА (i === 2)
            else if (i === 2) {
                const color = SKINS.getPartColor(skin, 2);
                const shape = SKINS.getPartShape(skin, 2);
                SKINS.drawShape(ctx, shape, cx, cy, size * 0.9, color);
            }
            // 4. ОЁҚЧАЛАР (i === 3)
            else if (i === 3) {
                const color = SKINS.getPartColor(skin, 3);
                SKINS.drawShape(ctx, 'round', cx, cy, size * 0.9, SKINS.getPartColor(skin, 2));
                SKINS.drawLeg(ctx, cx, cy, size, color, -1);
                SKINS.drawLeg(ctx, cx, cy, size, color, +1);
            }
            // 5. ДУМ (i === 4)
            else if (i === 4) {
                const color = SKINS.getPartColor(skin, 4);
                const shape = SKINS.getPartShape(skin, 4);
                SKINS.drawShape(ctx, shape, cx, cy, size * 0.7, color);
            }
        });
    }
};

console.log('✅ skinPreview.js юкланди (кўп canvas)');
