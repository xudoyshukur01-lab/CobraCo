// ===== Асосий ўйин =====
const Game = {
    snake: null, snakes: [], bots: [], food: null,
    renderer: null, camera: null, zone: null, mode: null,
    score: 0, respawnsLeft: 3, speed: 0,
    loop: null, botLoop: null, timerInterval: null,
    timeLeft: 0, isRunning: false, isOver: false,
    canvas: null, worldCols: 500, worldRows: 500,
    baseSpeed: 150, top5Interval: null,
    playerTrophies: 0,
    isWorldMode: false,
    session: null,
    shrinkInterval: null,
    _top5Tick: 0,
    _lastFirebaseTop: [],

    init() {
        this.canvas = document.getElementById('gameCanvas');
        const miniMap = document.getElementById('miniMap');
        this.camera = new Camera(400, 400, CONFIG.GRID);
        this.renderer = new Renderer(this.canvas, miniMap, this.camera);
        this.food = new FoodManager(500, 500);

        Input.init(d => {
            if (this.isRunning && this.snake && this.snake.alive) this.snake.setDirection(d);
        });

        document.getElementById('startBtn')?.addEventListener('click', () => {
            if (this.isOver) { this.prepare(); this.beginPlay(); }
            else { this.beginPlay(); }
        });
        document.getElementById('backBtn')?.addEventListener('click', () => this.backToZones());

        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 200);
        });
    },

    resizeCanvas() {
        const wrap = document.getElementById('canvasWrap');
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const size = Math.floor(Math.min(rect.width, rect.height)) - 4;
        if (size < 100) return;
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        if (this.camera) this.camera.updateSize(size, size);
        console.log('📐 Canvas:', size + 'x' + size);
    },

    start(zone) {
        this.zone = zone;
        this.mode = null;
        const mapCfg = MAP_SIZES[String(GameState.settings.mapSize)] || MAP_SIZES['500'];
        this.worldCols = mapCfg.cols;
        this.worldRows = mapCfg.rows;
        this.food = new FoodManager(this.worldCols, this.worldRows);
        showScreen('gameScreen');
        this.prepare();
        setTimeout(() => this.resizeCanvas(), 50);
        setTimeout(() => this.resizeCanvas(), 300);
        this.loadTop5();
    },

    startMode(mode) {
        console.log('🎮 Режим бошланди:', mode.id);
        this.mode = mode;
        this.zone = null;

        const mapCfg = MAP_SIZES[String(mode.mapSize)] || MAP_SIZES['500'];
        this.worldCols = mapCfg.cols;
        this.worldRows = mapCfg.rows;

        GameState.settings.bots = mode.bots;
        GameState.settings.gameTime = mode.gameTime;
        GameState.settings.mapSize = mode.mapSize;

        this.food = new FoodManager(this.worldCols, this.worldRows);

        showScreen('gameScreen');
        setTimeout(() => this.resizeCanvas(), 50);
        setTimeout(() => this.resizeCanvas(), 300);

        this.prepare();
        this.loadTop5();

        if (mode.special && typeof SpecialModes !== 'undefined') {
            setTimeout(() => SpecialModes.setup(mode, this), 100);
        }
    },

    startWorld(session, remainingTime) {
        console.log('🌍 Дунё ўйини:', session.id, '| Вақт:', remainingTime);
        this.mode = GAME_MODES.find(m => m.id === 'world') || GAME_MODES[1];
        this.session = session;
        this.isWorldMode = true;

        const mapCfg = MAP_SIZES[String(this.mode.mapSize)] || MAP_SIZES['1500'];
        this.worldCols = mapCfg.cols;
        this.worldRows = mapCfg.rows;

        this.timeLeft = remainingTime;
        GameState.settings.gameTime = remainingTime;

        const playerCount = session.players ? Object.keys(session.players).length : 1;
        const botCount = WorldMode.calculateBots(playerCount);
        GameState.settings.bots = botCount;
        GameState.settings.playerCount = playerCount;

        this.food = new FoodManager(this.worldCols, this.worldRows);

        showScreen('gameScreen');
        setTimeout(() => this.resizeCanvas(), 50);
        setTimeout(() => this.resizeCanvas(), 300);

        this.prepare();
        this.loadTop5();
    },

    async loadTop5() {
        this.renderTop5(this._lastFirebaseTop || []);

        if (typeof FirebaseDB === 'undefined' || !FirebaseDB.isReady) return;
        try {
            const top = await FirebaseDB.getLeaderboard('global', 5);
            this._lastFirebaseTop = top;
            this.renderTop5(top);
        } catch (e) {
            console.error('❌ loadTop5:', e.message);
        }
    },

    renderTop5(firebaseTop) {
        const list = document.getElementById('top5List');
        if (!list) return;
        list.innerHTML = '';

        const livePlayers = this.snakes
            .filter(s => s.alive)
            .map(s => ({
                name: s.isPlayer ? 'Сиз' : (s.name || 'Бот'),
                score: s.isPlayer ? this.score : (s.score || 0),
                isPlayer: s.isPlayer,
                isBot: !s.isPlayer
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        if (this.isWorldMode) {
            const playerCount = GameState.settings.playerCount || 1;
            const botCount = GameState.settings.bots || 0;
            const info = document.createElement('div');
            info.style.cssText = 'font-size:10px;color:#94a3b8;text-align:center;padding:3px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:4px;';
            info.innerHTML = '👥 ' + playerCount + ' + 🤖 ' + botCount;
            list.appendChild(info);
        }

        if (livePlayers.length > 0) {
            const liveTitle = document.createElement('div');
            liveTitle.style.cssText = 'font-size:9px;color:#4ade80;text-align:center;padding:2px;font-weight:700;';
            liveTitle.textContent = '🔴 ҲОЗИРГИ ЎЙИН';
            list.appendChild(liveTitle);

            const icons = ['🥇','🥈','🥉','4️⃣','5️⃣'];
            livePlayers.forEach((p, i) => {
                const row = document.createElement('div');
                row.className = 'top5-item' + (p.isPlayer ? ' me' : '') + (p.isBot ? ' bot' : '');
                row.innerHTML = '<span class="top5-rank">' + icons[i] + '</span>' +
                               '<span class="top5-name">' + p.name + '</span>' +
                               '<span class="top5-score">' + p.score + '</span>';
                list.appendChild(row);
            });
        }

        if (firebaseTop && firebaseTop.length > 0) {
            const fbTitle = document.createElement('div');
            fbTitle.style.cssText = 'font-size:9px;color:#fbbf24;text-align:center;padding:2px;font-weight:700;margin-top:5px;border-top:1px solid rgba(255,255,255,0.1);';
            fbTitle.textContent = '🏆 УМУМИЙ РЕЙТИНГ';
            list.appendChild(fbTitle);

            const myId = TelegramAuth.user ? TelegramAuth.user.id : 0;
            const icons = ['🥇','🥈','🥉','4️⃣','5️⃣'];
            firebaseTop.forEach((d, i) => {
                const isMe = d.telegramId === myId;
                const isBot = d.isBot === true;
                const name = isBot ? '🤖 ' + (d.firstName || 'Бот') :
                            (d.username ? '@' + d.username : (d.firstName || 'X'));

                const row = document.createElement('div');
                row.className = 'top5-item' + (isMe ? ' me' : '') + (isBot ? ' bot' : '');
                row.innerHTML = '<span class="top5-rank">' + (icons[i] || (i+1)) + '</span>' +
                               '<span class="top5-name">' + name + '</span>' +
                               '<span class="top5-score">' + (d.trophies || 0) + '</span>';
                list.appendChild(row);
            });
        }

        if (livePlayers.length === 0 && (!firebaseTop || firebaseTop.length === 0)) {
            list.innerHTML = '<div style="font-size:10px;color:#64748b;text-align:center;padding:10px;">Ҳали натижа йўқ</div>';
        }
    },

    prepare() {
        this.snakes = []; this.bots = []; this.food.clear();
        this.score = 0;
        this.respawnsLeft = CONFIG.MAX_RESPAWNS;
        this.isOver = false;

        let speedMultiplier = 1.0;
        if (this.mode && this.mode.id === 'speed') speedMultiplier = 2.0;
        else if (this.zone) speedMultiplier = this.zone.speedMultiplier || 1.0;

        this.baseSpeed = CONFIG.BASE_SPEED / speedMultiplier;
        this.speed = this.baseSpeed;
        this.timeLeft = GameState.settings.gameTime;

        document.getElementById('score').textContent = 0;
        document.getElementById('respawn').textContent = this.respawnsLeft;
        document.getElementById('trophyResult').innerHTML = '';
        this.updateTimerDisplay();

        this.playerTrophies = Storage.getTrophies();

        let playerColor = '#4ade80';
        if (this.zone) playerColor = this.zone.color;
        else if (this.mode) playerColor = this.mode.color;

        this.snake = new Snake({
            id:'player', isPlayer:true, color:playerColor, name:'Сиз',
            worldCols:this.worldCols, worldRows:this.worldRows,
            startX: Math.floor(this.worldCols/2), startY: Math.floor(this.worldRows/2), length:5
        });
        this.snakes.push(this.snake);

        const colors = ['#ef4444','#fbbf24','#a78bfa','#22d3ee','#f472b6','#84cc16','#f97316','#06b6d4','#8b5cf6','#ec4899'];
        const botNames = ['Аждар','Кобра','Питон','Анаконда','Гюрза','Мамба','Випера','Удав','Тайпан','Боа'];

        const botCount = GameState.settings.bots || 3;
        for (let i = 0; i < botCount; i++) {
            const b = new Snake({
                id:'bot_'+i, isPlayer:false,
                color:colors[i%colors.length],
                name:botNames[i % botNames.length],
                worldCols:this.worldCols, worldRows:this.worldRows,
                startX: Math.floor(Math.random()*this.worldCols),
                startY: Math.floor(Math.random()*this.worldRows),
                length: 5 + Math.floor(Math.random()*5)
            });
            this.snakes.push(b);
            this.bots.push(new BotController(b, this, 'medium'));
        }

        const foodCount = this.mode?.foodCount || CONFIG.FOOD_INITIAL;
        this.food.targetCount = foodCount;
        this.food.spawn(foodCount);

        this.camera.x = this.snake.getHead().x - (this.canvas.width / CONFIG.GRID) / 2;
        this.camera.y = this.snake.getHead().y - (this.canvas.height / CONFIG.GRID) / 2;
        this.render();
        this.showOverlay('🐍 ' + (this.zone?.name || this.mode?.name || 'Ўйин'), 'Бошлаш учун тугмани босинг', 'Бошлаш');
    },

    beginPlay() {
        this.hideOverlay();
        this.isRunning = true;
        this.speed = this.baseSpeed;

        clearInterval(this.loop);
        this.loop = setInterval(() => this.update(), this.speed);

        this.botLoop = setInterval(() => {
            const n = Date.now();
            this.bots.forEach(b => b.update(n));
        }, 100);

        this.startTimer();

        clearInterval(this.top5Interval);
        this.top5Interval = setInterval(() => this.loadTop5(), CONFIG.TOP5_UPDATE_INTERVAL);

        if (CONFIG.MAP_SHRINK_ENABLED) {
            this.startMapShrink();
        }
    },

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.isRunning) return;
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) this.gameOver('Вақт тугади!');
        }, 1000);
    },

    updateTimerDisplay() {
        const m = Math.floor(this.timeLeft / 60);
        const s = this.timeLeft % 60;
        document.getElementById('timer').textContent = m + ':' + String(s).padStart(2, '0');
    },

    update() {
        if (!this.isRunning) return;

        this.snakes.forEach(s => {
            if (!s.alive) return;
            const h = s.move();
            if (!h) return;
            s.applyMove(h);
            const eaten = this.food.checkEat(h);
            if (eaten) this.handleFoodEaten(s, eaten);
        });

        if (this.food.items.length < this.food.targetCount) {
            this.food.refill(Math.min(100, this.food.targetCount - this.food.items.length));
        }

        Collision.checkSnakes(this.snakes, this.food);
        if (!this.snake.alive) this.handlePlayerDeath();
        if (this.snake.alive)
            this.camera.follow(this.snake.getHead().x, this.snake.getHead().y);

        this.render();

        // ТОП-5 ни янгилаш
        this._top5Tick++;
        if (this._top5Tick >= 30) {
            this._top5Tick = 0;
            this.renderTop5(this._lastFirebaseTop || []);
        }
    },

    handleFoodEaten(snake, foodItem) {
        const type = foodItem.type;
        const scoreDelta = type.score;
        if (snake.isPlayer) {
            this.score = Math.max(0, this.score + scoreDelta);
            document.getElementById('score').textContent = this.score;
        }
        snake.score = (snake.score || 0) + scoreDelta;
        if (type.grow !== 0) snake.grow(type.grow);
        if (type.effect === 'speed') {
            snake.applySpeedBoost(type.duration);
            if (snake.isPlayer) this.applySpeedBoostToLoop();
        } else if (type.effect === 'shield') {
            snake.applyShield(type.duration);
        }
    },

    applySpeedBoostToLoop() {
        const boostedSpeed = Math.max(CONFIG.MIN_SPEED, this.speed - 40);
        clearInterval(this.loop);
        this.loop = setInterval(() => this.update(), boostedSpeed);
        setTimeout(() => {
            if (!this.isRunning) return;
            this.speed = this.baseSpeed;
            clearInterval(this.loop);
            this.loop = setInterval(() => this.update(), this.speed);
        }, 5000);
    },

    handlePlayerDeath() {
        if (this.isOver) return;

        if (this.timeLeft > 0 && this.respawnsLeft > 1) {
            this.respawnsLeft--;
            document.getElementById('respawn').textContent = this.respawnsLeft;

            setTimeout(() => {
                if (this.isOver) return;
                this.snake.reset(
                    Math.floor(Math.random()*this.worldCols),
                    Math.floor(Math.random()*this.worldRows), 5
                );
                this.snake.alive = true;
                this.camera.x = this.snake.getHead().x - 10;
                this.camera.y = this.snake.getHead().y - 10;
            }, CONFIG.RESPAWN_DELAY);
        } else if (this.timeLeft <= 0) {
            this.gameOver('Вақт тугади!');
        } else {
            this.snake.alive = false;
            setTimeout(() => {
                if (!this.isOver && this.timeLeft > 0) {
                    this.showOverlay('💀 Респавнлар тугади',
                        'Вақт тугагунча кузатинг\nҚолган: ' + this.timeLeft + 'с', 'Кутиш');
                }
            }, 500);
        }
    },

    render() {
        this.renderer.clear();
        this.renderer.drawGridLines(this.worldCols, this.worldRows);
        this.renderer.drawFood(this.food.items);
        this.snakes.forEach(s => { if (!s.isPlayer) this.renderer.drawSnake(s); });
        if (this.snake && this.snake.alive) this.renderer.drawSnake(this.snake);
        this.renderer.drawMiniMap(this.snakes, this.worldCols, this.worldRows, this.camera);

        // Джойстик
        if (typeof Joystick !== 'undefined') Joystick.render(this.renderer.ctx);
    },

    startMapShrink() {
        if (!CONFIG.MAP_SHRINK_ENABLED) return;
        if (this.shrinkInterval) clearInterval(this.shrinkInterval);

        this.initialFoodCount = this.food.items.length;
        this.currentFoodTarget = this.initialFoodCount;

        this.shrinkInterval = setInterval(() => {
            if (!this.isRunning) return;

            const currentSize = this.worldCols;
            const newSize = Math.max(
                CONFIG.MIN_MAP_SIZE,
                Math.floor(currentSize * (1 - CONFIG.SHRINK_PERCENT))
            );

            if (newSize === currentSize) return;

            const oldSize = currentSize;
            const shrinkRatio = newSize / oldSize;

            this.worldCols = newSize;
            this.worldRows = newSize;

            const areaRatio = shrinkRatio * shrinkRatio;
            const newFoodTarget = Math.max(
                CONFIG.MIN_FOOD,
                Math.floor(this.currentFoodTarget * areaRatio)
            );

            const oldFoodCount = this.food.items.length;
            this.currentFoodTarget = newFoodTarget;
            this.food.targetCount = newFoodTarget;
            this.food.cols = newSize;
            this.food.rows = newSize;

            if (this.food.items.length > newFoodTarget) {
                const toRemove = this.food.items.length - newFoodTarget;
                for (let i = 0; i < toRemove; i++) {
                    const idx = Math.floor(Math.random() * this.food.items.length);
                    this.food.items.splice(idx, 1);
                }
            }

            this.food.items.forEach(f => {
                if (f.x >= newSize || f.y >= newSize) {
                    f.x = Math.floor(Math.random() * newSize);
                    f.y = Math.floor(Math.random() * newSize);
                }
            });

            this.snakes.forEach(s => {
                if (!s.alive) return;
                s.worldCols = newSize;
                s.worldRows = newSize;
                s.body.forEach(seg => {
                    if (seg.x >= newSize) seg.x = Math.floor(Math.random() * newSize);
                    if (seg.y >= newSize) seg.y = Math.floor(Math.random() * newSize);
                });
            });

            console.log('🗺️ Карта:', oldSize + '→' + newSize,
                        '| 🍎 Овқат:', oldFoodCount + '→' + newFoodTarget);

            this.showShrinkMessage(newSize, oldFoodCount, newFoodTarget);
        }, CONFIG.SHRINK_INTERVAL);
    },

    showShrinkMessage(newSize, oldFood, newFood) {
        const el = document.getElementById('shrinkMessage');
        if (!el) return;
        const foodInfo = (oldFood !== undefined && newFood !== undefined)
            ? ' · 🍎 ' + oldFood + ' → ' + newFood
            : '';
        el.textContent = '⚠️ Карта кичрайди: ' + newSize + '×' + newSize + foodInfo;
        el.style.opacity = '1';
        el.style.display = 'block';
        if (el._timeout) clearTimeout(el._timeout);
        el._timeout = setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => { el.style.display = 'none'; }, 500);
        }, 3000);
    },

    async gameOver(reason) {
        if (this.isOver) return;
        this.isOver = true; this.isRunning = false;

        clearInterval(this.loop);
        clearInterval(this.botLoop);
        clearInterval(this.timerInterval);
        clearInterval(this.top5Interval);
        if (this.shrinkInterval) clearInterval(this.shrinkInterval);

        const isTimeUp = reason === 'Вақт тугади!' || this.timeLeft <= 0;

        if (isTimeUp) {
            console.log('⏱ Вақт тугади — кубок тақсимлаш');
            await this.distributeTrophies();
        } else {
            Storage.setBest(this.zone?.id || this.mode?.id || 'classic', this.score);
            if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isReady) {
                await FirebaseDB.saveScore(this.zone?.id || this.mode?.id || 'classic', this.score);
            }
        }

        const resultText = isTimeUp
            ? reason + '\nБаллингиз: ' + this.score + '\n\n🏆 Кубоклар тақсимланди!'
            : reason + '\nБаллингиз: ' + this.score;

        this.showOverlay('Ўйин тугади!', resultText, 'Қайта ўйнаш');
        if (typeof TrophiesUI !== 'undefined') TrophiesUI.updateHeader(this.playerTrophies);
    },

    async distributeTrophies() {
        const players = this.snakes.map(s => ({
            id: s.id, name: s.name,
            score: s.isPlayer ? this.score : (s.score || 0),
            trophies: s.isPlayer ? this.playerTrophies : 0,
            isBot: !s.isPlayer
        }));

        const changes = Trophies.calculateChanges(players);
        const playerChange = changes['player'] || 0;
        const newTotal = Math.max(0, this.playerTrophies + playerChange);

        if (playerChange !== 0 && typeof FirebaseDB !== 'undefined' && FirebaseDB.isReady) {
            await FirebaseDB.updateTrophies(newTotal);
            const scopes = ['global', 'country', 'region'];
            for (const scope of scopes) {
                await FirebaseDB.addToLeaderboard(scope, newTotal);
            }
        }

        Storage.saveTrophies(newTotal);
        this.playerTrophies = newTotal;

        if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isReady) {
            for (const p of players) {
                if (p.isBot) {
                    const change = changes[p.id] || 0;
                    const current = await FirebaseDB.getBotTrophy(p.id);
                    const botNewTotal = Math.max(0, current + change);
                    await FirebaseDB.updateBotTrophy(p.id, botNewTotal, { name: p.name });
                }
            }
        }

        this.showTrophyResult(playerChange, newTotal);
        Storage.setBest(this.zone?.id || this.mode?.id || 'classic', this.score);
        if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isReady) {
            await FirebaseDB.saveScore(this.zone?.id || this.mode?.id || 'classic', this.score);
        }
    },

    showTrophyResult(change, newTotal) {
        const el = document.getElementById('trophyResult');
        if (!el) return;
        const cls = Trophies.getChangeClass(change);
        const sign = Trophies.formatChange(change);
        const rank = Trophies.getRank(newTotal);
        const oldRank = Trophies.getRank(this.playerTrophies - change);
        const rankUp = rank.name !== oldRank.name;
        el.innerHTML = `
            <div class="trophy-change ${cls}">${sign} 🏆</div>
            <div class="trophy-new-total">${rank.icon} ${newTotal} кубок</div>
            ${rankUp ? `<div class="rank-up">🎉 Янги даража: ${rank.icon} ${rank.name}!</div>` : ''}
        `;
    },

    showOverlay(t, txt, b) {
        const overlay = document.getElementById('overlay');
        const titleEl = document.getElementById('overlayTitle');
        const textEl = document.getElementById('overlayText');
        const startBtn = document.getElementById('startBtn');

        if (titleEl) titleEl.textContent = t;
        if (textEl) textEl.innerText = txt;
        if (startBtn) {
            startBtn.textContent = b || 'Бошлаш';
            startBtn.style.display = 'block';
        }

        overlay.querySelectorAll('.overlay-extra-btn').forEach(el => el.remove());

        if (this.isOver) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'overlay-extra-btn';
            btnContainer.style.cssText = 'display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;justify-content:center;';

            const backBtn = document.createElement('button');
            backBtn.textContent = '⬅️ Орқага';
            backBtn.style.cssText = 'padding:12px 24px;font-size:14px;font-weight:700;border-radius:40px;background:rgba(255,255,255,0.1);color:#fff;border:2px solid rgba(255,255,255,0.2);cursor:pointer;font-family:inherit;';
            backBtn.onclick = () => {
                this.hideOverlay();
                if (typeof ModesUI !== 'undefined') ModesUI.open();
            };

            const menuBtn = document.createElement('button');
            menuBtn.textContent = '🏠 Меню';
            menuBtn.style.cssText = 'padding:12px 24px;font-size:14px;font-weight:700;border-radius:40px;background:rgba(74,222,128,0.2);color:#4ade80;border:2px solid rgba(74,222,128,0.4);cursor:pointer;font-family:inherit;';
            menuBtn.onclick = () => {
                this.hideOverlay();
                if (typeof ZonesUI !== 'undefined') {
                    ZonesUI.render();
                    if (typeof TrophiesUI !== 'undefined') {
                        TrophiesUI.updateHeader(this.playerTrophies || 0);
                    }
                }
                showScreen('zonesScreen');
            };

            btnContainer.appendChild(backBtn);
            btnContainer.appendChild(menuBtn);
            overlay.appendChild(btnContainer);
        }

        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
    },

    hideOverlay() {
        const overlay = document.getElementById('overlay');
        overlay.classList.add('hidden');
        overlay.querySelectorAll('.overlay-extra-btn').forEach(el => el.remove());
    },

    backToZones() {
        clearInterval(this.loop);
        clearInterval(this.botLoop);
        clearInterval(this.timerInterval);
        clearInterval(this.top5Interval);
        if (this.shrinkInterval) clearInterval(this.shrinkInterval);
        this.isRunning = false; this.isOver = false;
        if (typeof ZonesUI !== 'undefined') ZonesUI.render();
        document.getElementById('bestScore').textContent = Storage.getTotalBest();
        if (typeof TrophiesUI !== 'undefined') TrophiesUI.updateHeader(this.playerTrophies);
        showScreen('zonesScreen');
    },

    updateBotTrophies: null
};

console.log('✅ game.js юкланди (тузатилган)');
