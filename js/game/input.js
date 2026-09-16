// ===== Бошқарув =====
const Input = {
    onDirection: null,

    init(callback) {
        this.onDirection = callback;

        // 1. Клавиатура
        document.addEventListener('keydown', (e) => {
            const keys = {
                ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                w: 'up', s: 'down', a: 'left', d: 'right',
                W: 'up', S: 'down', A: 'left', D: 'right'
            };
            if (keys[e.key]) {
                e.preventDefault();
                this.onDirection(keys[e.key]);
            }
        });

        // 2. Сенсор тугмалар
        document.querySelectorAll('.controls button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.onDirection(btn.dataset.dir);
            });
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.onDirection(btn.dataset.dir);
            }, { passive: false });
        });

        // 3. Свайп (canvas устида)
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        let touchStart = null;
        canvas.addEventListener('touchstart', (e) => {
            touchStart = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }, { passive: true });

        canvas.addEventListener('touchend', (e) => {
            if (!touchStart) return;
            const dx = e.changedTouches[0].clientX - touchStart.x;
            const dy = e.changedTouches[0].clientY - touchStart.y;
            if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.onDirection(dx > 0 ? 'right' : 'left');
            } else {
                this.onDirection(dy > 0 ? 'down' : 'up');
            }
            touchStart = null;
        }, { passive: true });
    }
};

console.log('✅ input.js юкланди');
