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

        // 2. Сенсор тугмалар (эски)
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

        // 3. Джойстик (PUBG)
        if (typeof Joystick !== 'undefined') {
            Joystick.init();
        }
    }
};

console.log('✅ input.js юкланди (джойстик)');
