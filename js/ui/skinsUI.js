// ===== Скин танлаш UI — 5 қисм =====
const SkinsUI = {
    currentPart: 0,

    init() {
        document.getElementById('skinChangeBtn')?.addEventListener('click', () => this.open());
        document.getElementById('skinsBackBtn')?.addEventListener('click', () => showScreen('zonesScreen'));

        document.getElementById('presetGreenBtn')?.addEventListener('click', () => this.applyPreset('green'));
        document.getElementById('presetRainbowBtn')?.addEventListener('click', () => this.applyPreset('rainbow'));
        document.getElementById('presetRandomBtn')?.addEventListener('click', () => this.applyRandom());
        document.getElementById('applyAllBtn')?.addEventListener('click', () => this.applyToAll());

        this.render();
    },

    open() {
        showScreen('skinsScreen');
        this.currentPart = 0;

        // Preview ни қайта инициализация қилиш (скин экранидаги canvas билан)
        setTimeout(() => {
            if (typeof SkinPreview !== 'undefined') {
                SkinPreview.initAll();
            }
        }, 100);

        this.render();
    },

    render() {
        const skin = SKINS.getCurrent();
        this.renderPartTabs(skin);
        this.renderColors(skin);
        this.renderShapes(skin);
        if (typeof SkinPreview !== 'undefined') SkinPreview.updateSkin();
    },

    renderPartTabs(skin) {
        const el = document.getElementById('partTabs');
        if (!el) return;
        el.innerHTML = '';
        SKINS.PARTS.forEach((part, i) => {
            const btn = document.createElement('button');
            const color = SKINS.getPartColor(skin, i);
            const isActive = i === this.currentPart;
            btn.className = 'part-tab' + (isActive ? ' active' : '');
            btn.innerHTML = `
                <div class="part-dot" style="background:${color}; box-shadow:0 0 10px ${color}80;"></div>
                <div class="part-name">${part.name}</div>
            `;
            btn.addEventListener('click', () => {
                this.currentPart = i;
                this.render();
            });
            el.appendChild(btn);
        });
    },

    renderColors(skin) {
        const el = document.getElementById('colorsGrid');
        if (!el) return;
        el.innerHTML = '';
        const current = skin.parts[this.currentPart];
        SKINS.COLORS.forEach(color => {
            const btn = document.createElement('button');
            const isActive = color.id === current.colorId;
            btn.className = 'color-btn' + (isActive ? ' active' : '');
            btn.style.background = color.hex;
            btn.style.boxShadow = isActive ? `0 0 20px ${color.hex}` : '';
            btn.title = color.name;
            btn.addEventListener('click', () => {
                SKINS.updatePart(this.currentPart, color.id, current.shapeId);
                this.render();
            });
            el.appendChild(btn);
        });
    },

    renderShapes(skin) {
        const el = document.getElementById('shapesGrid');
        if (!el) return;
        el.innerHTML = '';
        const current = skin.parts[this.currentPart];
        SKINS.SHAPES.forEach(shape => {
            const btn = document.createElement('button');
            const isActive = shape.id === current.shapeId;
            btn.className = 'shape-btn' + (isActive ? ' active' : '');
            btn.innerHTML = `<span class="shape-emoji">${shape.emoji}</span><span class="shape-name">${shape.name}</span>`;
            btn.addEventListener('click', () => {
                SKINS.updatePart(this.currentPart, current.colorId, shape.id);
                this.render();
            });
            el.appendChild(btn);
        });
    },

    applyPreset(type) {
        const skin = SKINS.getCurrent();
        if (type === 'green') {
            skin.parts = [
                { colorId: 'green', shapeId: 'round' },
                { colorId: 'white', shapeId: 'circle' },
                { colorId: 'green', shapeId: 'round' },
                { colorId: 'green', shapeId: 'dot' },
                { colorId: 'green', shapeId: 'triangle' }
            ];
            skin.name = 'Яшил классик';
        } else if (type === 'rainbow') {
            skin.parts = [
                { colorId: 'red',    shapeId: 'round' },
                { colorId: 'white',  shapeId: 'circle' },
                { colorId: 'orange', shapeId: 'round' },
                { colorId: 'yellow', shapeId: 'dot' },
                { colorId: 'lime',   shapeId: 'triangle' }
            ];
            skin.name = 'Радуга';
        }
        SKINS.save(skin);
        this.render();
    },

    applyRandom() {
        const skin = SKINS.getCurrent();
        skin.parts.forEach(p => {
            p.colorId = SKINS.COLORS[Math.floor(Math.random() * SKINS.COLORS.length)].id;
            p.shapeId = SKINS.SHAPES[Math.floor(Math.random() * SKINS.SHAPES.length)].id;
        });
        skin.name = 'Тасодифий';
        SKINS.save(skin);
        this.render();
    },

    applyToAll() {
        const skin = SKINS.getCurrent();
        const current = skin.parts[this.currentPart];
        skin.parts.forEach(p => {
            p.colorId = current.colorId;
            p.shapeId = current.shapeId;
        });
        skin.name = 'Бир хил скин';
        SKINS.save(skin);
        this.render();
    }
};

console.log('✅ skinsUI.js юкланди (5 қисм)');
