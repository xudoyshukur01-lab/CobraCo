// ===== Асосий ўйин =====
const Game = {
    snake: null, snakes: [], bots: [], food: null,
    renderer: null, camera: null, zone: null,
    score: 0, respawnsLeft: 3, speed: 0,
    loop: null, botLoop: null, timerInterval: null,
    timeLeft: 0, isRunning: false, isOver: false,
    canvas: null, worldCols: 500, worldRows: 500,
    baseSpeed: 150, top5Interval: null,
    playerTrophies: 0,
    resizeTimeout: null,
    resizeAttempts: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        const miniMap = document.getElementById('miniMap');
        this.camera = new Camera(400, 400, CONFIG.GRID);
        this.renderer = new Renderer(this.canvas, miniMap, this.camera);
        this.food = new FoodManager(500, 500);

        Input.init(d => {
            if (this.isRunning && this.snake && this.snake.alive) this.snake.setDirection(d);
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            if (this.isOver) { this.prepare(); this.beginPlay(); }
            else { this.beginPlay(); }
        });
        document.getElementById('backBtn').addEventListener('click', () => this.backToZones());

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.resizeCanvas(), 100);
        });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resizeCanvas(), 300);
        });
    },

    // ===== ТУЗАТИЛГАН: Canvas мослаш =====
    resizeCanvas() {
        const wrap = document.getElementById('canvasWrap');
        const screen = document.getElementById('gameScreen');
        if (!wrap || !screen) return;

        // Экран кўринишини текшириш
        if (!screen.classList.contains('active')) {
            return;  // Экран кўринмаса — мосламаймиз
        }

        const rect = wrap.getBoundingClientRect();

        // Агар wrap кичик бўлса — яна бир марта уриниб кўрамиз
        if (rect.width < 100 || rect.height < 100) {
            this.resizeAttempts++;
            if (this.resizeAttempts < 10) {
                setTimeout(() => this.resizeCanvas(), 100);
            }
            return;
        }

        this.resizeAttempts = 0;

        const size = Math.floor(Math.min(rect.width, rect.height)) - 4;
        if (size < 100) return;

        // ⚠️ Агар бир хил ўлчам бўлса — қайта ўрнатмаймиз (циклни тўхтатиш)
        if (this.canvas.width === size && this.canvas.height === size) {
            return;
        }

        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';

        if (this.camera) this.camera.updateSize(size, size);

        console.log('📐 Canvas:', size + 'x' + size, '(wrap:', Math.round(rect.width) + 'x' + Math.round(rect.height) + ')');
    },

    // ===== Экранни кўрсатиб, сўнг мослаш =====
    showGameAndResize() {
        const screen = document.getElementById('gameScreen');

        // 1. Экранни кўрсатиш
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');

        // 2. Экранни мажбурлаймиз — reflow
        void screen.offsetHeight;

        // 3. Кейин мослаш (requestAnimationFrame билан)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.resizeCanvas();
                // Қўшимча мослаш
                setTimeout(() => this.resizeCanvas(), 100);
                setTimeout(() => this.resizeCanvas(), 300);
            });
        });
    },

    start(zone) {
        this.zone = zone;
        const mapCfg = MAP_SIZES[String(GameState.settings.mapSize)] || MAP_SIZES['500'];
        this.worldCols = mapCfg.cols;
        this.worldRows = mapCfg.rows;
        this.food = new FoodManager(this.worldCols, this.worldRows);
        // Овқат сони режимга қараб кейинроқ

        // Экранни кўрсатиб, кейин мослаш
        this.showGameAndResize();

        // Ўйинни тайёрлаш
        this.prepare();
        this.loadTop5();
    },

    async loadTop5() {
        // Аввал реал-вақт кўрсатиш
        this.renderTop5([]);

        // Кейин Firebase дан
        if (typeof FirebaseDB === 'undefined' || !FirebaseDB.isReady) {
            return;
        }
        try {
            const top = await FirebaseDB.getLeaderboard('global', 5);
            this.renderTop5(top);
        } catch (e) {
            console.error('❌ loadTop5:', e.message);
        }
    },

    renderTop5(firebaseTop) {
        const list = document.getElementById('top5List');
        if (!list) return;
        list.innerHTML = '';

        // ===== 1. ҲОЗИРГИ ЎЙИНЧИЛАР (реал-вақт) =====
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

        // Ўйинчилар сони
        if (this.isWorldMode) {
            const playerCount = GameState.settings.playerCount || 1;
            const botCount = GameState.settings.bots || 0;
            const info = document.createElement('div');
            info.style.cssText = 'font-size:10px;color:#94a3b8;text-align:center;padding:3px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:4px;';
            info.innerHTML = '👥 ' + playerCount + ' + 🤖 ' + botCount;
            list.appendChild(info);
        }

        // Live рейтинг
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

        // ===== 2. FIREBASE ТОП-5 =====
        if (firebaseTop && firebaseTop.length > 0) {
            const fbTitle = document.createElement('div');
            fbTitle.style.cssText = 'font-size:9px;color:#fbbf24;text-align:center;padding:2px;font-weight:700;margin-top:5px;border-top:1px solid rgba(255,255,255,0.1);';
            fbTitle.textContent = '🏆 УМУМИЙ РЕЙТИНГ';
            list.appendChild(fbTitle);

            const myId = TelegramAuth.user ? TelegramAuth.user.id : 0;
            firebaseTop.forEach((d, i) => {
                const isMe = d.telegramId === myId;
                const isBot = d.isBot === true;
                let name;
                if (isBot) name = '🤖 ' + (d.firstName || 'Бот');
                else name = d.username ? '@' + d.username : (d.firstName || 'X');

                const row = document.createElement('div');
                row.className = 'top5-item' + (isMe ? ' me' : '') + (isBot ? ' bot' : '');
                const icons = ['🥇','🥈','🥉','4️⃣','5️⃣'];
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

        // Режимга қараб тезлик
        let speedMultiplier = 1.0;
        if (this.mode) {
            // Махсус режимлар
            if (this.mode.id === 'speed') {
                speedMultiplier = 2.0;
            }
        } else if (this.zone) {
            speedMultiplier = this.zone.speedMultiplier || 1.0;
        }

        this.baseSpeed = CONFIG.BASE_SPEED / speedMultiplier;
        this.speed = this.baseSpeed;
        this.timeLeft = GameState.settings.gameTime;

        document.getElementById('score').textContent = 0;
        document.getElementById('respawn').textContent = this.respawnsLeft;
        document.getElementById('trophyResult').innerHTML = '';
        this.updateTimerDisplay();

        this.playerTrophies = Storage.getTrophies();

        // Ўйинчи ранги
        let playerColor = '#4ade80';
        if (this.zone) playerColor = this.zone.color;
        else if (this.mode) playerColor = this.mode.color;

        this.snake = new Snake({
            id:'player', isPlayer:true, color:playerColor, name:'Сиз',
            worldCols:this.worldCols, worldRows:this.worldRows,
            startX: Math.floor(this.worldCols/2), startY: Math.floor(this.worldRows/2), length:5
        });
        this.snakes.push(this.snake);

        // Ботлар
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

        // Овқат сони режимга қараб
        const foodCount = this.mode?.foodCount || CONFIG.FOOD_INITIAL;
        this.food.targetCount = foodCount;
        this.food.spawn(foodCount);
        console.log('🍎 Овқатлар:', foodCount, '| Карта:', this.worldCols + 'x' + this.worldRows);
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

        // ⚠️ ДИНАМИК КАРТА — дарҳол бошлаш
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
        // ⚠️ Овқатлар етарлими — автоматик тўлдириш
        // ⚠️ Овқат тўлдириш
        if (this.food.items.length < this.food.targetCount) {
            this.food.refill(Math.min(100, this.food.targetCount - this.food.items.length));
        }
        Collision.checkSnakes(this.snakes, this.food);
        if (!this.snake.alive) this.handlePlayerDeath();
        if (this.snake.alive)
            this.camera.follow(this.snake.getHead().x, this.snake.getHead().y);
        this.render();
    },

    handleFoodEaten(snake, foodItem) {
        const type = foodItem.type;
        const scoreDelta = type.score;
        if (snake.isPlayer) {
            this.score = Math.max(0, this.score + scoreDelta);
            document.getElementById('score').textContent = this.score;
        }
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

        // ⚠️ Агар вақт тугамаган бўлса — респавн
        if (this.timeLeft > 0 && this.respawnsLeft > 1) {
            this.respawnsLeft--;
            document.getElementById('respawn').textContent = this.respawnsLeft;

            console.log('💀 Ўлдингиз! Респавн... Қолган:', this.respawnsLeft);

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
            // Вақт тугаган — ўйин тугайди
            this.gameOver('Вақт тугади!');
        } else {
            // Респавнлар тугаган — вақт ҳали бор
            console.log('💀 Респавнлар тугади, лекин вақт бор. Кутиш...');
            this.snake.alive = false;

            // Кузатиш режими — вақт тугагунча
            setTimeout(() => {
                if (!this.isOver && this.timeLeft > 0) {
                    this.showOverlay('💀 Респавнлар тугади',
                        'Вақт тугагунча кузатинг\nҚолган вақт: ' + this.timeLeft + 'с', 'Кутиш');
                    document.getElementById('startBtn').style.display = 'none';
                }
            }, 500);
        }
    },

    render() {
        this.renderer.clear();
        this.renderer.drawGridLines(this.worldCols, this.worldRows);
        this.renderer.drawFood(this.food.items);
        this.snakes.forEach(s => { if (!s.isPlayer) this.renderer.drawSnake(s); });
        if (this.snake.alive) this.renderer.drawSnake(this.snake);
        this.renderer.drawMiniMap(this.snakes, this.worldCols, this.worldRows, this.camera);
        // Джойстик чизиш
        if (typeof Joystick !== 'undefined') Joystick.render(this.renderer.ctx);
    },

    async gameOver(reason) {
        if (this.isOver) return;
        this.isOver = true;
        this.isRunning = false;

        clearInterval(this.loop);
        clearInterval(this.botLoop);
        clearInterval(this.timerInterval);
        clearInterval(this.top5Interval);
        if (this.shrinkInterval) clearInterval(this.shrinkInterval);

        // ⚠️ МУҲИМ: Кубок фақат вақт тугагач тақсимланади
        const isTimeUp = reason === 'Вақт тугади!' || this.timeLeft <= 0;

        if (isTimeUp) {
            console.log('⏱ Вақт тугади — кубок тақсимлаш бошланди');
            await this.distributeTrophies();
        } else {
            console.log('💀 Ўйинчи ўлди — кубок тақсимланмайди');
            // Фақат шахсий рекорд сақланади
            Storage.setBest(this.zone?.id || this.mode?.id || 'classic', this.score);
            if (typeof FirebaseDB !== 'undefined' && FirebaseDB.isReady) {
                await FirebaseDB.saveScore(this.zone?.id || this.mode?.id || 'classic', this.score);
            }
        }

        // Реал-таймга якуний балл
        if (this.isWorldMode && this.session && RealtimeDB.isReady && TelegramAuth.user) {
            await RealtimeDB.updateScore(this.session.id, TelegramAuth.user.id, this.score);
        }

        // Натижа кўрсатиш
        const resultText = isTimeUp
            ? reason + '\nБаллингиз: ' + this.score + '\n\n🏆 Кубоклар тақсимланди!'
            : reason + '\nБаллингиз: ' + this.score + '\n\nКубок тақсимланмади (вақт тугамади)';

        this.showOverlay('Ўйин тугади!', resultText, 'Қайта ўйнаш');
        TrophiesUI.updateHeader(this.playerTrophies);
    },

    // ===== КУБОК ТАҚСИМЛАШ (вақт тугагач) =====
    async distributeTrophies() {
        // Барча илонларни йиғиш
        const players = this.snakes.map(s => ({
            id: s.id,
            name: s.name,
            score: s.isPlayer ? this.score : (s.score || 0),
            trophies: s.isPlayer ? this.playerTrophies : 0,
            isBot: !s.isPlayer
        }));

        // Балл бўйича саралаш
        players.sort((a, b) => b.score - a.score);

        console.log('📊 Балл рейтинги:');
        players.forEach((p, i) => {
            console.log('  ' + (i + 1) + '. ' + p.name + ' — ' + p.score + ' балл');
        });

        // Σ = 0 формула билан кубок ҳисоблаш
        const changes = Trophies.calculateChanges(players);

        console.log('🏆 Кубок ўзгаришлари:');
        players.forEach(p => {
            const change = changes[p.id] || 0;
            console.log('  ' + p.name + ': ' + (change > 0 ? '+' : '') + change);
        });

        // Ўйинчи учун кубок
        const playerChange = changes['player'] || 0;
        const newTotal = Math.max(0, this.playerTrophies + playerChange);

        // Firebase'га сақлаш
        if (playerChange !== 0 && typeof FirebaseDB !== 'undefined' && FirebaseDB.isReady) {
            await FirebaseDB.updateTrophies(newTotal);

            // Барча рейтингларга кубокни юбориш
            const scopes = ['global', 'country', 'region'];
            for (const scope of scopes) {
                await FirebaseDB.addToLeaderboard(scope, newTotal);
            }
        }

        Storage.saveTrophies(newTotal);
        this.playerTrophies = newTotal;

        // Бот кубокларини ҳам янгилаш
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

        // Кубок натижасини кўрсатиш
        this.showTrophyResult(playerChange, newTotal);

        // Шахсий рекорд сақлаш
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
        document.getElementById('overlayTitle').textContent = t;
        document.getElementById('overlayText').innerText = txt;
        document.getElementById('startBtn').textContent = b;

        // ⚠️ Қўшимча тугмалар
        const overlay = document.getElementById('overlay');

        // Аввалги тугмаларни тозалаш
        overlay.querySelectorAll('.overlay-extra-btn').forEach(el => el.remove());

        // Агар ўйин тугаган бўлса — орқага ва менюга тугмалар
        if (this.isOver) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'overlay-extra-btn';
            btnContainer.style.cssText = 'display:flex;gap:10px;margin-top:10px;';

            const backBtn = document.createElement('button');
            backBtn.textContent = '⬅️ Орқага';
            backBtn.style.cssText = 'padding:12px 20px;font-size:14px;font-weight:700;border-radius:40px;background:rgba(255,255,255,0.1);color:#fff;border:2px solid rgba(255,255,255,0.2);cursor:pointer;font-family:inherit;';
            backBtn.onclick = () => {
                this.hideOverlay();
                if (typeof ModesUI !== 'undefined') ModesUI.open();
            };

            const menuBtn = document.createElement('button');
            menuBtn.textContent = '🏠 Меню';
            menuBtn.style.cssText = 'padding:12px 20px;font-size:14px;font-weight:700;border-radius:40px;background:rgba(74,222,128,0.2);color:#4ade80;border:2px solid rgba(74,222,128,0.4);cursor:pointer;font-family:inherit;';
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
    },
    hideOverlay() { document.getElementById('overlay').classList.add('hidden'); },

    backToZones() {
        clearInterval(this.loop);
        clearInterval(this.botLoop);
        clearInterval(this.timerInterval);
        clearInterval(this.top5Interval);
        this.isRunning = false; this.isOver = false;
        ZonesUI.render();
        document.getElementById('bestScore').textContent = Storage.getTotalBest();
        TrophiesUI.updateHeader(this.playerTrophies);
        showScreen('zonesScreen');
    }
};

console.log('✅ game.js юкланди');

// ===== ГУРУҲ ЎЙИНИ РЕЖИМИ =====
Game.startGroup = function(groupId) {
    this.groupId = groupId;
    this.isGroupMode = true;
    console.log('🎮 Гуруҳ ўйини:', groupId);

    // Оддий ўйинга ўхшаш, лекин гуруҳ режими
    const zone = ZONES[0];
    this.zone = zone;
    const mapCfg = MAP_SIZES[String(GameState.settings.mapSize)] || MAP_SIZES['500'];
    this.worldCols = mapCfg.cols;
    this.worldRows = mapCfg.rows;
    this.food = new FoodManager(this.worldCols, this.worldRows);
        // Овқат сони режимга қараб кейинроқ

    showScreen('gameScreen');
    setTimeout(() => this.resizeCanvas(), 50);
    this.prepare();
    this.loadTop5();
};

// gameOver'да гуруҳга балл юбориш
const _originalGameOver = Game.gameOver;
Game.gameOver = async function(reason) {
    if (this.isGroupMode && this.groupId && TelegramAuth.user) {
        try {
            await FirebaseDB.updateMemberScore(
                this.groupId,
                TelegramAuth.user.id,
                this.score
            );
            console.log('✅ Гуруҳга балл юборилди:', this.score);
        } catch (e) { console.error(e); }
    }
    return _originalGameOver.call(this, reason);
};

console.log('✅ game.js гуруҳ режими қўшилди');




// ===== РЕЖИМ БЎЙИЧА ЎЙИННИ БОШЛАШ =====
Game.startMode = function(mode) {
    console.log('🎮 Режим бошланди:', mode.id);

    this.mode = mode;

    // Карта ўлчами
    const mapCfg = MAP_SIZES[String(mode.mapSize)] || MAP_SIZES['500'];
    this.worldCols = mapCfg.cols;
    this.worldRows = mapCfg.rows;

    // Созламаларни ўрнатиш
    GameState.settings.bots = mode.bots;
    GameState.settings.gameTime = mode.gameTime;
    GameState.settings.mapSize = mode.mapSize;

    // Овқат
    this.food = new FoodManager(this.worldCols, this.worldRows);
        // Овқат сони режимга қараб кейинроқ

    // Экранни кўрсатиш
    showScreen('gameScreen');

    // Мослаш
    setTimeout(() => this.resizeCanvas(), 50);
    setTimeout(() => this.resizeCanvas(), 300);
    setTimeout(() => this.resizeCanvas(), 600);

    // Ўйинни тайёрлаш
    this.prepare();
    this.loadTop5();
};

console.log('✅ game.js startMode қўшилди');

// ===== ДУНЁ РЕЖИМИ ЎЙИНИ =====
Game.startWorld = function(session, remainingTime) {
    console.log('🌍 Дунё ўйини старт:', session.id, '| Вақт:', remainingTime);

    this.mode = GAME_MODES.find(m => m.id === 'world') || GAME_MODES[1];
    this.session = session;
    this.isWorldMode = true;

    // Карта
    const mapCfg = MAP_SIZES[String(this.mode.mapSize)] || MAP_SIZES['1500'];
    this.worldCols = mapCfg.cols;
    this.worldRows = mapCfg.rows;

    // Ўйин вақти
    this.timeLeft = remainingTime;
    GameState.settings.gameTime = remainingTime;

    // ⚠️ Ўйинчилар сони + ботлар = 200
    const playerCount = session.players ? Object.keys(session.players).length : 1;
    const botCount = WorldMode.calculateBots(playerCount);

    GameState.settings.bots = botCount;
    GameState.settings.playerCount = playerCount;

    console.log('🌍 Ўйинчилар:', playerCount, '| Ботлар:', botCount, '| Жами:', playerCount + botCount + ' / 200');
    console.log('🗺️ Карта:', this.worldCols + 'x' + this.worldRows);

    // Овқат
    this.food = new FoodManager(this.worldCols, this.worldRows);

    showScreen('gameScreen');
    setTimeout(() => this.resizeCanvas(), 50);
    setTimeout(() => this.resizeCanvas(), 300);

    this.prepare();
    this.loadTop5();

    // Реал-тайм sync
    if (RealtimeDB.isReady && session.id && !session.id.startsWith('local_')) {
        this.worldUpdateInterval = setInterval(() => {
            if (this.score > 0 && this.snake) {
                RealtimeDB.updateScore(session.id, TelegramAuth.user.id, this.score);
            }
        }, 5000);
    }
};

// ===== Дунё режимида ўйин тугаганда =====
const _originalGameOverWorld = Game.gameOver;
Game.gameOver = async function(reason) {
    if (this.worldUpdateInterval) {
        clearInterval(this.worldUpdateInterval);
        this.worldUpdateInterval = null;
    }

    // Реал-таймга якуний балл юбориш
    if (this.isWorldMode && this.session && RealtimeDB.isReady && TelegramAuth.user) {
        await RealtimeDB.updateScore(this.session.id, TelegramAuth.user.id, this.score);
    }

    return _originalGameOverWorld.call(this, reason);
};

console.log('✅ game.js startWorld қўшилди');




// ===== БОТЛАР КУБОК ЙИҒИШИ (Firebase) =====
Game.updateBotTrophies = async function() {
    if (typeof FirebaseDB === 'undefined' || !FirebaseDB.isReady) {
        console.log('⚠️ Firebase йўқ — бот кубоклари сақланмаяпти');
        return;
    }

    // Ҳар ботнинг баллига қараб кубок
    const players = this.snakes.map(s => ({
        id: s.id,
        name: s.name,
        score: s.isPlayer ? this.score : (s.score || 0),
        isBot: !s.isPlayer
    }));

    // Σ = 0 формула
    const changes = Trophies.calculateChanges(players);

    // Ҳар ботга кубок — Firebase'га
    for (const p of players) {
        if (p.isBot) {
            const change = changes[p.id] || 0;
            const current = await FirebaseDB.getBotTrophy(p.id);
            const newTotal = Math.max(0, current + change);
            await FirebaseDB.updateBotTrophy(p.id, newTotal, { name: p.name });
        }
    }
    console.log('🤖 Бот кубоклари Firebase\'га сақланди');
};

// gameOver да бот кубокларини янгилаш
const _originalGameOverBots = Game.gameOver;
Game.gameOver = async function(reason) {
    if (this.updateBotTrophies) {
        try { await this.updateBotTrophies(); } catch (e) { console.error(e); }
    }
    return _originalGameOverBots.call(this, reason);
};

console.log('✅ game.js бот кубоклари қўшилди');



// ===== ДИНАМИК КАРТА =====
Game.startMapShrink = function() {
    if (!CONFIG.MAP_SHRINK_ENABLED) {
        console.log('⚠️ Динамик карта ўчирилган');
        return;
    }

    // Аввалги интервални тозалаш
    if (this.shrinkInterval) {
        clearInterval(this.shrinkInterval);
        this.shrinkInterval = null;
    }

    this.originalWorldCols = this.worldCols;
    this.originalWorldRows = this.worldRows;
    this.shrinkStep = 0;

    // ⚠️ Бошланғич овқат сонини сақлаш
    this.initialFoodCount = this.food.items.length;
    this.currentFoodTarget = this.initialFoodCount;

    console.log('🗺️ Динамик карта бошланди:', this.worldCols + 'x' + this.worldRows,
                '| Овқат:', this.initialFoodCount);

    this.shrinkInterval = setInterval(() => {
        if (!this.isRunning) return;

        const currentSize = this.worldCols;
        const newSize = Math.max(
            CONFIG.MIN_MAP_SIZE,
            Math.floor(currentSize * (1 - CONFIG.SHRINK_PERCENT))
        );

        if (newSize === currentSize) {
            console.log('📏 Минимал ўлчамга етди:', currentSize);
            return;
        }

        this.shrinkStep++;
        const oldSize = currentSize;
        const shrinkRatio = newSize / oldSize;  // Мисол: 0.8

        // ===== 1. КАРТА КИЧРАЯДИ =====
        this.worldCols = newSize;
        this.worldRows = newSize;

        // ===== 2. ОВҚАТЛАР КАМАЯДИ =====
        // Овқат сони картага пропорционал камаяди
        // Формула: янги = эски × (янги карта / эски карта)²
        const areaRatio = shrinkRatio * shrinkRatio;  // 0.8² = 0.64
        const newFoodTarget = Math.max(
            CONFIG.MIN_FOOD,  // Минимал овқат
            Math.floor(this.currentFoodTarget * areaRatio)
        );

        const oldFoodCount = this.food.items.length;
        this.currentFoodTarget = newFoodTarget;
        this.food.targetCount = newFoodTarget;

        // Ортиқча овқатларни олиб ташлаш
        if (this.food.items.length > newFoodTarget) {
            // Тасодифий олиб ташлаш
            const toRemove = this.food.items.length - newFoodTarget;
            for (let i = 0; i < toRemove; i++) {
                const idx = Math.floor(Math.random() * this.food.items.length);
                this.food.items.splice(idx, 1);
            }
        }

        // Овқатларни янги картага мослаш
        this.food.cols = newSize;
        this.food.rows = newSize;

        // Картадан ташқаридаги овқатларни кўчириш
        this.food.items.forEach(f => {
            if (f.x >= newSize || f.y >= newSize) {
                f.x = Math.floor(Math.random() * newSize);
                f.y = Math.floor(Math.random() * newSize);
            }
        });

        // ===== 3. ИЛОНЛАРНИ МОСЛАШ =====
        this.snakes.forEach(s => {
            if (!s.alive) return;
            s.worldCols = newSize;
            s.worldRows = newSize;

            s.body.forEach(seg => {
                if (seg.x >= newSize) seg.x = Math.floor(Math.random() * newSize);
                if (seg.y >= newSize) seg.y = Math.floor(Math.random() * newSize);
                if (seg.x < 0) seg.x = 0;
                if (seg.y < 0) seg.y = 0;
            });
        });

        // ===== 4. КАМЕРА МОСЛАШ =====
        if (this.camera) {
            const size = Math.min(this.canvas.width, this.canvas.height) - 4;
            this.camera.updateSize(size, size);
        }

        // ===== 5. ХАБАР КЎРСАТИШ =====
        this.showShrinkMessage(newSize, oldFoodCount, newFoodTarget);

        console.log('🗺️ Карта:', oldSize + '→' + newSize,
                    '| 🍎 Овқат:', oldFoodCount + '→' + newFoodTarget,
                    '(қадам:', this.shrinkStep + ')');
    }, CONFIG.SHRINK_INTERVAL);
};

// ===== КАРТА КИЧРАЙГАНДА ХАБАР =====
Game.showShrinkMessage = function(newSize, oldFood, newFood) {
    const el = document.getElementById('shrinkMessage');
    if (!el) return;

    // Хабар матни
    const foodInfo = (oldFood !== undefined && newFood !== undefined)
        ? ' · 🍎 ' + oldFood + ' → ' + newFood
        : '';
    el.textContent = '⚠️ Карта кичрайди: ' + newSize + '×' + newSize + foodInfo;
    el.style.opacity = '1';
    el.style.display = 'block';

    // Аввалги timeout тозалаш
    if (el._timeout) clearTimeout(el._timeout);
    el._timeout = setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => { el.style.display = 'none'; }, 500);
    }, 3000);
};

// ===== gameOver да тозалаш =====
const _originalGameOverShrinkFix = Game.gameOver;
Game.gameOver = async function(reason) {
    if (this.shrinkInterval) {
        clearInterval(this.shrinkInterval);
        this.shrinkInterval = null;
        console.log('🛑 Динамик карта тўхтатилди');
    }
    return _originalGameOverShrinkFix.call(this, reason);
};

console.log('✅ game.js динамик карта (тузатилган)');









