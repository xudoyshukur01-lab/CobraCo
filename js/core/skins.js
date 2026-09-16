// ===== Скинлар тизими — 5 қисм =====
// 1. Бош  2. Кўзлар  3. Тана  4. Оёқчалар  5. Дум
const SKINS = {
    // 12 хил ранг
    COLORS: [
        { id: 'green',  name: 'Яшил',     hex: '#4ade80' },
        { id: 'red',    name: 'Қизил',    hex: '#ef4444' },
        { id: 'blue',   name: 'Кўк',      hex: '#3b82f6' },
        { id: 'cyan',   name: 'Ҳаворанг', hex: '#22d3ee' },
        { id: 'yellow', name: 'Сариқ',    hex: '#fbbf24' },
        { id: 'orange', name: 'Оранж',    hex: '#f97316' },
        { id: 'purple', name: 'Бинафша',  hex: '#a855f7' },
        { id: 'pink',   name: 'Пушти',    hex: '#ec4899' },
        { id: 'lime',   name: 'Лайм',     hex: '#84cc16' },
        { id: 'white',  name: 'Оқ',       hex: '#f1f5f9' },
        { id: 'gray',   name: 'Кулранг',  hex: '#94a3b8' },
        { id: 'dark',   name: 'Қора',     hex: '#1e293b' }
    ],

    // 8 хил шакл
    SHAPES: [
        { id: 'round',    name: 'Доира',     emoji: '⚪' },
        { id: 'square',   name: 'Квадрат',   emoji: '⬛' },
        { id: 'diamond',  name: 'Ромб',      emoji: '🔶' },
        { id: 'star',     name: 'Юлдуз',     emoji: '⭐' },
        { id: 'hexagon',  name: 'Олтибурчак', emoji: '💠' },
        { id: 'triangle', name: 'Учбурчак',  emoji: '🔺' },
        { id: 'circle',   name: 'Айлана',    emoji: '➰' },
        { id: 'dot',      name: 'Нуқта',     emoji: '⚫' }
    ],

    // 5 та қисм
    PARTS: [
        { id: 0, name: '🐍 Бош',      emoji: '🐍' },
        { id: 1, name: '👁️ Кўзлар',   emoji: '👁️' },
        { id: 2, name: '🟢 Тана',     emoji: '🟢' },
        { id: 3, name: '🦎 Оёқчалар', emoji: '🦎' },
        { id: 4, name: '🔺 Дум',      emoji: '🔺' }
    ],

    KEY_SKIN: 'cobraco_skin_v3',

    getCurrent() {
        const raw = localStorage.getItem(this.KEY_SKIN);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (data.parts && data.parts.length === 5) return data;
            } catch (e) {}
        }
        return this.getDefault();
    },

    getDefault() {
        return {
            name: 'Яшил классик',
            parts: [
                { colorId: 'green',  shapeId: 'round' },   // Бош
                { colorId: 'white',  shapeId: 'circle' },  // Кўзлар (оқ)
                { colorId: 'green',  shapeId: 'round' },   // Тана
                { colorId: 'green',  shapeId: 'dot' },     // Оёқчалар
                { colorId: 'green',  shapeId: 'triangle' } // Дум
            ]
        };
    },

    save(skin) {
        localStorage.setItem(this.KEY_SKIN, JSON.stringify(skin));
        console.log('✅ Скин сақланди:', skin.name);
    },

    updatePart(index, colorId, shapeId) {
        const skin = this.getCurrent();
        if (index < 0 || index >= 5) return;
        skin.parts[index].colorId = colorId;
        skin.parts[index].shapeId = shapeId;
        skin.name = 'Махсус скин';
        this.save(skin);
        return skin;
    },

    getColorById(id) {
        return this.COLORS.find(c => c.id === id) || this.COLORS[0];
    },
    getShapeById(id) {
        return this.SHAPES.find(s => s.id === id) || this.SHAPES[0];
    },
    getPartColor(skin, i) {
        return this.getColorById(skin.parts[i].colorId).hex;
    },
    getPartShape(skin, i) {
        return this.getShapeById(skin.parts[i].shapeId).id;
    },

    // ===== Шакл чизиш (умумий) =====
    drawShape(ctx, shapeId, cx, cy, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        switch (shapeId) {
            case 'round':
            case 'circle':
                ctx.arc(cx, cy, size, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.rect(cx - size, cy - size, size * 2, size * 2);
                break;
            case 'diamond':
                ctx.moveTo(cx, cy - size);
                ctx.lineTo(cx + size, cy);
                ctx.lineTo(cx, cy + size);
                ctx.lineTo(cx - size, cy);
                ctx.closePath();
                break;
            case 'star':
                for (let i = 0; i < 10; i++) {
                    const r = i % 2 === 0 ? size : size * 0.45;
                    const a = (Math.PI / 5) * i - Math.PI / 2;
                    const px = cx + Math.cos(a) * r;
                    const py = cy + Math.sin(a) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI / 3) * i - Math.PI / 2;
                    const px = cx + Math.cos(a) * size;
                    const py = cy + Math.sin(a) * size;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
            case 'triangle':
                ctx.moveTo(cx, cy - size);
                ctx.lineTo(cx + size * 0.87, cy + size * 0.5);
                ctx.lineTo(cx - size * 0.87, cy + size * 0.5);
                ctx.closePath();
                break;
            case 'dot':
                ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
                break;
            default:
                ctx.arc(cx, cy, size, 0, Math.PI * 2);
        }
        ctx.fill();
    },

    // ===== Кўз чизиш =====
    drawEye(ctx, cx, cy, size, color, dir) {
        // dir — илон ҳаракат йўналиши
        const perpX = -dir.y;
        const perpY = dir.x;
        const eyeOff = size * 0.5;
        const eyeSize = Math.max(1.5, size * 0.28);

        // Оқ (ёки танланган ранг)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx + perpX * eyeOff + dir.x * size * 0.2,
                cy + perpY * eyeOff + dir.y * size * 0.2,
                eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - perpX * eyeOff + dir.x * size * 0.2,
                cy - perpY * eyeOff + dir.y * size * 0.2,
                eyeSize, 0, Math.PI * 2);
        ctx.fill();
    },

    // ===== Оёқча чизиш =====
    drawLeg(ctx, cx, cy, size, color, side) {
        // side: -1 (чап), +1 (ўнг)
        ctx.fillStyle = color;
        const legX = cx + side * size * 0.9;
        const legY = cy + size * 0.3;
        ctx.beginPath();
        ctx.arc(legX, legY, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
};

console.log('✅ skins.js юкланди (v3 — 5 қисм)');
console.log('  🎨 Ранглар:', SKINS.COLORS.length);
console.log('  🔷 Шакллар:', SKINS.SHAPES.length);
console.log('  📦 Қисмлар:', SKINS.PARTS.map(p => p.name).join(', '));
