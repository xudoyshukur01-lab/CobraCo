// ===== PUBG Mobile джойстик =====
const Joystick = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    radius: 60,          // Джойстик радиуси
    innerRadius: 25,     // Ички доира
    baseX: 0,            // Джойстик маркази (экранда)
    baseY: 0,
    visible: false,

    // ===== Ишга тушириш =====
    init() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        // Touch events
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });

        // Mouse (компьютерда синаш учун)
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

        console.log('✅ Джойстик ишга тушди');
    },

    // ===== Touch =====
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        this.startX = touch.clientX - rect.left;
        this.startY = touch.clientY - rect.top;

        // Джойстик маркази — бармоқ тегган жой
        this.baseX = this.startX;
        this.baseY = this.startY;
        this.currentX = this.startX;
        this.currentY = this.startY;
        this.active = true;
        this.visible = true;

        console.log('🎮 Джойстик бошланди:', Math.round(this.startX), Math.round(this.startY));
    },

    onTouchMove(e) {
        if (!this.active) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        this.currentX = touch.clientX - rect.left;
        this.currentY = touch.clientY - rect.top;

        // Йўналишни ҳисоблаш
        this.processDirection();
    },

    onTouchEnd(e) {
        if (!this.active) return;
        e.preventDefault();
        this.active = false;
        this.visible = false;
        console.log('🎮 Джойстик тўхтади');
    },

    // ===== Mouse (компьютерда) =====
    onMouseDown(e) {
        // Фақат чап тугма
        if (e.button !== 0) return;
        const rect = e.target.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;
        this.baseX = this.startX;
        this.baseY = this.startY;
        this.currentX = this.startX;
        this.currentY = this.startY;
        this.active = true;
        this.visible = true;
    },

    onMouseMove(e) {
        if (!this.active) return;
        const rect = e.target.getBoundingClientRect();
        this.currentX = e.clientX - rect.left;
        this.currentY = e.clientY - rect.top;
        this.processDirection();
    },

    onMouseUp(e) {
        if (!this.active) return;
        this.active = false;
        this.visible = false;
    },

    // ===== Йўналишни аниқлаш =====
    processDirection() {
        const dx = this.currentX - this.baseX;
        const dy = this.currentY - this.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Камида 15px суриш керак
        if (dist < 15) return;

        // Асосий йўналиш
        if (Math.abs(dx) > Math.abs(dy)) {
            // Горизонтал
            const dir = dx > 0 ? 'right' : 'left';
            if (typeof Input !== 'undefined' && Input.onDirection) {
                Input.onDirection(dir);
            }
        } else {
            // Вертикал
            const dir = dy > 0 ? 'down' : 'up';
            if (typeof Input !== 'undefined' && Input.onDirection) {
                Input.onDirection(dir);
            }
        }
    },

    // ===== Чизиш =====
    render(ctx) {
        if (!this.visible || !this.active) return;

        // Асосий доира (прозрачный)
        ctx.save();
        ctx.globalAlpha = 0.35;

        // Ташқи доира
        ctx.beginPath();
        ctx.arc(this.baseX, this.baseY, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Ички доира
        const dx = this.currentX - this.baseX;
        const dy = this.currentY - this.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = this.radius - this.innerRadius;

        let innerX = this.baseX;
        let innerY = this.baseY;
        if (dist > maxDist) {
            const angle = Math.atan2(dy, dx);
            innerX = this.baseX + Math.cos(angle) * maxDist;
            innerY = this.baseY + Math.sin(angle) * maxDist;
        } else {
            innerX = this.currentX;
            innerY = this.currentY;
        }

        ctx.beginPath();
        ctx.arc(innerX, innerY, this.innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(74, 222, 128, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
};

console.log('✅ joystick.js юкланди');
